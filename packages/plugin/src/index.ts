import { ModuleProvider, Modules } from "@medusajs/framework/dist/utils";

import PaystackPaymentProcessor from "./services/paystack-payment-processor";

export default ModuleProvider(Modules.PAYMENT, {
  services: [PaystackPaymentProcessor],
});

export { PaystackPaymentProcessorConfig as PluginOptions } from "./services/paystack-payment-processor";
