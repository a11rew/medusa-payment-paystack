import { isCuid } from "@paralleldrive/cuid2";
import PaystackPaymentProcessor from "../paystack-payment-processor";
import {
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentSessionStatus,
} from "@medusajs/medusa";

interface ProviderServiceMockOptions {
  secretKey?: string | undefined;
}

// Helpers
function createPaystackProviderService(
  { secretKey }: ProviderServiceMockOptions = {
    secretKey: "sk_test_123",
  },
) {
  return new PaystackPaymentProcessor(
    // @ts-expect-error - We don't need to mock all the methods
    {},
    {
      secret_key: secretKey,
    },
  );
}

function checkForPaymentProcessorError<T>(response: T | PaymentProcessorError) {
  // Check for error
  if (response?.hasOwnProperty("error")) {
    throw new Error(String(response));
  }

  // Narrow type
  return response as T;
}

const demoSessionContext = {
  amount: 100,
  currency_code: "ghc",
  email: "andrew@a11rew.dev",
  resource_id: "123",
  context: {},
  paymentSessionData: {},
} satisfies PaymentProcessorContext;

describe("Provider Service Initialization", () => {
  it("initializes the provider service", () => {
    const service = createPaystackProviderService();
    expect(service).toBeTruthy();
  });

  it("fails initialization if api_key is not provided", () => {
    expect(() => {
      void createPaystackProviderService({
        secretKey: undefined,
      });
    }).toThrow();
  });
});

describe("createPayment", () => {
  it("returns a payment session with a transaction reference", async () => {
    const service = createPaystackProviderService();
    const {
      session_data: { paystackTxRef },
    } = checkForPaymentProcessorError(await service.initiatePayment());

    expect(paystackTxRef).toBeTruthy();
    expect(paystackTxRef).toEqual(expect.any(String));
  });

  it("returns a valid cuid as reference", async () => {
    const service = createPaystackProviderService();
    const {
      session_data: { paystackTxRef },
    } = checkForPaymentProcessorError(await service.initiatePayment());

    expect(paystackTxRef).toEqual(expect.any(String));
    expect(isCuid(paystackTxRef)).toBeTruthy();
  });
});

describe("updatePayment", () => {
  it("returns a new reference when payment is updated", async () => {
    const service = createPaystackProviderService();
    const {
      session_data: { paystackTxRef: oldRef },
    } = checkForPaymentProcessorError(await service.initiatePayment());

    const {
      session_data: { paystackTxRef: newRef },
    } = checkForPaymentProcessorError(
      await service.updatePayment({
        ...demoSessionContext,
      }),
    );

    // Both refs should be valid cuids
    expect(isCuid(oldRef)).toBeTruthy();
    expect(isCuid(newRef)).toBeTruthy();

    // The refs should be different
    expect(oldRef).not.toEqual(newRef);
  });
});

describe("Authorize Payment", () => {
  it("returns status error on Paystack tx authorization fail", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment(
        {
          paystackTxRef: "123-failed",
        },
        {
          cart_id: "123",
        },
      ),
    );
    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status success on Paystack tx authorization pass", async () => {
    const service = createPaystackProviderService();

    const payment = checkForPaymentProcessorError(
      await service.authorizePayment(
        {
          paystackTxRef: "123-passed",
        },
        {
          cart_id: "123",
        },
      ),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.AUTHORIZED);
  });

  it("returns status error on Paystack invalid key error", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment(
        {
          paystackTxRef: "123-false",
        },
        {
          cart_id: "123",
        },
      ),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status pending on Paystack tx authorization pending", async () => {
    // Never happens in practice, but just in case
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment(
        {
          paystackTxRef: "123-pending",
        },
        {
          cart_id: "123",
        },
      ),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.PENDING);
  });
});

describe("getStatus", () => {
  it("returns pending if no paystackTxId is provided", async () => {
    const service = createPaystackProviderService();
    const status = await service.getPaymentStatus({});

    expect(status).toEqual(PaymentSessionStatus.PENDING);
  });

  it("returns authorized if Paystack status is success", async () => {
    const service = createPaystackProviderService();
    const status = await service.getPaymentStatus({
      paystackTxId: "123-success",
    });

    expect(status).toEqual(PaymentSessionStatus.AUTHORIZED);
  });

  it("returns error if Paystack status is failed", async () => {
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

describe("retrievePayment", () => {
  it("returns a data object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.retrievePayment({
      paystackTxId: "123-success",
    });

    expect(payment).toMatchObject({});
  });
});

describe("updatePaymentData", () => {
  it("returns an updated payment data object", async () => {
    const service = createPaystackProviderService();
    const existingRef = "123-pending";
    const payment = checkForPaymentProcessorError(
      await service.updatePaymentData("1", {
        paystackTxRef: existingRef,
      }),
    );

    // The ref should be different
    expect(payment.session_data.paystackTxRef).not.toEqual(existingRef);

    // The ref should be a valid cuid
    expect(isCuid(payment.session_data.paystackTxRef)).toBeTruthy();
  });
});

describe("refundPayment", () => {
  it("refunds payment, returns refunded amount and transaction", async () => {
    const service = createPaystackProviderService();
    const payment = await service.refundPayment(
      {
        paystackTxId: "paystackTx",
      },
      4000,
    );

    expect(payment).toMatchObject({
      paystackTxId: "paystackTx",
    });
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
