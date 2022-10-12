import { PaymentService } from "medusa-interfaces";
import Paystack from "paystack-api";

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

  async getPaymentData(paymentSession) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#getpaymentdata
    throw new Error("Method not implemented.");
  }
  async updatePaymentData(paymentSessionData, data) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#updatepaymentdata
    throw new Error("Method not implemented.");
  }
  async createPayment(cart) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#createpayment
    throw new Error("Method not implemented.");
  }
  async retrievePayment(paymentData) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#retrievepayment
    throw new Error("Method not implemented.");
  }
  async updatePayment(paymentSessionData, cart) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#updatepayment
    throw new Error("Method not implemented.");
  }
  async authorizePayment(paymentSession, context) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#authorizepayment
    throw new Error("Method not implemented.");
  }
  async capturePayment(payment) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#capturepayment
    throw new Error("Method not implemented.");
  }
  async refundPayment(payment, refundAmount) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#refundpayment
    throw new Error("Method not implemented.");
  }
  async cancelPayment(payment) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#cancelpayment
    throw new Error("Method not implemented.");
  }
  async deletePayment(paymentSession) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#deletepayment
    throw new Error("Method not implemented.");
  }
  async getStatus(data) {
    // https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider/#getstatus
    throw new Error("Method not implemented.");
  }
}

export default PaystackProviderService;
