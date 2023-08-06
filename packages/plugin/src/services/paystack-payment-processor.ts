import Paystack from "paystack-api";
import { createId } from "@paralleldrive/cuid2";

import {
  AbstractPaymentProcessor,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  MedusaContainer,
  CartService,
} from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";

interface PaystackPaymentProcessorConfig {
  secret_key: string;
}

class PaystackPaymentProcessor extends AbstractPaymentProcessor {
  static identifier = "paystack";

  protected readonly configuration: PaystackPaymentProcessorConfig;
  protected readonly cartService: CartService;
  protected readonly paystack: Paystack;

  protected buildError(
    message: string,
    e:
      | {
          code: string;
          detail: string;
        }
      | Error,
  ): PaymentProcessorError {
    return {
      error: message,
      code: "code" in e ? e.code : "",
      detail: "detail" in e ? e.detail : e.message ?? "",
    };
  }

  constructor(
    container: MedusaContainer,
    options: PaystackPaymentProcessorConfig,
  ) {
    super(container);

    if (!options.secret_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "The Paystack provider requires the secret_key option",
      );
    }

    this.configuration = options;
    this.paystack = new Paystack(this.configuration.secret_key);
    this.cartService = container.resolve("cartService");
  }

  /**
   * Called when a user selects Paystack as their payment method during checkout
   */
  async initiatePayment(
    context: PaymentProcessorContext,
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    const reference = createId();

    return {
      session_data: {
        paystackTxRef: reference,
      },
    };
  }

  /**
   * Called when a user updates their cart after `initiatePayment` has been called
   * We build a new reference here to ensure that the user is not charged twice
   */
  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    const reference = createId();

    return {
      session_data: {
        ...data, // We return the previous data as well
        paystackTxRef: reference,
      },
    };
  }

  /**
   * Called when a cart item is added or shipping address is updated
   */
  async updatePayment(
    context: PaymentProcessorContext,
  ): Promise<void | PaymentProcessorError | PaymentProcessorSessionResponse> {
    const reference = createId();

    return {
      ...context,
      session_data: {
        paystackTxRef: reference,
      },
    };
  }

  /**
   * Called when a cart is completed
   * We validate the payment and return a status
   */
  async authorizePayment(
    paymentSessionData: Record<string, unknown> & { paystackTxRef: string },
    context: {
      cart_id: string;
    },
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus;
        data: Record<string, unknown>;
      }
  > {
    try {
      const { paystackTxRef } = paymentSessionData;

      const { data } = await this.paystack.transaction.verify({
        reference: paystackTxRef,
      });

      switch (data.status) {
        case "success": {
          // Successful transaction

          // Validate payment details
          // Verify that the amount and transaction currency recieved is the same as in the cart

          // Rounded to the nearest currency unit
          const paystackPaidAmount = Math.round(data.amount);
          const paystackPaidCurrency = String(data.currency).toLowerCase();

          const cart = await this.cartService.retrieveWithTotals(
            context.cart_id,
          );

          // Rounded to the nearest currency unit
          const cartTotal = Math.round(cart.total);
          const cartCurrency = String(cart.region.currency_code).toLowerCase();

          if (
            paystackPaidAmount === cartTotal &&
            paystackPaidCurrency === cartCurrency
          ) {
            // Payment is valid
            return {
              status: PaymentSessionStatus.AUTHORIZED,
              data: {
                paystackTxId: data.id,
                paystackTxData: data,
              },
            };
          }

          // Payment is invalid
          // At this point the user has already paid, but the payment is invalid

          // Issue refund (reverse the payment)
          await this.refundPayment(
            {
              ...paymentSessionData,
              paystackTxId: data.id,
              paystackTxData: data,
            },
            data.amount,
          );

          // Mark payment as failed
          return {
            status: PaymentSessionStatus.ERROR,
            data: {
              ...paymentSessionData,
              paystackTxId: data.id,
              paystackTxData: data,
            },
          };
        }

        case "failed":
          // Failed transaction
          return {
            status: PaymentSessionStatus.ERROR,
            data: {
              ...paymentSessionData,
              paystackTxId: data.id,
              paystackTxData: data,
            },
          };

        case false:
          // Invalid key error
          return {
            status: PaymentSessionStatus.ERROR,
            data: {
              ...paymentSessionData,
              paystackTxId: null,
              paystackTxData: data,
            },
          };
        default:
          // Pending transaction
          return {
            status: PaymentSessionStatus.PENDING,
            data: paymentSessionData,
          };
      }
    } catch (error) {
      return this.buildError("Error authorizing payment", error);
    }
  }

  /**
   * Retrieve transaction data from Paystack.
   */
  async retrievePayment(
    paymentSessionData: Record<string, unknown> & { paystackTxId: string },
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    try {
      const { paystackTxId } = paymentSessionData;

      const { data } = await this.paystack.transaction.get({
        id: paystackTxId,
      });

      return {
        ...paymentSessionData,
        paystackTxData: data,
      };
    } catch (error) {
      return this.buildError("Error retrieving payment", error);
    }
  }

  /**
   * Refunds payment for Paystack transaction
   */
  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number,
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    try {
      const { paystackTxId } = paymentSessionData;

      const { data } = await this.paystack.refund.create({
        transaction: paystackTxId,
        amount: refundAmount,
      });

      return {
        ...paymentSessionData,
        paystackTxData: data,
      };
    } catch (error) {
      return this.buildError("Error refunding payment", error);
    }
  }

  /**
   * Returns Paystack transaction status
   */
  async getPaymentStatus(
    paymentSessionData: Record<string, unknown> & { paystackTxId: string },
  ): Promise<PaymentSessionStatus> {
    const { paystackTxId } = paymentSessionData;

    if (!paystackTxId) {
      return PaymentSessionStatus.PENDING;
    }

    try {
      const { data } = await this.paystack.transaction.get({
        id: paystackTxId,
      });

      switch (data?.status) {
        case "success":
          return PaymentSessionStatus.AUTHORIZED;
        case "failed":
          return PaymentSessionStatus.ERROR;
        case false:
          return PaymentSessionStatus.ERROR;
        default:
          return PaymentSessionStatus.PENDING;
      }
    } catch (error) {
      return PaymentSessionStatus.ERROR;
    }
  }

  /**
   * Marks payment as captured. Transactions are 'captured' by default in Paystack.
   * So this just returns the payment session data.
   */
  async capturePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    return paymentSessionData;
  }

  /**
   * Cancel payment for Paystack payment intent.
   * This is not supported by Paystack - transactions are stateless.
   */
  async cancelPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    return paymentSessionData;
  }
  /**
   * Delete payment for Paystack payment intent.
   * This is not supported by Paystack - transactions are stateless.
   */
  async deletePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    return paymentSessionData;
  }
}

export default PaystackPaymentProcessor;
