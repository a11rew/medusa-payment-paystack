# medusa-payment-paystack

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
