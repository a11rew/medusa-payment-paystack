---
"medusa-payment-paystack": patch
---

Paystack transaction access_code's and authorization_url's are now returned as first class members of the transaction data object (on the same level as the paystackTxRef).

In V2, users of the plugin are encouraged to use either the `paystackTxAccessCode` and `paystackTxAuthorizationUrl` to initiate the Paystack payment flow. Instead of the previous flow that required providing the `paystackTxRef` as well as the amount, email and currency code to continue the payment in the storefront.

This is important because, instead of having to provide the same options (amount, email and currency code) to continue the payment in the storefront, which is error prone, users can now use the _only_ one of the `paystackTxAccessCode` and `paystackTxAuthorizationUrl` to initiate the payment flow. This also makes the integration on the storefront side simpler and more flexible.

The `paystackTxRef` is still returned for backwards compatibility.

To use the new flows, users of the plugin can decide between the following options:

1. Use the `paystackTxAccessCode` to "resume" the payment flow. Follow the [Paystack documentation](https://paystack.com/docs/developer-tools/inlinejs/#resume-transaction) to implement the transaction resumption flow.
2. Use the `paystackTxAuthorizationUrl` to redirect the customer to Paystack's hosted payment page. The Paystack hosted page can either be opened in a new tab, or a child window. After the customer completes the payment, they will be redirected back to the storefront while the payment is confirmed on your Medusa backend using webhooks.
