## [Medusa](https://medusajs.com/) plugin to add support for payments with [Paystack](https://paystack.com)

![Medusa Paystack Plugin](https://user-images.githubusercontent.com/46872764/197322473-fddbc659-d81e-4f19-b36c-d9f553433c8f.png)

# Demo link

[medusa-payment-paystack](https://www.npmjs.com/package/medusa-payment-paystack)

# About

## Participants

Andrew(GitHub)- [@a11rew](https://github.com/a11rew)
Andrew(Twitter)- [@a11rew](https://twitter.com/a11rew)
Andrew(Discord)- AndrewHGA

Femakin(GitHub)- [@femakin](https://github.com/femakin)
Femakin(Twitter)- [@akinyemi_t](https://twitter.com/akinyemi_t)
Femakin(Discord)- Femi#3266

## Description

Paystack allows African businesses to accept secure payments from multiple local and global payment channels. Let your customers pay you with their choice of methods by integrating Paystack with your Medusa website.

Using the `medusa-payment-paystack` plugin, this guide shows you how to set up your Medusa server with Paystack as a payment provider.

### Preview

Demo video to be uploaded here

## Set up Project

### Prerequisites

To begin this guide, you will need to create a [Paystack account](https://dashboard.paystack.com/#/signup). By doing this, you will be able to obtain the [Paystack account's secret key](https://support.paystack.com/hc/en-us/articles/360009881600-Paystack-Test-Keys-Live-Keys-and-Webhooks) from the dashboard. The plugin uses this to verify purchases, issue refunds, and connect Medusa to Paystack.

Additionally, you need a Medusa server installed and set up with at least `@medusajs/medusa^1.5.0`. Follow the [quickstart guide](https://docs.medusajs.com/quickstart/quick-start) to get started.

You also need [Medusa Admin](https://docs.medusajs.com/admin/quickstart/) installed to enable Paystack as a payment provider. You can alternatively use the [REST APIs](https://docs.medusajs.com/api/admin).

## Medusa Server

This section guides you over the steps necessary to add Paystack as a payment provider to your Medusa server.

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
    options: {
      secret_key: "<PAYSTACK_SECRET_KEY>",
    },
  },
];
```

## Admin Setup

This section will guide you through adding Paystack as a payment provider in a region using your Medusa admin dashboard.

This step is required for you to be able to use Paystack as a payment provider in your storefront.

### Admin Prerequisites

If you don’t have a Medusa admin installed, make sure to follow along with [the guide on how to install it](https://github.com/medusajs/admin#-quickstart) before continuing with this section.

### Add Paystack to Regions

You can refer to [this documentation in the user guide](https://docs.medusajs.com/user-guide/regions/providers/#manage-payment-providers) to learn how to add a payment provider like Paystack to a region.

## Storefront Setup

Follow Medusa's [Checkout Flow](https://docs.medusajs.com/advanced/storefront/how-to-implement-checkout-flow/) guide using `paystack` as the `provider_id` to add Paystack to your checkout flow.

`medusa-payment-paystack` returns a transaction reference you should send to Paystack as the transaction's reference.

Using this returned reference as the Paystack transaction's reference allows the plugin to confirm the status of the transaction, verify that the paid amount and currency are correct before authorizing the payment.

### Using Transaction Reference

`medusa-payment-paystack` inserts a `paystackTxRef` into the [`PaymentSession`](https://docs.medusajs.com/advanced/backend/payment/overview/#payment-session)'s data.

```
const { paystackTxRef } = paymentSession.data
```

Provide this reference when initiating any of the Paystack [Accept Payment](https://paystack.com/docs/payments/accept-payments/) flows.

For example, when using the [Paystack Popup](https://paystack.com/docs/payments/accept-payments/#popup), provide this reference to the initialization method;

```js
const paymentForm = document.getElementById('paymentForm');
paymentForm.addEventListener("submit", payWithPaystack, false);

function payWithPaystack(e) {
  e.preventDefault();

  let handler = PaystackPop.setup({
    key: 'pk_test_xxxxxxxxxx',
    email: document.getElementById("email-address").value,
    amount: document.getElementById("amount").value * 100,
    ref: paystackTxRef // Reference returned from plugin
    onClose: function(){
      alert('Window closed.');
    },
    callback: function(response){
      // Call Medusa checkout complete here
    }
  });

  handler.openIframe();
}
```

### Verify Payment

Call the Medusa [Complete Cart](https://docs.medusajs.com/advanced/storefront/how-to-implement-checkout-flow/#complete-cart) method in the payment completion callback of your chosen flow.

`medusa-payment-paystack` will check the status of the transaction with the ref

## Resources

- [Medusa Payment Architecture Overview](https://docs.medusajs.com/advanced/backend/payment/overview/)
- [Medusa Create Plugin](https://docs.medusajs.com/advanced/backend/plugins/create/)
