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
}

export default PaystackProviderService;
