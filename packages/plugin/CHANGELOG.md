# medusa-payment-paystack

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
