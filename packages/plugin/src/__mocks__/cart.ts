export const CartServiceMock = {
  retrieveWithTotals: jest.fn().mockImplementation((cartId: string) => {
    const amount = cartId === "cart-123" ? 2000 : 1000;

    return Promise.resolve({
      total: amount,
      region: {
        currency_code: "ghs",
      },
    });
  }),
};

const mock = jest.fn().mockImplementation(() => CartServiceMock);

export default mock;
