export const PaystackProviderServiceMock = {
  transaction: {
    verify: jest.fn().mockImplementation(({ reference }) => {
      switch (reference) {
        case "123-failed":
          return Promise.resolve({
            data: {
              status: "failed",
              id: "123",
            },
          });
        case "123-passed":
          return Promise.resolve({
            data: {
              status: "success",
              id: "123",
              amount: 2000,
              currency: "GHS",
            },
          });
        case "123-false":
          return Promise.resolve({
            data: {
              status: false,
              id: "123",
            },
          });
        case "123-throw":
          return Promise.reject(new Error("Paystack error"));
        default:
          return Promise.resolve({
            data: {
              status: "pending",
              id: "123",
            },
          });
      }
    }),

    get: jest.fn().mockImplementation(({ id }) => {
      switch (id) {
        case "123-success":
          return Promise.resolve({
            data: {
              status: "success",
              paystackTxId: id,
              paystackTxData: {},
            },
          });

        case "123-false":
          return Promise.resolve({
            data: {
              status: false,
              paystackTxId: id,
              paystackTxData: {},
            },
          });

        default:
          return Promise.resolve({
            data: {
              status: "failed",
              paystackTxId: id,
              paystackTxData: {},
            },
          });
      }
    }),
  },

  refund: {
    create: jest.fn().mockImplementation(({ transaction, amount }) =>
      Promise.resolve({
        transaction,
        amount,
        paystackTxData: {},
      }),
    ),
  },
};

const paystackapi = jest.fn(() => PaystackProviderServiceMock);

export default paystackapi;
