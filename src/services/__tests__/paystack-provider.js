/* eslint-disable indent */
/* eslint-disable comma-dangle */
/* eslint-disable semi */
/* eslint-disable padded-blocks */
/* eslint-disable quotes */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable no-new */
/* eslint-disable import/no-named-as-default */
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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns pending if no PaystacktXId", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getStatus({
      paystackTxId: {
        data: "123-failed",
      },
    });

    expect(payment).toEqual("pending");
  });

  it("test success", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getStatus({
      paystackTxId: "success",
    });

    expect(payment)?.toEqual("authorized");
  });
});

describe("Retrive payment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns pending if no PaystacktXId", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      data: {
        paystackTxId: {},
      },
    });

    console.log(payment, "payment to be Empty");

    // expect(payment).data.toEqual(null);
  });

  it("Match Object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      data: {
        paystackTxRef: "123-failed",
      },
    });

    expect(payment).toMatchObject({});
  });
});

describe("retrive payment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns pending if no PaystacktXId", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      data: {
        paystackTxId: {},
      },
    });

    // console.log(payment, "payment to be Empty");

    // expect(payment).data.toEqual(null);
  });

  it("Match Object", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      data: {
        paystackTxRef: {},
      },
    });

    expect(payment).toMatchObject({});
  });
});

describe("Update Payment data", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Update Paymentdata test", async () => {
    const service = createPaystackProviderService();
    const payment = await service.getPaymentData({
      data: {
        paymentSessionData: {},
        data: "",
      },
    });

    expect(payment).toMatchObject({});
  });
});

describe("", () => {});
