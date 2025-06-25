import {
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import {
  InitiatePaymentInput,
  UpdatePaymentInput,
} from "@medusajs/framework/types";
import crypto from "crypto";

import PaystackPaymentProcessor, {
  PaystackPaymentProcessorConfig,
  type PaystackPaymentProviderSessionData,
} from "../paystack-payment-processor";
import { paystackMockServer } from "../../lib/__mocks__/paystack";

const TEST_SECRET_KEY = "sk_test_123";

// Helpers
function createPaystackProviderService(
  options: PaystackPaymentProcessorConfig = {
    secret_key: TEST_SECRET_KEY,
  },
) {
  return new PaystackPaymentProcessor({}, options);
}

const demoCreatePaymentProviderSession: InitiatePaymentInput = {
  amount: 100,
  currency_code: "GHS",
  data: {
    email: "andrew@a11rew.dev",
  },
};

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
  it("returns a payment session with Paystack transaction data", async () => {
    const service = createPaystackProviderService();
    const { data } = await service.initiatePayment({
      amount: 100,
      currency_code: "GHS",
      data: {
        email: "andrew@a11rew.dev",
      },
    });

    expect(data).toBeDefined();
    expect((data as PaystackPaymentProviderSessionData).paystackTxRef).toEqual(
      expect.any(String),
    );
    expect(
      (data as PaystackPaymentProviderSessionData).paystackTxAccessCode,
    ).toEqual(expect.any(String));
    expect(
      (data as PaystackPaymentProviderSessionData).paystackTxAuthorizationUrl,
    ).toEqual(expect.any(String));
  });

  it("errors out if email is not provided", async () => {
    const service = createPaystackProviderService();
    await expect(
      service.initiatePayment({
        amount: 100,
        currency_code: "GHS",
        data: {},
      }),
    ).rejects.toThrow("Email is required");
  });

  it("returns errors from Paystack", async () => {
    const service = createPaystackProviderService();
    await expect(
      service.initiatePayment({
        amount: "invalid-amount" as unknown as number,
        currency_code: "GHS",
        data: {
          email: "andrew@a11rew.dev",
        },
      }),
    ).rejects.toThrow();
  });
});

describe("updatePayment", () => {
  it("returns a new reference when payment is updated", async () => {
    const service = createPaystackProviderService();
    const initSession = await service.initiatePayment(
      demoCreatePaymentProviderSession,
    );
    const oldRef = (initSession.data as PaystackPaymentProviderSessionData)
      .paystackTxRef;

    const updateSession: UpdatePaymentInput = {
      ...demoCreatePaymentProviderSession,
      data: {
        email: "andrew@a11rew.dev",
        paystackTxRef: oldRef,
      },
    };

    const updatedSession = await service.updatePayment(updateSession);
    const newRef = (updatedSession.data as PaystackPaymentProviderSessionData)
      .paystackTxRef;

    // The refs should be different
    expect(oldRef).not.toEqual(newRef);
  });
});

describe("authorizePayment", () => {
  it("returns status ERROR on Paystack tx authorization fail", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: { paystackTxRef: "123-failed" },
    });
    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status CAPTURED on Paystack tx authorization pass", async () => {
    const service = createPaystackProviderService();

    const payment = await service.authorizePayment({
      data: { paystackTxRef: "123-passed" },
    });

    expect(payment.status).toEqual(PaymentSessionStatus.CAPTURED);
  });

  it("returns status ERROR on Paystack invalid key error", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: { paystackTxRef: "123-false" },
    });

    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status PENDING on Paystack tx authorization pending", async () => {
    // Never happens in practice, but just in case
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: { paystackTxRef: "123-pending" },
    });

    expect(payment.status).toEqual(PaymentSessionStatus.PENDING);
  });
});

describe("retrievePayment", () => {
  it("returns a data object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.retrievePayment({
      data: { paystackTxId: "123-success" },
    });

    expect(payment.data).toMatchObject({
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
    const refund = await service.refundPayment({
      data: { paystackTxId: 1244 },
      amount: 4000,
    });

    expect(refund.data).toMatchObject({
      paystackTxId: 1244,
    });
  });
});

describe("getPaymentStatus", () => {
  it("returns PENDING if no paystackTxId is provided", async () => {
    const service = createPaystackProviderService();
    const { status } = await service.getPaymentStatus({ data: {} });

    expect(status).toEqual(PaymentSessionStatus.PENDING);
  });

  it("returns AUTHORIZED if Paystack status is success", async () => {
    const service = createPaystackProviderService();
    const { status } = await service.getPaymentStatus({
      data: { paystackTxId: "123-success" },
    });

    expect(status).toEqual(PaymentSessionStatus.AUTHORIZED);
  });

  it("returns ERROR if Paystack status is failed", async () => {
    const service = createPaystackProviderService();
    const { status } = await service.getPaymentStatus({
      data: { paystackTxId: "123-failed" },
    });

    expect(status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns error if Paystack status is false (invalid key error)", async () => {
    const service = createPaystackProviderService();
    const { status } = await service.getPaymentStatus({
      data: { paystackTxId: "123-false" },
    });

    expect(status).toEqual(PaymentSessionStatus.ERROR);
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

    const { data } = await service.capturePayment({
      data: { paystackTxId: "123-capture" },
    });

    expect(data).toMatchObject({
      paystackTxId: "123-capture",
    });
  });
});

describe("cancelPayment", () => {
  it("returns passed in object", async () => {
    const service = createPaystackProviderService();

    const { data } = await service.cancelPayment({
      data: { paystackTxId: "123-cancel" },
    });

    expect(data).toMatchObject({
      paystackTxId: "123-cancel",
    });
  });
});

describe("deletePayment", () => {
  it("returns passed in object", async () => {
    const service = createPaystackProviderService();

    const { data } = await service.deletePayment({
      data: { paystackTxId: "123-delete" },
    });

    expect(data).toMatchObject({
      paystackTxId: "123-delete",
    });
  });
});

describe("Retriable error handling", () => {
  it("retries on 5xx errors from Paystack", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: { paystackTxRef: "123-throw" },
    });

    // It should return captured after retrying
    expect(payment.status).toEqual(PaymentSessionStatus.CAPTURED);
  });

  it("does not retry if disable_retries is true", async () => {
    const service = createPaystackProviderService({
      secret_key: "sk_test_123",
      disable_retries: true,
    });

    // We receive a PaymentProcessorError
    await expect(
      service.authorizePayment({
        data: { paystackTxRef: "123-throw" },
      }),
    ).rejects.toThrow();
  });
});
