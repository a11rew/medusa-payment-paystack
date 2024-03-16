import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { PAYSTACK_API_PATH } from "../paystack";

const handlers = [
  // Transaction verification
  http.get(`${PAYSTACK_API_PATH}/transaction/verify/:reference`, req => {
    const { reference } = req.params;

    switch (reference) {
      case "123-failed":
        return HttpResponse.json({
          status: false,
          message: "Verification failed",
          data: {
            status: "failed",
            id: "123",
          },
        });

      case "123-passed":
        return HttpResponse.json({
          status: true,
          message: "Verification successful",
          data: {
            status: "success",
            id: "123",
            amount: 2000,
            currency: "GHS",
          },
        });

      case "123-false":
        return HttpResponse.json({
          status: false,
          message: "Verification returned false status",
          data: {
            status: "failed",
            id: "123",
          },
        });

      case "123-throw": {
        return HttpResponse.json(
          {
            status: false,
            message: "Paystack error",
          },
          {
            // @ts-expect-error
            status: 400,
          },
        );
      }

      default:
        return HttpResponse.json({
          status: true,
          message: "Verification status pending",
          data: {
            status: "pending",
            id: "123",
          },
        });
    }
  }),

  // Initialize transaction
  http.post(`${PAYSTACK_API_PATH}/transaction/initialize`, () => {
    return HttpResponse.json({
      status: true,
      message: "Transaction initialized",
      data: {
        reference: `ref-${Math.random() * 1000}`,
        authorization_url: "https://paystack.com/123",
      },
    });
  }),

  // Get transaction
  http.get(`${PAYSTACK_API_PATH}/transaction/:id`, req => {
    const { id } = req.params;

    switch (id) {
      case "123-success":
        return HttpResponse.json({
          status: true,
          message: "Transaction successful",
          data: {
            status: "success",
            id: "123",
            amount: 1000,
            currency: "NGN",
          },
        });
      case "123-false":
        return HttpResponse.json({
          status: false,
          message: "Transaction failure",
          data: {
            status: "failed",
            id: "123",
          },
        });
      default:
        return HttpResponse.json({
          status: false,
          message: "Transaction not found",
          data: {
            status: "failed",
            id: id,
          },
        });
    }
  }),

  // Create refund
  http.post(`${PAYSTACK_API_PATH}/refund`, async req => {
    const { transaction, amount } = (await req.request.json()) as {
      transaction: string;
      amount: number;
    };

    return HttpResponse.json({
      status: true,
      message: "Refund created",
      data: {
        id: Math.floor(Math.random() * 10000),
        status: "success",
        transaction,
        amount,
      },
    });
  }),
];

export const paystackMockServer = setupServer(...handlers);
