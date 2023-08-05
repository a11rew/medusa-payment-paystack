export const CartServiceMock = {
  retrieveWithTotals: jest.fn().mockImplementation(() =>
    Promise.resolve({
      total: 2000,
      region: {
        currency_code: "ghs",
      },
    }),
  ),
};

const mock = jest.fn().mockImplementation(() => CartServiceMock);

export default mock;
