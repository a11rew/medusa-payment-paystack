---
"medusa-payment-paystack": major
---

This version comes with support for Medusa version V2.

Breaking changes:

- The plugin now requires Medusa version V2.0.0 or higher.
- How the plugin is configured has changed. The plugin is configured is Medusa as a `PaymentProvider` under the `Payment` module. The configuration is now done in the `medusa-config.ts` file. Refer to the "Configure the Paystack Plugin" section of the README for more information.
- Webhook URLs now MUST be set in the format `<your-medusa-backend-url>/hooks/payment/paystack`. Eg. `https://your-medusa-backend.com/hooks/payment/paystack`. Note this is different from the previous `<your-medusa-backend-url>/paystack/hooks` format.
