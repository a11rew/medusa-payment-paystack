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

  it("throws error if api_key is not provided", () => {
    expect(() => {
      new PaystackProviderService({}, {});
    }).toThrow();
  });
});

describe("Create Payment", () => {
  it("creates a payment", async () => {
    const service = createPaystackProviderService();
    const payment = await service.createPayment();

    expect(payment).toBeTruthy();
    expect(payment.paystackTxRef).not.toBe("");
  });
});

describe("Update Payment", () => {
  it("updates a payment", async () => {
    const service = createPaystackProviderService();
    const payment = await service.updatePayment({
      data: {
        status: "pending",
      },
    });

    expect(payment).toBeTruthy();
    expect(payment.status).toEqual("pending");
    expect(payment.paystackTxRef).not.toBe("");
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Authorize Payment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // clearAllMocks

  it("test error", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-failed",
      },
    });
    expect(payment.status).toEqual("error");
  });

  it("test success", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-passed",
      },
    });

    expect(payment.status).toEqual("authorized");
  });

  it("test undefined", async () => {
    const service = createPaystackProviderService();
    const payment = await service.authorizePayment({
      data: {
        paystackTxRef: "123-undefined",
      },
    });

    expect(payment.status).toEqual("error");
  });
});

describe("getStatus", () => {
  // afterEach(() => {
  //   jest.clearAllMocks();
  // });

  it("returns pending if no PaystacktXId", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getStatus({
      // id: true,
      // paystackTxId: true,
      paystackTxId: {
        data: "123-failed",
      },
    });
    // console.log(payment, "payyyyyyyymmmm");
    expect(payment).toEqual("pending");
  });

  it("test success", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getStatus({
      // id: "success",
      // paystackTxRef: {
      //   status: "success",
      // },
      paystackTxId: "success",
    });

    // console.log(payment, "payyyyyyyymmmm");
    expect(payment)?.toEqual("authorized");
  });
});

describe("Get Payment Data", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns pending if no PaystacktXId", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      paymentSession: "",
    });

    // expect(payment).data.toEqual(null);
  });

  it("Match Object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      // data: {
      //   paystackTxId: "123-undefined",
      // },
    });
    // console.log(payment, "paymenttttt");
    expect(payment).toMatchObject({});
  });
});
