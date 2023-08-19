// import { Paystack } from "@paystack/paystack-sdk";
// import type { Transaction } from "@paystack/paystack-sdk/lib/types/apis/Transaction";

import Paystack, { PaystackTransactionAuthorisation } from "../lib/paystack";

import {
  AbstractPaymentProcessor,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  MedusaContainer,
} from "@medusajs/medusa";
import { MedusaError, MedusaErrorTypes } from "@medusajs/utils";
import { validateCurrencyCode } from "../utils/currencyCode";

export interface PaystackPaymentProcessorConfig {
  /**
   * Paystack Secret Key
   *
   * Should be in the format sk_test-... or sk_live-...
   *
   * Obtainable from the Paystack dashboard - Settings -> API Keys & Webhooks
   *
   * https://dashboard.paystack.com/#/settings/developers
   */
  secret_key: string;
}

class PaystackPaymentProcessor extends AbstractPaymentProcessor {
  static identifier = "paystack";

  protected readonly configuration: PaystackPaymentProcessorConfig;
  protected readonly paystack: Paystack;

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
  }

  get paymentIntentOptions() {
    return {};
  }

  /**
   * Called when a user selects Paystack as their payment method during checkout
   */
  async initiatePayment(context: PaymentProcessorContext): Promise<
    | PaymentProcessorError
    | (PaymentProcessorSessionResponse & {
        session_data: {
          paystackTxRef: string;
          paystackTxAuthData: PaystackTransactionAuthorisation;
        };
      })
  > {
    const { amount, email, currency_code } = context;

    const validatedCurrencyCode = validateCurrencyCode(currency_code);

    const { data, status, message } =
      await this.paystack.transaction.initialize({
        amount,
        email,
        currency: validatedCurrencyCode,
      });

    if (status === false) {
      return this.buildError("Failed to initiate Paystack payment", {
        detail: message,
      });
    }

    return {
      session_data: {
        paystackTxRef: data.reference,
        paystackTxAuthData: data,
      },
    };
  }

  /**
   * Called when a user updates their cart after `initiatePayment` has been called
   * We build a new reference here to ensure that the user is not charged twice
   */
  async updatePaymentData(
    _: string,
    data: Record<string, unknown>,
  ): Promise<
    PaymentProcessorSessionResponse["session_data"] | PaymentProcessorError
  > {
    if (data.amount) {
      throw new MedusaError(
        MedusaErrorTypes.INVALID_DATA,
        "Cannot update amount from updatePaymentData",
      );
    }

    return {
      session_data: {
        ...data, // We just return the data as is
      },
    };
  }

  /**
   * Called when a cart item is added or shipping address is updated
   */
  async updatePayment(context: PaymentProcessorContext): Promise<
    | PaymentProcessorError
    | (PaymentProcessorSessionResponse & {
        session_data: {
          paystackTxRef: string;
        };
      })
  > {
    // Re-initialize the payment
    return this.initiatePayment(context);
  }

  /**
   * Called when a cart is completed
   * We validate the payment and return a status
   */
  async authorizePayment(
    paymentSessionData: Record<string, unknown> & { paystackTxRef: string },
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus;
        data: Record<string, unknown>;
      }
  > {
    try {
      const { paystackTxRef } = paymentSessionData;

      const { status, data } = await this.paystack.transaction.verify({
        reference: paystackTxRef,
      });

      if (status === false) {
        // Invalid key error
        return {
          status: PaymentSessionStatus.ERROR,
          data: {
            ...paymentSessionData,
            paystackTxId: null,
            paystackTxData: data,
          },
        };
      }

      switch (data.status) {
        case "success": {
          // Successful transaction
          return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: {
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

        default:
          // Pending transaction
          return {
            status: PaymentSessionStatus.PENDING,
            data: paymentSessionData,
          };
      }
    } catch (error) {
      return this.buildError("Failed to authorize payment", error);
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

      const { data, status, message } = await this.paystack.transaction.get({
        id: paystackTxId,
      });

      if (status === false) {
        return this.buildError("Failed to retrieve payment", {
          detail: message,
        });
      }

      return {
        ...paymentSessionData,
        paystackTxData: data,
      };
    } catch (error) {
      return this.buildError("Failed to retrieve payment", error);
    }
  }

  /**
   * Refunds payment for Paystack transaction
   */
  async refundPayment(
    paymentSessionData: Record<string, string>,
    refundAmount: number,
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    try {
      const { paystackTxId } = paymentSessionData;

      const { data, status, message } = await this.paystack.refund.create({
        transaction: paystackTxId,
        amount: refundAmount,
      });

      if (status === false) {
        return this.buildError("Failed to refund payment", {
          detail: message,
        });
      }

      return {
        ...paymentSessionData,
        paystackTxData: data,
      };
    } catch (error) {
      return this.buildError("Failed to refund payment", error);
    }
  }

  /**
   * Returns Paystack transaction status
   */
  async getPaymentStatus(
    paymentSessionData: Record<string, unknown> & { paystackTxId?: string },
  ): Promise<PaymentSessionStatus> {
    const { paystackTxId } = paymentSessionData;

    if (!paystackTxId) {
      return PaymentSessionStatus.PENDING;
    }

    try {
      const { data, status } = await this.paystack.transaction.get({
        id: paystackTxId,
      });

      if (status === false) {
        return PaymentSessionStatus.ERROR;
      }

      switch (data?.status) {
        case "success":
          return PaymentSessionStatus.AUTHORIZED;
        case "failed":
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

  protected buildError(
    message: string,
    e:
      | {
          code?: string;
          detail: string;
        }
      | Error,
  ): PaymentProcessorError {
    return {
      error: "Paystack Payment error: " + message,
      code: "code" in e ? e.code : "PAYSTACK_PAYMENT_ERROR",
      detail: "detail" in e ? e.detail : e.message ?? "",
    };
  }
}

export default PaystackPaymentProcessor;
