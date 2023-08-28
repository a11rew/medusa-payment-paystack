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

  debug?: boolean;
}

class PaystackPaymentProcessor extends AbstractPaymentProcessor {
  static identifier = "paystack";

  protected readonly configuration: PaystackPaymentProcessorConfig;
  protected readonly paystack: Paystack;
  protected readonly debug: boolean;

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
    this.debug = Boolean(options.debug);
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
    if (this.debug) {
      console.info(
        "PS_P_Debug: InitiatePayment",
        JSON.stringify(context, null, 2),
      );
    }

    const { amount, email, currency_code } = context;

    const validatedCurrencyCode = validateCurrencyCode(currency_code);

    const { data, status, message } =
      await this.paystack.transaction.initialize({
        amount: amount * 100, // Paystack expects amount in lowest denomination - https://paystack.com/docs/payments/accept-payments/#initialize-transaction-1
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
   */
  async updatePaymentData(
    _: string,
    data: Record<string, unknown>,
  ): Promise<
    PaymentProcessorSessionResponse["session_data"] | PaymentProcessorError
  > {
    if (this.debug) {
      console.info(
        "PS_P_Debug: UpdatePaymentData",
        JSON.stringify({ _, data }, null, 2),
      );
    }

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
    if (this.debug) {
      console.info(
        "PS_P_Debug: UpdatePayment",
        JSON.stringify(context, null, 2),
      );
    }

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
    if (this.debug) {
      console.info(
        "PS_P_Debug: AuthorizePayment",
        JSON.stringify(paymentSessionData, null, 2),
      );
    }

    try {
      const { paystackTxRef } = paymentSessionData;

      const { status, data } = await this.paystack.transaction.verify({
        reference: paystackTxRef,
      });

      if (this.debug) {
        console.info(
          "PS_P_Debug: AuthorizePayment: Verification",
          JSON.stringify({ status, data }, null, 2),
        );
      }

      // TODO: Verify currency
      // TODO: Verify amount

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
        case "success":
          // Successful transaction
          return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: {
              paystackTxId: data.id,
              paystackTxData: data,
            },
          };

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
    if (this.debug) {
      console.info(
        "PS_P_Debug: RetrievePayment",
        JSON.stringify(paymentSessionData, null, 2),
      );
    }

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
    if (this.debug) {
      console.info(
        "PS_P_Debug: RefundPayment",
        JSON.stringify({ paymentSessionData, refundAmount }, null, 2),
      );
    }

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
    if (this.debug) {
      console.info(
        "PS_P_Debug: GetPaymentStatus",
        JSON.stringify(paymentSessionData, null, 2),
      );
    }

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
