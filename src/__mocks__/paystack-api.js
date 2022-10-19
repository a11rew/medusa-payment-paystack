export const PaystackProviderServiceMock = {
  transaction: {
    verify: jest.fn().mockImplementation(({ reference }) => {
      switch (reference) {
        case "123-failed":
          return Promise.resolve({
            data: {
              status: "failed",
              paystackTxId: "123",
              paystackTxData: {},
            },
          });
        case "123-passed":
          return Promise.resolve({
            data: {
              status: "success",
              paystackTxId: "123",
              paystackTxData: {},
            },
          });
        case "123-false":
          return Promise.resolve({
            data: {
              status: false,
              paystackTxId: "123",
              paystackTxData: {},
            },
          });
        case "123-throw":
          return Promise.reject(new Error("Paystack error"));
        default:
          return Promise.resolve({
            data: {
              status: "pending",
              paystackTxId: "123",
              paystackTxData: {},
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
