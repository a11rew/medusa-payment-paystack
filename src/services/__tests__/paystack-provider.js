import PaystackProviderService from "../paystack-provider";

describe("Provider Service Initialization", () => {
  it("initializes the provider service", () => {
    const service = new PaystackProviderService(
      {},
      {
        api_key: "test",
      }
    );
    expect(service).toBeTruthy();
  });

  it("throws error if api_key is not provided", () => {
    expect(() => {
      new PaystackProviderService({}, {});
    }).toThrow();
  });
});
