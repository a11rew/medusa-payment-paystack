import cuid from "cuid";
import PaystackProviderService from "../paystack-provider";

// Helpers
function createPaystackProviderService() {
  return new PaystackProviderService(
    {},
    {
      api_key: "sk_test_123",
    },
  );
}

describe("Provider Service Initialization", () => {
  it("initializes the provider service", () => {
    const service = createPaystackProviderService();
    expect(service).toBeTruthy();
  });

  it("fails initialization if api_key is not provided", () => {
    expect(() => {
      const paystackProvider = new PaystackProviderService({}, {});
      paystackProvider.createPayment();
    }).toThrow();
  });
});

describe("createPayment", () => {
  it("returns a payment session with a transaction reference", async () => {
    const service = createPaystackProviderService();
    const payment = await service.createPayment();

    expect(payment).toBeTruthy();
    expect(payment.paystackTxRef).toBeTruthy();
    expect(payment.paystackTxRef).toEqual(expect.any(String));
  });

  it("returns a valid cuid as reference", async () => {
    const service = createPaystackProviderService();
    const payment = await service.createPayment();

    const ref = payment.paystackTxRef;
    expect(ref).toEqual(expect.any(String));
    expect(cuid.isCuid(ref)).toBeTruthy();
  });
});

describe("updatePayment", () => {
  it("returns a cuid when payment is updated", async () => {
    const service = createPaystackProviderService();
    const payment = await service.updatePayment({
      data: {
        status: "pending",
      },
    });

    expect(payment).toBeTruthy();
    expect(payment.status).toEqual("pending");
    expect(payment.paystackTxRef).toEqual(expect.any(String));
    expect(cuid.isCuid(payment.paystackTxRef)).toBeTruthy();
  });
});

describe("Authorize Payment", () => {
  it("returns status error on Paystack tx authorization fail", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-failed",
      },
    });
    expect(payment.status).toEqual("error");
  });

  it("returns status success on Paystack tx authorization pass", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-passed",
      },
    });

    expect(payment.status).toEqual("authorized");
  });

  it("returns status error on Paystack invalid key error", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-false",
      },
    });

    expect(payment.status).toEqual("error");
  });

  it("returns status pending on Paystack tx authorization pending", async () => {
    // Never happens in practice, but just in case
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-pending",
      },
    });

    expect(payment.status).toEqual("pending");
  });

  it("returns error when verify call throws", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-throw",
      },
    });

    expect(payment.status).toEqual("error");
  });
});

describe("getStatus", () => {
  it("returns pending if no paystackTxId is provided", async () => {
    const service = createPaystackProviderService();
    const status = await service.getStatus({});

    expect(status).toEqual("pending");
  });

  it("returns authorized if Paystack status is success", async () => {
    const service = createPaystackProviderService();
    const status = await service.getStatus({
      paystackTxId: "123-success",
    });

    expect(status).toEqual("authorized");
  });

  it("returns error if Paystack status is failed", async () => {
    const service = createPaystackProviderService();
    const status = await service.getStatus({
      paystackTxId: "123-failed",
    });

    expect(status).toEqual("error");
  });

  it("returns error if Paystack status is false (invalid key error)", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getStatus({
      paystackTxId: "123-false",
    });

    expect(payment).toEqual("error");
  });
});

describe("getPaymentData", () => {
  it("returns a data object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      data: {
        paystackTxRef: "123-success",
      },
    });

    expect(payment).toMatchObject({});
  });
});

describe("retrievePayment", () => {
  it("returns a data object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.retrievePayment({
      data: {
        paystackTxRef: "123-success",
      },
    });

    expect(payment).toMatchObject({});
  });
});

describe("updatePaymentData", () => {
  it("returns an updated payment data object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.updatePaymentData(
      {
        data: {
          paystackTxRef: "123-success",
        },
      }, // existing session data
      {
        // new data
        status: "authorized",
      },
    );

    expect(payment).toMatchObject({
      status: "authorized",
      data: {
        paystackTxRef: "123-success",
      },
    });
  });
});

describe("refundPayment", () => {
  it("refunds payment, returns refunded amount and transaction", async () => {
    const service = createPaystackProviderService();
    const payment = await service.refundPayment({
      data: {
        transaction: "paystackTx",
        amount: 4000,
      },
    });

    expect(payment).toMatchObject({
      transaction: "paystackTx",
      amount: 4000,
    });
  });
});

describe("capturePayment", () => {
  it("returns passed in object", async () => {
    const service = createPaystackProviderService();

    const payment = await service.capturePayment({
      data: {
        paystackTxId: "123-capture",
      },
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
      data: {
        paystackTxId: "123-cancel",
      },
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
      data: {
        paystackTxId: "123-delete",
      },
    });

    expect(payment).toMatchObject({
      paystackTxId: "123-delete",
    });
  });
});
