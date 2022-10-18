/* eslint-disable arrow-body-style */
/* eslint-disable padded-blocks */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable space-in-parens */
/* eslint-disable indent */
/* eslint-disable semi */
/* eslint-disable quotes */
/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
export const PaystackProviderServiceMock = {
  transaction: {
    verify: jest.fn().mockImplementation(({ reference }) => {
      if (reference === "123-failed") {
        return Promise.resolve({
          data: {
            status: "failed",
            paystackTxId: "123",
            paystackTxData: "12345",
          },
        });
      }
      if (reference === "123-passed") {
        return Promise.resolve({
          data: {
            status: "success",
            paystackTxId: "123",
            paystackTxData: "12345",
          },
        });
      }
      if (reference === "123-undefined") {
        return Promise.resolve({
          data: {
            status: false,
            paystackTxId: "123",
            paystackTxData: "12345",
          },
        });
      }
    }),

    get: jest.fn().mockImplementation(({ id, paystackTxId }) => {
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

    create: jest
      .fn()
      .mockImplementation(({ refundAmount, payment, paystackTxId }) => {
        return Promise.resolve({
          transaction: "paystack_pay",
          amount: "12000",
        });
      }),
  },
};

const paystackapi = jest.fn(() => PaystackProviderServiceMock);

export default paystackapi;
