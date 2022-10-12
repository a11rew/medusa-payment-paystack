import PaystackProviderService from "../paystack-provider";

// Helpers

function createPaystackProviderService() {
  return new PaystackProviderService(
    {},
    {
      api_key: "sk_test_123",
    }
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
    expect(payment.status).toEqual("pending");
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
  });
});
