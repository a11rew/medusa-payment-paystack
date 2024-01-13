import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const PAYSTACK_API_PATH = "https://api.paystack.co";

type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

interface Request {
  path: string;
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

export interface PaystackTransactionAuthorisation {
  reference: string;
  authorization_url: string;
  access_code: string;
}

export default class Paystack {
  apiKey: string;

  protected readonly axiosInstance: AxiosInstance;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.axiosInstance = axios.create({
      baseURL: PAYSTACK_API_PATH,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  protected async requestPaystackAPI<T>(request: Request): Promise<T> {
    const options = {
      method: request.method,
      url: request.path,
      params: request.query,
      data: request.body,
    } satisfies AxiosRequestConfig;

    try {
      const res = await this.axiosInstance(options);
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw `Error from Paystack API with status code ${error.response?.status}: ${error.response?.data?.message}`;
      }

      throw error;
    }
  }

  transaction = {
    verify: ({ reference }: { reference: string }) =>
      this.requestPaystackAPI<
        PaystackResponse<{
          id: number;
          status: string;
          reference: string;
          amount: number;
          currency: string;
        }>
      >({
        path: "/transaction/verify/" + reference,
        method: "GET",
      }),
    get: ({ id }: { id: string }) =>
      this.requestPaystackAPI<
        PaystackResponse<{
          id: number;
          status: string;
          reference: string;
        }>
      >({
        path: "/transaction/" + id,
        method: "GET",
      }),
    initialize: ({
      amount,
      email,
      currency,
      reference,
    }: {
      amount: number;
      email?: string;
      currency?: string;
      reference?: string;
    }) =>
      this.requestPaystackAPI<
        PaystackResponse<{
          authorization_url: string;
          access_code: string;
          reference: string;
        }>
      >({
        path: "/transaction/initialize",
        method: "POST",
        body: {
          amount,
          email,
          currency,
          reference,
        },
      }),
  };

  refund = {
    create: ({
      transaction,
      amount,
    }: {
      transaction: number;
      amount: number;
    }) =>
      this.requestPaystackAPI<
        PaystackResponse<{
          id: number;
          status: string;
          reference: string;
          amount: number;
        }>
      >({
        path: "/refund",
        method: "POST",
        body: {
          transaction,
          amount,
        },
      }),
  };
}
