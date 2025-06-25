# medusa-payment-paystack

## 2.1.0

### Minor Changes

- 76b9b94: Adds support for Medusa >2.5.0

## 2.0.0

### Major Changes

- 41f0cae: This version comes with support for Medusa version V2.

  Breaking changes:

  - The plugin now requires Medusa version V2.0.0 or higher.
  - How the plugin is configured has changed. The plugin is configured is Medusa as a `PaymentProvider` under the `Payment` module. The configuration is now done in the `medusa-config.ts` file. Refer to the "Configure the Paystack Plugin" section of the README for more information.
  - Webhook URLs now MUST be set in the format `<your-medusa-backend-url>/hooks/payment/paystack`. Eg. `https://your-medusa-backend.com/hooks/payment/paystack`. Note this is different from the previous `<your-medusa-backend-url>/paystack/hooks` format.

### Patch Changes

- 3864dad: fix: send amounts in subunits
- 7e73061: Paystack transaction access_code's and authorization_url's are now returned as first class members of the transaction data object (on the same level as the paystackTxRef).

  In V2, users of the plugin are encouraged to use either the `paystackTxAccessCode` and `paystackTxAuthorizationUrl` to initiate the Paystack payment flow. Instead of the previous flow that required providing the `paystackTxRef` as well as the amount, email and currency code to continue the payment in the storefront.

  This is important because, instead of having to provide the same options (amount, email and currency code) to continue the payment in the storefront, which is error prone, users can now use the _only_ one of the `paystackTxAccessCode` and `paystackTxAuthorizationUrl` to initiate the payment flow. This also makes the integration on the storefront side simpler and more flexible.

  The `paystackTxRef` is still returned for backwards compatibility.

  To use the new flows, users of the plugin can decide between the following options:

  1. Use the `paystackTxAccessCode` to "resume" the payment flow. Follow the [Paystack documentation](https://paystack.com/docs/developer-tools/inlinejs/#resume-transaction) to implement the transaction resumption flow.
  2. Use the `paystackTxAuthorizationUrl` to redirect the customer to Paystack's hosted payment page. The Paystack hosted page can either be opened in a new tab, or a child window. After the customer completes the payment, they will be redirected back to the storefront while the payment is confirmed on your Medusa backend using webhooks.

## 2.0.0-next.1

### Patch Changes

- fix: send amounts in subunits

## 2.0.0-next.0

### Major Changes

- This version comes with support for Medusa version V2.

  Breaking changes:

  - The plugin now requires Medusa version V2.0.0 or higher.
  - How the plugin is configured has changed. The plugin is configured is Medusa as a `PaymentProvider` under the `Payment` module. The configuration is now done in the `medusa-config.ts` file. Refer to the "Configure the Paystack Plugin" section of the README for more information.
  - Webhook URLs now MUST be set in the format `<your-medusa-backend-url>/hooks/payment/paystack`. Eg. `https://your-medusa-backend.com/hooks/payment/paystack`. Note this is different from the previous `<your-medusa-backend-url>/paystack/hooks` format.

## 1.3.0

### Minor Changes

- 235282e: Adds support for Paystack webhooks

### Patch Changes

- ee5a111: Updates orderCapturer subscriber implementation to remove deprecation warning

## 1.2.3

### Patch Changes

- ac65bde: Fixes initialization errors related to "msw/node" requires

## 1.2.2

### Patch Changes

- c77bb51: Adds support for automatically retrying network and 5xx errors in requests sent to Paystack.

## 1.2.1

### Patch Changes

- cc7407a: Removes hardcoded currency restrictions
  Improves logging of Paystack API errors

## 1.2.0

### Minor Changes

- 1524578: Payments are now automatically marked as captured. You do not have to go into the admin dashboard after every order to mark the payment as captured.

## 1.1.4

### Patch Changes

- a27dbfe: Use Axios for Paystack API requests to resolve header issues on some platforms.

  Credits: [JaeKralj](https://github.com/JaeKralj)

## 1.1.3

### Patch Changes

- 47af03f: Upgrade dependencies
  Include README in published package

## 1.1.2

### Patch Changes

- 731da1d: Re-adds amount and currency checks

  Adds new debug mode for testing

## 1.1.1

### Patch Changes

- e8cf256: Removes outdated Paystack API wrapper package we were using prior fixing deprecated dependency warnings.

  Also changes how we generate references. Transactions are initialized with Paystack and the returned reference used instead of an arbitrary cuid.

## 1.1.0

### Minor Changes

- Updates plugin to support new Payment Processor standard.

- Plugin now exports `PluginOptions` type helpful for configuring the plugin in `medusa-config.js`:

  ```ts
  const plugins = [
    // other plugins
    {
      resolve: `medusa-payment-paystack`,
      /** @type {import("medusa-payment-paystack").PluginOptions} */
      options: {
        secret_key: "<PAYSTACK_SECRET_KEY>",
      },
    },
  ];
  ```

- Removes unnecessary deps and updates outdated ones, results in smaller bundle size.

- Plugin does not attempt to verify amount and currency of transaction anymore.

## 1.0.2

### Patch Changes

- Removes miscellaneous files from built package

```

```
