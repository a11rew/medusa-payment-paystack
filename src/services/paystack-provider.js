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
  async authorizePayment(paymentSession, context) {
    try {
      const { paystackTxRef } = paymentSession.data;

      const { data } = await this.paystack_.transaction.verify({
        reference: paystackTxRef,
      });

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
    try {
      const { paystackTxId } = paymentSession.data;

      if (!paystackTxId) {
        return null;
      }

      const { data } = await this.paystack_.transaction.get({
        id: paystackTxId,
      });

      return {
        ...paymentSession.data,
        paystackTxData: data,
      };
    } catch (error) {
      return { status: "error", data: { ...paymentSession.data, error } };
    }
  }

  async updatePaymentData(paymentSessionData, data) {
    console.log("updating payment data", paymentSessionData, data);
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#updatepaymentdata
    throw new Error("Method not implemented. - updatePaymentData");
  }
  async retrievePayment(paymentData) {
    console.log("retrieving payment", paymentData);
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#retrievepayment
    throw new Error("Method not implemented. - retrievePayment");
  }
  async capturePayment(payment) {
    console.log("capturing payment", payment);
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#capturepayment
    throw new Error("Method not implemented. - capturePayment");
  }
  async refundPayment(payment, refundAmount) {
    console.log("refunding payment", payment, refundAmount);
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#refundpayment
    throw new Error("Method not implemented. - refundPayment");
  }
  async cancelPayment(payment) {
    console.log("canceling payment", payment);
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#cancelpayment
    throw new Error("Method not implemented. - cancelPayment");
  }
  async deletePayment(paymentSession) {
    console.log("deleting payment", paymentSession);
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#deletepayment
    throw new Error("Method not implemented. - deletePayment");
  }
}

export default PaystackProviderService;