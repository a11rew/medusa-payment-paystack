/* eslint-disable no-unsafe-optional-chaining */
import Paystack from "paystack-api";
import cuid from "cuid";
import { PaymentService } from "medusa-interfaces";

class PaystackProviderService extends PaymentService {
  static identifier = "paystack";

  constructor(services, options) {
    super(services, options);
    /**
     * Required options:
     * {
     *  api_key: "paystack_secret_key"
     * }
     */
    this.options_ = options;

    this.PAYSTACK_API_KEY = this.options_?.api_key;

    if (!this.PAYSTACK_API_KEY) {
      throw new Error("The Paystack provider requires the api_key option");
    }

    /** @private @const {Paystack} */
    this.paystack_ = new Paystack(this.PAYSTACK_API_KEY);
  }

  /**
   * Creates a payment session.
   * This returns a transaction reference to be used in the storefront.
   * @returns {object} an object with a transaction reference.
   */
  async createPayment() {
    // Create a collision resistant reference
    const reference = cuid();

    return {
      paystackTxRef: reference,
    };
  }

  /**
   * Creates a new transaction reference for this payment session.
   * @param {object} sessionData - payment session data.
   * @returns {object} same payment session data with new transaction reference.
   */
  async updatePayment(paymentSession) {
    const reference = cuid();

    return {
      ...paymentSession.data,
      paystackTxRef: reference,
    };
  }

  /**
   * Status for Paystack transaction.
   * @param {Object} paymentData - payment method data from cart
   * @returns {string} "authorized"|"pending"|"requires_more"|"error"|"canceled"
   */
  async getStatus(paymentData) {
    const { paystackTxId } = paymentData;
    // console.log(paystackTxId, "paystackTxId");

    if (!paystackTxId) {
      return "pending";
    }

    try {
      const { data } = await this.paystack_.transaction.get({
        id: paystackTxId,
      });

      switch (data.status) {
        case "success":
          return "authorized";
        default:
          return "pending";
      }
    } catch (error) {
      return "error";
    }
  }

  /**
   * Validates a transaction using this payment session's transaction ref.
   * This also adds the transaction id to the payment session.
   * @param {object} sessionData - payment session data.
   * @returns {string} "authorized"|"pending"|"requires_more"|"error"|"canceled"
   */

  async authorizePayment(paymentSession) {
    // console.log(paymentSession, "payment session");
    // TODO: This should validate amount, currency, email, etc.
    // Probably use the other services, cart, region etc.
    try {
      const { paystackTxRef } = paymentSession.data;

      const { data } = await this?.paystack_?.transaction?.verify({
        reference: paystackTxRef,
      });

      // console.log(data, 'dataaaaa')

      switch (data.status) {
        case "success":
          // Successful transaction
          return {
            status: "authorized",
            data: {
              paystackTxId: data.id,
              paystackTxData: data,
              ...paymentSession.data,
            },
          };

        case "failed":
          // Failed transaction
          return {
            status: "error",
            data: {
              paystackTxId: data.id,
              paystackTxData: data,
              ...paymentSession.data,
            },
          };

        case false:
          // Invalid key error
          return {
            status: "error",
            data: {
              paystackTxId: null,
              paystackTxData: data,
              ...paymentSession.data,
            },
          };
        default:
          // Pending transaction
          return {
            status: "pending",
            data: paymentSession.data,
          };
      }
    } catch (error) {
      return { status: "error", data: { ...paymentSession.data, error } };
    }
  }

  /**
   * Gets transaction data from Paystack.
   * @param {PaymentSession} paymentSession
   * @return {object} payment session data
   */

  async getPaymentData(paymentSession) {
    const { paystackTxId } = paymentSession.data;

    const { data } = await this.paystack_.transaction.get({
      id: paystackTxId,
    });

    return {
      ...paymentSession.data,
      paystackTxData: data,
    };
  }

  /**
   * Retrieve transaction data from Paystack.
   * @param {object} paymentData payment session data
   * @returns {object} transaction data
   */
  async retrievePayment(paymentData) {
    const { paystackTxId } = paymentData;

    const { data } = await this.paystack_.transaction.get({
      id: paystackTxId,
    });

    return {
      ...paymentData,
      paystackTxData: data,
    };
  }

  /**
   * Simply returns the payment session data with update - nothing needs to be done on Paystack end.
   * @param {object} paymentSessionData - existing payment session data
   * @param {object} data - new data to be updated
   * @returns {Promise<object>} - payment session data
   */
  async updatePaymentData(paymentSessionData, data) {
    return {
      ...paymentSessionData,
      ...data,
    };
  }

  /**
   * Refunds payment for Paystack transaction.
   * @param {Payment} payment - payment method data from cart
   * @param {number} refundAmount - amount to refund
   * @return {Promise<PaymentData>} refunded payment transaction data
   */
  async refundPayment(payment, refundAmount) {
    const { paystackTxId } = payment.data;

    const { data } = await this.paystack_.refund.create({
      transaction: paystackTxId,
      amount: refundAmount,
    });

    return {
      ...payment.data,
      paystackTxData: data,
    };
  }

  /**
   * Marks payment as captured. Transactions are 'captured' by default in Paystack.
   * So this just returns the payment session data.
   * @param {Payment} paymentSession - payment method session data from cart
   * @return {Promise<PaymentData>} same payment transaction data
   */
  async capturePayment(paymentSession) {
    return paymentSession.data;
  }

  /**
   * Cancel payment for Paystack payment intent.
   * This is not supported by Paystack - transactions are stateless.
   * @param {Payment} payment - payment method data from cart
   * @return {Promise<PaymentData>} canceled payment intent data
   */
  async cancelPayment(payment) {
    return payment.data;
  }

  /**
   * Delete payment for Paystack payment intent.
   * This is not supported by Paystack - transactions are stateless.
   * @param {Payment} payment - payment method data from cart
   * @return {Promise<PaymentData>} canceled payment intent data
   */
  async deletePayment(paymentSession) {
    return paymentSession.data;
  }
}

export default PaystackProviderService;
