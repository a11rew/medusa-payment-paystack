import Paystack from "paystack-api";
import { createId } from "@paralleldrive/cuid2";

import {
  AbstractPaymentProcessor,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  MedusaContainer,
} from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";

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
  async initiatePayment(): Promise<
    | PaymentProcessorError
    | (PaymentProcessorSessionResponse & {
        session_data: {
          paystackTxRef: string;
        };
      })
  > {
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
  ): Promise<
    | {
        session_data: {
          paystackTxRef: string;
        };
      }
    | PaymentProcessorError
  > {
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
  async updatePayment(context: PaymentProcessorContext): Promise<
    | PaymentProcessorError
    | (PaymentProcessorSessionResponse & {
        session_data: {
          paystackTxRef: string;
        };
      })
  > {
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
    paymentSessionData: Record<string, unknown> & { paystackTxId?: string },
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
}

export default PaystackPaymentProcessor;
