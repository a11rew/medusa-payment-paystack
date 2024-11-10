import {
  PaymentActions,
  PaymentSessionStatus,
  isPaymentProviderError,
} from "@medusajs/framework/utils";
import {
  PaymentProviderError,
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
} from "@medusajs/types";
import crypto from "crypto";

import PaystackPaymentProcessor, {
  PaystackPaymentProcessorConfig,
} from "../paystack-payment-processor";
import { paystackMockServer } from "../../lib/__mocks__/paystack";

const TEST_SECRET_KEY = "sk_test_123";

// Helpers
function createPaystackProviderService(
  options: PaystackPaymentProcessorConfig = {
    secret_key: TEST_SECRET_KEY,
  },
) {
  return new PaystackPaymentProcessor(
    // @ts-expect-error - We don't need to mock the dependency container
    {},
    options,
  );
}

function checkForPaymentProcessorError<T>(response: T | PaymentProviderError) {
  // Check for error
  if (isPaymentProviderError(response)) {
    throw new Error(response.detail);
  }

  // Narrow type
  return response as T;
}

const demoCreatePaymentProviderSession = {
  amount: 100,
  currency_code: "GHS",
  context: {
    email: "andrew@a11rew.dev",
  },
} satisfies CreatePaymentProviderSession;

beforeAll(() => {
  paystackMockServer.listen();
});

afterEach(() => {
  paystackMockServer.resetHandlers();
});

afterAll(() => {
  paystackMockServer.close();
});

describe("Provider Service Initialization", () => {
  it("initializes the provider service", () => {
    const service = createPaystackProviderService();
    expect(service).toBeTruthy();
  });

  it("fails initialization if secret_key is not provided", () => {
    expect(() => {
      void createPaystackProviderService({
        // @ts-expect-error - We are testing for missing secretKey, helper has default value
        secret_key: undefined,
      });
    }).toThrow();
  });
});

describe("initiatePayment", () => {
  it("returns a payment session with a transaction reference", async () => {
    const service = createPaystackProviderService();
    const { data } = checkForPaymentProcessorError(
      await service.initiatePayment({
        amount: 100,
        currency_code: "GHS",
        context: {
          email: "andrew@a11rew.dev",
        },
      }),
    );

    expect(data.paystackTxRef).toBeTruthy();
    expect(data.paystackTxRef).toEqual(expect.any(String));
  });

  it("errors out if email is not provided", async () => {
    const service = createPaystackProviderService();
    const response = await service.initiatePayment({
      amount: 100,
      currency_code: "GHS",
      context: {},
    });

    expect(isPaymentProviderError(response)).toBeTruthy();
    expect((response as PaymentProviderError).error).toContain(
      "Email is required",
    );
  });

  it("returns errors from Paystack", async () => {
    const service = createPaystackProviderService();
    const response = await service.initiatePayment({
      amount: "invalid-amount",
      currency_code: "GHS",
      context: {
        email: "andrew@a11rew.dev",
      },
    });

    expect(isPaymentProviderError(response)).toBeTruthy();
    expect((response as PaymentProviderError).detail).toContain(
      "Invalid amount",
    );
  });
});

describe("updatePayment", () => {
  it("returns a new reference when payment is updated", async () => {
    const service = createPaystackProviderService();
    const {
      data: { paystackTxRef: oldRef },
    } = checkForPaymentProcessorError(
      await service.initiatePayment(demoCreatePaymentProviderSession),
    );

    const updateSession = {
      ...demoCreatePaymentProviderSession,
      data: {
        paystackTxRef: oldRef,
      },
    } satisfies UpdatePaymentProviderSession;

    const {
      data: { paystackTxRef: newRef },
    } = checkForPaymentProcessorError(
      await service.updatePayment(updateSession),
    );

    // The refs should be different
    expect(oldRef).not.toEqual(newRef);
  });
});

describe("authorizePayment", () => {
  it("returns status ERROR on Paystack tx authorization fail", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-failed",
        cartId: "cart-123",
      }),
    );
    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status CAPTURED on Paystack tx authorization pass", async () => {
    const service = createPaystackProviderService();

    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-passed",
        cartId: "cart-123",
      }),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.CAPTURED);
  });

  it("returns status ERROR on Paystack invalid key error", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-false",
        cartId: "cart-123",
      }),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status PENDING on Paystack tx authorization pending", async () => {
    // Never happens in practice, but just in case
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-pending",
        cartId: "cart-123",
      }),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.PENDING);
  });
});

describe("retrievePayment", () => {
  it("returns a data object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.retrievePayment({
      paystackTxId: "123-success",
    });

    expect(payment).toMatchObject({
      paystackTxId: "123-success",
      paystackTxData: {
        status: "success",
      },
    });
  });
});

describe("refundPayment", () => {
  it("refunds payment, returns refunded amount and transaction", async () => {
    const service = createPaystackProviderService();
    const payment = await service.refundPayment(
      {
        paystackTxId: 1244,
      },
      4000,
    );

    expect(payment).toMatchObject({
      paystackTxId: 1244,
    });
  });
});

describe("getPaymentStatus", () => {
  it("returns PENDING if no paystackTxId is provided", async () => {
    const service = createPaystackProviderService();
    const status = await service.getPaymentStatus({});

    expect(status).toEqual(PaymentSessionStatus.PENDING);
  });

  it("returns AUTHORIZED if Paystack status is success", async () => {
    const service = createPaystackProviderService();
    const status = await service.getPaymentStatus({
      paystackTxId: "123-success",
    });

    expect(status).toEqual(PaymentSessionStatus.AUTHORIZED);
  });

  it("returns ERROR if Paystack status is failed", async () => {
    const service = createPaystackProviderService();
    const status = await service.getPaymentStatus({
      paystackTxId: "123-failed",
    });

    expect(status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns error if Paystack status is false (invalid key error)", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentStatus({
      paystackTxId: "123-false",
    });

    expect(payment).toEqual(PaymentSessionStatus.ERROR);
  });
});

describe("getWebhookActionAndData", () => {
  const defaultWebhookPayload = {
    event: "charge.success",
    data: {
      metadata: {
        session_id: "123-session",
      },
      amount: 100,
    },
  };

  it("it returns NOT_SUPPORTED if the webhook signature is invalid", async () => {
    const service = createPaystackProviderService();

    const result = await service.getWebhookActionAndData({
      data: defaultWebhookPayload,
      rawData: Buffer.from(JSON.stringify(defaultWebhookPayload)),
      headers: {
        "x-paystack-signature": "invalid-signature",
      },
    });

    expect(result.action).toEqual(PaymentActions.NOT_SUPPORTED);
  });

  it("returns NOT_SUPPORTED if the event is not charge.success", async () => {
    const service = createPaystackProviderService();
    const result = await service.getWebhookActionAndData({
      data: defaultWebhookPayload,
      rawData: Buffer.from(JSON.stringify(defaultWebhookPayload)),
      headers: {},
    });

    expect(result.action).toEqual(PaymentActions.NOT_SUPPORTED);
  });

  it("allows correct signature and charge.success event", async () => {
    const service = createPaystackProviderService();

    // Create a valid signature
    const validSignature = crypto
      .createHmac("sha512", TEST_SECRET_KEY)
      .update(JSON.stringify(defaultWebhookPayload))
      .digest("hex");

    const result = await service.getWebhookActionAndData({
      data: defaultWebhookPayload,
      rawData: Buffer.from(JSON.stringify(defaultWebhookPayload)),
      headers: {
        "x-paystack-signature": validSignature,
      },
    });

    expect(result.action).toEqual(PaymentActions.AUTHORIZED);
    expect(result.data?.session_id).toEqual(
      defaultWebhookPayload.data.metadata.session_id,
    );
    expect(result.data?.amount).toEqual(defaultWebhookPayload.data.amount);
  });

  it("returns NOT_SUPPORTED if the metadata.session_id is not present", async () => {
    const service = createPaystackProviderService();

    const payload = {
      ...defaultWebhookPayload,
      data: {
        ...defaultWebhookPayload.data,
        metadata: {},
      },
    };

    // Create a valid signature
    const validSignature = crypto
      .createHmac("sha512", TEST_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest("hex");

    const result = await service.getWebhookActionAndData({
      data: payload,
      rawData: Buffer.from(JSON.stringify(payload)),
      headers: {
        "x-paystack-signature": validSignature,
      },
    });

    expect(result.action).toEqual(PaymentActions.NOT_SUPPORTED);
  });
});

describe("capturePayment", () => {
  it("returns passed in object", async () => {
    const service = createPaystackProviderService();

    const payment = await service.capturePayment({
      paystackTxId: "123-capture",
    });

    expect(payment).toMatchObject({
      paystackTxId: "123-capture",
    });
  });
});

describe("cancelPayment", () => {
  it("returns passed in object", async () => {
    const service = createPaystackProviderService();

    const payment = await service.cancelPayment({
      paystackTxId: "123-cancel",
    });

    expect(payment).toMatchObject({
      paystackTxId: "123-cancel",
    });
  });
});

describe("deletePayment", () => {
  it("returns passed in object", async () => {
    const service = createPaystackProviderService();

    const payment = await service.deletePayment({
      paystackTxId: "123-delete",
    });

    expect(payment).toMatchObject({
      paystackTxId: "123-delete",
    });
  });
});

describe("Retriable error handling", () => {
  it("retries on 5xx errors from Paystack", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-throw",
        cartId: "cart-123",
      }),
    );

    // It should return captured after retrying
    expect(payment.status).toEqual(PaymentSessionStatus.CAPTURED);
  });

  it("does not retry if disable_retries is true", async () => {
    const service = createPaystackProviderService({
      secret_key: "sk_test_123",
      disable_retries: true,
    });

    // We receive a PaymentProcessorError
    expect(async () => {
      checkForPaymentProcessorError(
        await service.authorizePayment({
          paystackTxRef: "123-throw",
          cartId: "cart-123",
        }),
      );
    }).rejects.toThrow();
  });
});
