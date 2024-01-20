![Medusa Paystack Plugin](https://user-images.githubusercontent.com/46872764/197322473-fddbc659-d81e-4f19-b36c-d9f553433c8f.png)

# About

`medusa-payment-paystack` is a [Medusa](https://medusajs.com) plugin that adds [Paystack](https://paystack.com) as a payment provider to Medusa ecommerce stores.

![GIF Demoing Paying with Paystack](https://user-images.githubusercontent.com/87580113/197406110-ff68bd20-60a1-4842-85c1-1a6ef46dd498.gif)

# Setup

## Prerequisites

- [Paystack account](https://dashboard.paystack.com/#/signup)
- [Paystack account's secret key](https://support.paystack.com/hc/en-us/articles/360009881600-Paystack-Test-Keys-Live-Keys-and-Webhooks)
- Medusa server

## Medusa Server

If you don’t have a Medusa server installed yet, you must follow the [quickstart guide](https://docs.medusajs.com/quickstart/quick-start/) first.

### Install the Paystack Plugin

In the root of your Medusa server, run the following command to install the Paystack plugin:

```bash
yarn add medusa-payment-paystack
```

### Configure the Paystack Plugin

Next, you need to add configurations for your paystack plugin.

In `medusa-config.js` add the following at the end of the `plugins` array:

```js
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

## Admin Setup

This step is required for you to be able to use Paystack as a payment provider in your storefront.

### Admin Prerequisites

If you don’t have a Medusa admin installed, make sure to follow [the guide on how to install it](https://github.com/medusajs/admin#-quickstart) before continuing with this section.

### Add Paystack to Regions

You can refer to [this documentation in the user guide](https://docs.medusajs.com/user-guide/regions/providers/#manage-payment-providers) to learn how to add a payment provider like Paystack to a region.

## Storefront Setup

Follow Medusa's [Checkout Flow](https://docs.medusajs.com/advanced/storefront/how-to-implement-checkout-flow/) guide using `paystack` as the `provider_id` to add Paystack to your checkout flow.

`medusa-payment-paystack` returns a transaction reference you should send to Paystack as the transaction's reference.

Using this returned reference as the Paystack transaction's reference allows the plugin to confirm the status of the transaction, verify that the paid amount and currency are correct before authorizing the payment.

### Using Transaction Reference

`medusa-payment-paystack` inserts a reference named `paystackTxRef` into the [`PaymentSession`](https://docs.medusajs.com/advanced/backend/payment/overview/#payment-session)'s data.

```js
const { paystackTxRef } = paymentSession.data;
```

Provide this reference when initiating the Paystack [Popup](https://paystack.com/docs/guides/migrating-from-inlinejs-v1-to-v2/) payment flow.

```js
const paymentForm = document.getElementById("paymentForm");
paymentForm.addEventListener("submit", payWithPaystack, false);

function payWithPaystack(e) {
  e.preventDefault();

  const paystack = new PaystackPop();

  paystack.newTransaction({
    key: "pk_test_xxxxxxxxxx", // Your Paystack public key
    email: document.getElementById("email-address").value,
    amount: document.getElementById("amount").value, // Value in lowest denomination of currency to be paid
    ref: paystackTxRef, // Reference gotten from plugin
    onSuccess() {
      // Call Medusa checkout complete here
    },
    onCancel() {
      alert("Window closed.");
    },
  });
}
```

### Verify Payment

Call the Medusa [Complete Cart](https://docs.medusajs.com/advanced/storefront/how-to-implement-checkout-flow/#complete-cart) method in the payment completion callback of your chosen flow.

`medusa-payment-paystack` will check the status of the transaction with the reference it provided you, verify the amount matches the cart total and mark the cart as paid for in Medusa.

## Refund Payments

You can refund captured payments made with Paystack from the Admin dashboard.

`medusa-payment-paystack` handles refunding the given amount using Paystack and marks the order in Medusa as refunded.

# Demo

![Demo video](https://user-images.githubusercontent.com/87580113/211937892-d1a34735-78a5-451d-83f8-bc23185dd8ef.png)

[Demo Video](https://vimeo.com/763132960)

Clone the demo repository [a11rew/medusa-payment-paystack-demo](https://github.com/a11rew/medusa-paystack-demo) and follow the [setup instructions](https://github.com/a11rew/medusa-paystack-demo#set-up-project) to get started.
