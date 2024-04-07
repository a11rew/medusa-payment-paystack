import {
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentSessionStatus,
  isPaymentProcessorError,
} from "@medusajs/medusa";

import PaystackPaymentProcessor, {
  PaystackPaymentProcessorConfig,
} from "../paystack-payment-processor";
import { CartServiceMock } from "../../__mocks__/cart";
import { paystackMockServer } from "../../lib/__mocks__/paystack";

// Helpers
function createPaystackProviderService(
  options: PaystackPaymentProcessorConfig = {
    secret_key: "sk_test_123",
  },
) {
  return new PaystackPaymentProcessor(
    // @ts-expect-error - We don't need to mock all the methods
    {
      cartService: CartServiceMock,
    },
    options,
  );
}

function checkForPaymentProcessorError<T>(response: T | PaymentProcessorError) {
  // Check for error
  if (isPaymentProcessorError(response)) {
    throw new Error(response.detail);
  }

  // Narrow type
  return response as T;
}

const demoSessionContext = {
  amount: 100,
  currency_code: "GHS",
  email: "andrew@a11rew.dev",
  resource_id: "123",
  context: {},
  paymentSessionData: {},
} satisfies PaymentProcessorContext;

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

  it("fails initialization if api_key is not provided", () => {
    expect(() => {
      void createPaystackProviderService({
        // @ts-expect-error - We are testing for missing secretKey, helper has default value
        secret_key: undefined,
      });
    }).toThrow();
  });
});

describe("createPayment", () => {
  it("returns a payment session with a transaction reference", async () => {
    const service = createPaystackProviderService();
    const {
      session_data: { paystackTxRef },
    } = checkForPaymentProcessorError(
      await service.initiatePayment(demoSessionContext),
    );

    expect(paystackTxRef).toBeTruthy();
    expect(paystackTxRef).toEqual(expect.any(String));
  });
});

describe("updatePayment", () => {
  it("returns a new reference when payment is updated", async () => {
    const service = createPaystackProviderService();
    const {
      session_data: { paystackTxRef: oldRef },
    } = checkForPaymentProcessorError(
      await service.initiatePayment(demoSessionContext),
    );

    const {
      session_data: { paystackTxRef: newRef },
    } = checkForPaymentProcessorError(
      await service.updatePayment({
        ...demoSessionContext,
      }),
    );

    // The refs should be different
    expect(oldRef).not.toEqual(newRef);
  });
});

describe("Authorize Payment", () => {
  it("returns status error on Paystack tx authorization fail", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-failed",
        cartId: "cart-123",
      }),
    );
    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status success on Paystack tx authorization pass", async () => {
    const service = createPaystackProviderService();

    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-passed",
        cartId: "cart-123",
      }),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.AUTHORIZED);
  });

  it("returns status error on Paystack invalid key error", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-false",
        cartId: "cart-123",
      }),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
  });

  it("returns status pending on Paystack tx authorization pending", async () => {
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

  it("errors out if the returned amount differs", async () => {
    const service = createPaystackProviderService();
    const payment = checkForPaymentProcessorError(
      await service.authorizePayment({
        paystackTxRef: "123-passed",
        cartId: "cart-1000",
      }),
    );

    expect(payment.status).toEqual(PaymentSessionStatus.ERROR);
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
  it("errors out if we try to update the amount", async () => {
    expect.assertions(1);
    const service = createPaystackProviderService();

    try {
      await service.updatePaymentData("1", {
        amount: 100,
      });
    } catch (error) {
      expect(error.message).toEqual(
        "Cannot update amount from updatePaymentData",
      );
    }
  });

  it("returns the same payment data object", async () => {
    const service = createPaystackProviderService();
    const existingRef = "123-pending";
    const payment = checkForPaymentProcessorError(
      await service.updatePaymentData("1", {
        paystackTxRef: existingRef,
      }),
    );

    // The ref should be the same
    expect(
      (
        payment.session_data as {
          paystackTxRef: string;
        }
      )?.paystackTxRef,
    ).toEqual(existingRef);
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

    // It should return success after retrying
    expect(payment.status).toEqual(PaymentSessionStatus.AUTHORIZED);
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
