export const PaystackProviderServiceMock = {
  transaction: {
    verify: jest.fn().mockImplementation(({ reference }) => {
      switch (reference) {
        case "123-failed":
          return Promise.resolve({
            data: {
              status: "failed",
              paystackTxId: "123",
              paystackTxData: "12345",
            },
          });
        case "123-passed":
          return Promise.resolve({
            data: {
              status: "success",
              paystackTxId: "123",
              paystackTxData: "12345",
            },
          });
        case "123-undefined":
          return Promise.resolve({
            data: {
              status: false,
              paystackTxId: "123",
              paystackTxData: "12345",
            },
          });
        default:
          return Promise.resolve({
            data: {
              status: "pending",
              paystackTxId: "123",
              paystackTxData: "12345",
            },
          });
      }
    }),

    get: jest.fn().mockImplementation(({ id }) => {
      switch (id) {
        case "success":
          return Promise.resolve({
            data: {
              status: "success",
              paystackTxId: "123",
              paystackTxData: "12345",
            },
          });
        default:
          return Promise.resolve({
            data: {
              status: "pending",
              paystackTxId: "123",
              paystackTxData: "12345",
            },
          });
      }
    }),
  },

  refund: {
    create: jest.fn().mockImplementation(() =>
      Promise.resolve({
        transaction: "paystack_pay",
        amount: "12000",
        paystackTxData: "12345",
      }),
    ),
  },
};

const paystackapi = jest.fn(() => PaystackProviderServiceMock);

export default paystackapi;
