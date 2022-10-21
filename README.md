<div align="center">
  <p align="center">
    <img alt="Medusa" src="https://uploads-ssl.webflow.com/61fba9f6deac297b7b22017d/62000006ce573a706c92546c_logo.svg" width="200" />
  </p>
  <h1>Medusa Payment Paystack</h1>
  <p>Add support for Paystack payments in Medusa Commerce applications.</p>
</div>

## Installation

In the root of your Medusa server, install the plugin:

```bash
yarn add medusa-payment-paystack
```

## Configuration

Obtain your [Paystack account's secret key](https://support.paystack.com/hc/en-us/articles/360009881600-Paystack-Test-Keys-Live-Keys-and-Webhooks) from the dashboard. This is used by the plugin to verify purchases and issue refunds.

Add the plugin to your list of plugins along with the secret key as a configuration option in `medusa-config.js`.

```js
const plugins = [
  // other plugins
  {
    resolve: `medusa-payment-paystack`,
    options: {
      secret_key: "sk-...",
    },
  },
];
```

## Usage

The plugin will add a payment method to your Medusa application with the id `paystack`.

### Admin

### Storefront
