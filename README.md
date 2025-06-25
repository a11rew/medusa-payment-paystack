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

If you don’t have a Medusa server installed yet, you must follow the [quickstart guide](https://docs.medusajs.com/learn) first.

### Install the Paystack Plugin

In the root of your Medusa server (backend), run the following command to install the Paystack plugin:

```bash
yarn add medusa-payment-paystack
```

### Configure the Paystack Plugin

Next, you need to enable the plugin in your Medusa server.

In `medusa-config.ts` add the following to the `plugins` array:

```ts
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // ... other config
  },
  modules: [
    // other modules
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // other payment providers like stripe, paypal etc
          {
            resolve: "medusa-payment-paystack",
            options: {
              secret_key: <PAYSTACK_SECRET_KEY>,
            } satisfies import("medusa-payment-paystack").PluginOptions,
          },
        ],
      },
    },
  ],
});
```

The full list of configuration options you can pass to the plugin can be found in [Config](#configuration)

### Setup Webhooks

To ensure that Medusa is notified of successful payments, you need to set up webhooks in your Paystack dashboard. If you're installing this plugin for production use, this is a required step.

Go to your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developer) and navigate to the "API Keys & Webhooks" section.

Set the Webhook URL to `<your-medusa-backend-url>/hooks/payment/paystack`. Eg. `https://your-medusa-backend.com/hooks/payment/paystack`.

## Admin Setup

This step is required for you to be able to use Paystack as a payment provider in your storefront.

### Add Paystack to Regions

Refer to [this documentation in the user guide](https://docs.medusajs.com/v1/user-guide/regions/providers/#manage-payment-providers) to learn how to add a payment provider like Paystack to a region.

## Storefront Setup

Follow Medusa's [Storefront Development Checkout Flow](https://docs.medusajs.com/resources/storefront-development/checkout/payment) guide using `pp_paystack` as the `provider_id` to add Paystack to your checkout flow.

### Email in `initiatePaymentSession` data

Paystack requires the customer's email address to create a transaction.

You **need** to pass the customer's email address in the `initiatePaymentSession` context to create a transaction.

If your storefront does not collect customer email addresses, you can provide a dummy email but be aware all transactions on your Paystack dashboard will be associated with that email address.

```ts
await initiatePaymentSession(cart, {
  provider_id: selectedPaymentMethod,
  data: {
    email: cart.email,
  },
});
```

### Completing the Payment Flow

`medusa-payment-paystack` returns an access code and authorization URL that you should use to complete the Paystack payment flow on the storefront.

Using the returned access code and authorization URL allows the plugin to confirm the status of the transaction on your backend, and then relay that information to Medusa.

`medusa-payment-paystack` inserts the access code (`paystackTxAccessCode`) and authorization URL (`paystackTxAuthorizationUrl`) into the [`PaymentSession`](https://docs.medusajs.com/advanced/backend/payment/overview/#payment-session)'s data.

You can use the access code to resume the payment flow, or the authorization URL to redirect the customer to Paystack's hosted payment page.

#### Using Access Code

Extract the access code from the payment session's data:

```js
const { paystackTxAccessCode } = paymentSession.data;
```

Provide this access code to the `resumeTransaction` method from Paystack's [InlineJS](https://paystack.com/docs/guides/migrating-from-inlinejs-v1-to-v2/) library.

```ts
import Paystack from "@paystack/inline-js"

const PaystackPaymentButton = ({
  session,
  notReady,
}: {
  session: HttpTypes.StorePaymentSession | undefined
  notReady: boolean
}) => {
  const paystackRef = useRef<Paystack | null>(null)

  // If the session is not ready, we don't want to render the button
  if (notReady || !session) return null

  // Get the accessCode added to the session data by the Paystack plugin
  const accessCode = session.data.paystackTxAccessCode
  if (!accessCode) throw new Error("Transaction access code is not defined")

  return (
    <button
      onClick={() => {
        if (!paystackRef.current) {
          paystackRef.current = new Paystack()
        }

        const paystack = paystackRef.current

        paystack.resumeTransaction(accessCode, {
          async onSuccess() {
            // Call Medusa checkout complete here
            await placeOrder()
          },
          onError(error: unknown) {
            // Handle error
          },
        })
      }}
    >
      Pay with Paystack
    </button>
  )
}
```

#### Using Authorization URL

As a pre-requisite, you must have configured a "Callback URL" in your Paystack dashboard. Follow [this guide](https://support.paystack.com/en/articles/2129538) to set it up.

The callback URL can be a custom route on your Medusa backend, it can be a page in your storefront or a view in your mobile application. That route just needs to call the Medusa [Complete Cart](https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart) method.

Extract the authorization URL from the payment session's data:

```ts
const { paystackTxAuthorizationUrl } = session.data;
```

Redirect the customer to the authorization URL to complete the payment.

```ts
// Redirect the customer to Paystack's hosted payment page
window.open(paystackTxAuthorizationUrl, "_self");
```

Once the payment is successful, the customer will be redirected back to the callback URL. This page can then call the Medusa [Complete Cart](https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart) method to complete the checkout flow and show a success message to the customer.

### Verify Payment

Call the Medusa [Complete Cart](https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart) method in the payment completion callback of your chosen flow as mentioned in [Completing the Payment Flow](#completing-the-payment-flow) above.

`medusa-payment-paystack` will verify the transaction with Paystack and mark the cart as paid for in Medusa.

Even if the "Complete Cart" method is not called for any reason, with webhooks set up correctly, the transaction will still be marked as paid for in Medusa when the user pays for it.

## Refund Payments

You can refund captured payments made with Paystack from the Admin dashboard.

`medusa-payment-paystack` handles refunding the given amount using Paystack and marks the order in Medusa as refunded.

Partial refunds are also supported.

# Configuration

| Name            | Type      | Default | Description                                                                                                                                                                                            |
| --------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| secret_key      | `string`  | -       | Your Paystack secret key. Should be in the format sk_test-... or sk_live-... Obtainable from the Paystack dashboard - Settings -> API Keys & Webhooks.                                                 |
| disable_retries | `boolean` | `false` | Disable retries on network errors and 5xx errors on idempotent requests to Paystack. Generally, you should not disable retries, these errors are usually temporary but it can be useful for debugging. |
| debug           | `boolean` | `false` | Enable debug mode for the plugin. If true, logs helpful debug information to the console. Logs are prefixed with "PS_P_Debug".                                                                         |

# Examples

The [`examples`](https://github.com/a11rew/medusa-payment-paystack/blob/main/examples) directory contains an example Medusa installation with the Paystack plugin installed and configured. The backend can be found in the [`backend`](https://github.com/a11rew/medusa-payment-paystack/blob/main/examples/backend) directory and the storefront can be found in the [`storefront`](https://github.com/a11rew/medusa-payment-paystack/blob/main/examples/storefront) directory.

The storefront is built with Next.js and uses the inline-js Paystack library to complete the payment flow.

The examples are the default Medusa V2 storefront and backend starters. View all the changes made to the examples to add Paystack support in this commit: [feat: add paystack payment support](https://github.com/a11rew/medusa-payment-paystack/commit/3782286cb5693df1511d24bdaa2440efe6e747c5).

# V1

The [`v1` branch](https://github.com/a11rew/medusa-payment-paystack/tree/v1) contains the original version of this plugin with support for Medusa V1. The example storefront and backend for the v1 version can also be found in the [examples directory](https://github.com/a11rew/medusa-payment-paystack/tree/v1/examples) of the `v1` branch.

It can be installed from npm using the `1` version tag:

```bash
yarn add medusa-payment-paystack@1
```

The `v1` branch is no longer maintained and is only kept for reference.
