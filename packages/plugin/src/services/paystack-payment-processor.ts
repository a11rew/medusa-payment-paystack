import crypto from "crypto";

import Paystack from "../lib/paystack";

import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
  type CancelPaymentInput,
  type CancelPaymentOutput,
} from "@medusajs/framework/types";
import {
  MedusaError,
  PaymentSessionStatus,
  AbstractPaymentProvider,
  PaymentActions,
} from "@medusajs/framework/utils";
import { formatCurrencyCode } from "../utils/currencyCode";

export type PaystackPaymentProviderSessionData = {
  paystackTxRef: string;
  paystackTxAccessCode: string;
  paystackTxAuthorizationUrl: string;
};

export type AuthorizedPaystackPaymentProviderSessionData =
  PaystackPaymentProviderSessionData & {
    paystackTxId: number;
    paystackTxData: Record<string, unknown>;
  };

export interface PaystackPaymentProcessorConfig
  extends Record<string, unknown> {
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

  /**
   * Disable retries on network errors and 5xx errors on idempotent requests to Paystack
   *
   * Generally, you should not disable retries, these errors are usually temporary
   * but it can be useful for debugging
   * @default false
   */
  disable_retries?: boolean;

  /**
   * Debug mode
   * If true, logs helpful debug information to the console
   * Logs are prefixed with "PS_P_Debug"
   */
  debug?: boolean;
}

class PaystackPaymentProcessor extends AbstractPaymentProvider<PaystackPaymentProcessorConfig> {
  static identifier = "paystack";

  protected readonly configuration: PaystackPaymentProcessorConfig;
  protected readonly paystack: Paystack;
  protected readonly debug: boolean;

  constructor(
    cradle: Record<string, unknown>,
    options: PaystackPaymentProcessorConfig,
  ) {
    super(cradle, options);

    if (!options.secret_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "The Paystack provider requires the secret_key option",
      );
    }

    this.configuration = options;
    this.paystack = new Paystack(this.configuration.secret_key, {
      disable_retries: options.disable_retries,
    });
    this.debug = Boolean(options.debug);
  }

  /**
   * Called when a user selects Paystack as their payment method during checkout
   */
  async initiatePayment(
    initiatePaymentData: InitiatePaymentInput,
  ): Promise<InitiatePaymentOutput> {
    if (this.debug) {
      console.info(
        "PS_P_Debug: InitiatePayment",
        JSON.stringify(initiatePaymentData, null, 2),
      );
    }

    const { data, amount, currency_code } = initiatePaymentData;
    const { email, session_id } = (data ?? {}) as {
      email?: string;
      session_id?: string;
    };

    const validatedCurrencyCode = formatCurrencyCode(currency_code);

    if (!email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Email is required to initiate a Paystack payment. Ensure you are providing the email in the context object when calling `initiatePaymentSession` in your Medusa storefront",
      );
    }

    try {
      const {
        data: psData,
        status,
        message,
      } = await this.paystack.transaction.initialize({
        amount: Number(amount) * 100, // Paystack expects amount in lowest denomination - https://paystack.com/docs/api/#supported-currency
        email,
        currency: validatedCurrencyCode,
        metadata: {
          session_id,
        },
      });

      if (status === false) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to initiate Paystack payment",
          message,
        );
      }

      return {
        id: psData.reference,
        status: PaymentSessionStatus.PENDING,
        data: {
          paystackTxRef: psData.reference,
          paystackTxAccessCode: psData.access_code,
          paystackTxAuthorizationUrl: psData.authorization_url,
        } satisfies PaystackPaymentProviderSessionData,
      };
    } catch (error) {
      if (this.debug) {
        console.error("PS_P_Debug: InitiatePayment: Error", error);
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to initiate Paystack payment",
        error?.toString() ?? "Unknown error",
      );
    }
  }

  /**
   * Called when a cart item is added or shipping address is updated
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    if (this.debug) {
      console.info("PS_P_Debug: UpdatePayment", JSON.stringify(input, null, 2));
    }

    // Paystack does not support updating transactions
    // We abandon the current transaction and create a new one instead
    const session = await this.initiatePayment(input);

    return {
      data: session.data,
      status: session.status,
    };
  }

  /**
   * Called when a cart is completed
   * We validate the payment and return a status
   */
  async authorizePayment(
    input: AuthorizePaymentInput,
  ): Promise<AuthorizePaymentOutput> {
    if (this.debug) {
      console.info(
        "PS_P_Debug: AuthorizePayment",
        JSON.stringify(input, null, 2),
      );
    }

    try {
      const { paystackTxRef } =
        input.data as PaystackPaymentProviderSessionData;

      if (!paystackTxRef) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing paystackTxRef in payment data.",
        );
      }

      const { status: psStatus, data } = await this.paystack.transaction.verify(
        { reference: paystackTxRef },
      );

      if (this.debug) {
        console.info(
          "PS_P_Debug: AuthorizePayment: Verification",
          JSON.stringify({ psStatus, data }, null, 2),
        );
      }

      if (psStatus === false) {
        // Invalid key error
        return {
          status: PaymentSessionStatus.ERROR,
          data: {
            ...input.data,
            paystackTxId: data.id,
            paystackTxData: data,
          },
        };
      }

      switch (data.status) {
        case "success":
          // Successful transaction
          return {
            // Captured instead of authorized so they are automatically captured
            status: PaymentSessionStatus.CAPTURED,
            data: {
              ...input.data,
              paystackTxId: data.id,
              paystackTxData: data,
            },
          };
        case "failed":
          // Failed transaction
          return {
            status: PaymentSessionStatus.ERROR,
            data: {
              ...input.data,
              paystackTxId: data.id,
              paystackTxData: data,
            },
          };
        default:
          // Pending transaction
          return {
            status: PaymentSessionStatus.PENDING,
            data: {
              ...input.data,
              paystackTxId: data.id,
              paystackTxData: data,
            },
          };
      }
    } catch (error) {
      if (this.debug) {
        console.error("PS_P_Debug: AuthorizePayment: Error", error);
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to authorize payment",
        error?.toString() ?? "Unknown error",
      );
    }
  }

  /**
   * Retrieve transaction data from Paystack.
   */
  async retrievePayment(
    input: RetrievePaymentInput,
  ): Promise<RetrievePaymentOutput> {
    if (this.debug) {
      console.info(
        "PS_P_Debug: RetrievePayment",
        JSON.stringify(input, null, 2),
      );
    }

    try {
      const { paystackTxId } =
        input.data as AuthorizedPaystackPaymentProviderSessionData;

      if (!paystackTxId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing paystackTxId in payment data. This payment has not been authorized.",
        );
      }

      const { data, status, message } = await this.paystack.transaction.get({
        id: paystackTxId,
      });

      if (status === false) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to retrieve payment",
          message,
        );
      }

      return {
        data: {
          ...input.data,
          paystackTxData: data,
        },
      };
    } catch (error) {
      if (this.debug) {
        console.error("PS_P_Debug: RetrievePayment: Error", error);
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to retrieve payment",
        error?.toString() ?? "Unknown error",
      );
    }
  }

  /**
   * Refunds payment for Paystack transaction
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    if (this.debug) {
      console.info("PS_P_Debug: RefundPayment", JSON.stringify(input, null, 2));
    }

    try {
      const { paystackTxId } =
        input.data as AuthorizedPaystackPaymentProviderSessionData;

      if (!paystackTxId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing paystackTxId in payment data.",
        );
      }

      const { data, status, message } = await this.paystack.refund.create({
        transaction: paystackTxId,
        amount: Number(input.amount),
      });

      if (status === false) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to refund payment",
          message,
        );
      }

      return {
        data: {
          ...input.data,
          paystackTxData: data,
        },
      };
    } catch (error) {
      if (this.debug) {
        console.error("PS_P_Debug: RefundPayment: Error", error);
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to refund payment",
        error?.toString() ?? "Unknown error",
      );
    }
  }

  /**
   * Returns Paystack transaction status
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<GetPaymentStatusOutput> {
    if (this.debug) {
      console.info(
        "PS_P_Debug: GetPaymentStatus",
        JSON.stringify(input, null, 2),
      );
    }

    const { paystackTxId } =
      input.data as AuthorizedPaystackPaymentProviderSessionData;

    if (!paystackTxId) {
      return { status: PaymentSessionStatus.PENDING };
    }

    try {
      const { data, status } = await this.paystack.transaction.get({
        id: paystackTxId,
      });

      if (this.debug) {
        console.info(
          "PS_P_Debug: GetPaymentStatus: Verification",
          JSON.stringify({ status, data }, null, 2),
        );
      }

      if (status === false) {
        return { status: PaymentSessionStatus.ERROR };
      }

      switch (data?.status) {
        case "success":
          return { status: PaymentSessionStatus.AUTHORIZED };
        case "failed":
          return { status: PaymentSessionStatus.ERROR };
        default:
          return { status: PaymentSessionStatus.PENDING };
      }
    } catch (error) {
      if (this.debug) {
        console.error("PS_P_Debug: GetPaymentStatus: Error", error);
      }

      return { status: PaymentSessionStatus.ERROR };
    }
  }

  /**
   * Handles incoming webhook events from Paystack
   */
  async getWebhookActionAndData({
    data: { event, data },
    rawData,
    headers,
  }: {
    data: {
      event: string;
      data: {
        amount: number;
        metadata?: Record<string, unknown>;
      };
    };
    rawData: string | Buffer;
    headers: Record<string, unknown>;
  }): Promise<WebhookActionResult> {
    if (this.debug) {
      console.info(
        "PS_P_Debug: Handling webhook event",
        JSON.stringify({ data, headers }, null, 2),
      );
    }

    const webhookSecretKey = this.configuration.secret_key;

    // Validate webhook event
    const hash = crypto
      .createHmac("sha512", webhookSecretKey)
      .update(rawData)
      .digest("hex");

    if (hash !== headers["x-paystack-signature"]) {
      return {
        action: PaymentActions.NOT_SUPPORTED,
      };
    }

    // Validate event type
    if (event !== "charge.success") {
      return {
        action: PaymentActions.NOT_SUPPORTED,
      };
    }

    const sessionId = data.metadata?.session_id
      ? String(data.metadata.session_id)
      : undefined;

    if (!sessionId) {
      if (this.debug) {
        console.error(
          "PS_P_Debug: No sessionId found in webhook transaction metadata",
        );
      }
      return {
        action: PaymentActions.NOT_SUPPORTED,
      };
    }

    if (this.debug) {
      console.info(
        "PS_P_Debug: Webhook event is valid",
        JSON.stringify({ sessionId, amount: data.amount }, null, 2),
      );
    }

    return {
      action: PaymentActions.AUTHORIZED,
      data: {
        session_id: sessionId,
        amount: data.amount,
      },
    };
  }

  /**
   * Marks payment as captured. Transactions are 'captured' by default in Paystack.
   * So this just returns the payment session data.
   */
  async capturePayment(
    input: CapturePaymentInput,
  ): Promise<CapturePaymentOutput> {
    return { data: input.data };
  }

  /**
   * Cancel payment for Paystack payment intent.
   * This is not supported by Paystack - transactions are stateless.
   */
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data };
  }

  /**
   * Delete payment for Paystack payment intent.
   * This is not supported by Paystack - transactions are stateless.
   */
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data };
  }
}

export default PaystackPaymentProcessor;
