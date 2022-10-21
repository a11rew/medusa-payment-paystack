![Medusa Paystack Plugin](https://res.cloudinary.com/femakin/image/upload/v1666371662/Frame_59841_cuqbl1.png)

# Paystack

This document guides you through setting up Paystack as a payment provider in your Medusa server, admin, and storefront using the [Paystack plugin](https://github.com/femakin/medusa-payment-paystack/tree/master).

## Overview

Paystack allows Nigerian, Ghanaian, and South African businesses to accept secure payments from multiple local and global payment channels. Let your customers pay you with their choice of methods by integrating Paystack with your Medusa website.

Using the `medusa-payment-paystack` plugin, this guide shows you how to set up your Medusa server with Paystack as a payment provider.


## Prerequisites

To begin this guide, you will need to create a [Paystack account](https://dashboard.paystack.com/#/signup?_id=01137601-d686-45ac-a3f5-dca9afce19c6R). By doing this, you will be able to obtain the [Paystack account's secret key](https://support.paystack.com/hc/en-us/articles/360009881600-Paystack-Test-Keys-Live-Keys-and-Webhooks) from the dashboard. The plugin uses this to verify purchases, issue refunds, and connect Medusa to Paystack.

Additionally, you need a Medusa server installed and set up. If not, you can follow the [quickstart guide](https://docs.medusajs.com/quickstart/quick-start) to get started.

You also need [Medusa Admin](https://docs.medusajs.com/admin/quickstart/) installed to enable Paystack as a payment provider. You can alternatively use the [REST APIs](https://docs.medusajs.com/api/admin).

## Medusa Server

This section guides you over the steps necessary to add Paystack as a payment provider to your Medusa server.

If you don’t have a Medusa server installed yet, you must follow the [quickstart guide](../quickstart/quick-start) first.

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
      secret_key: "sk-...",
    },
  },
];
```

It's that simple to install Paystack on your Medusa server!


## Admin Setup

This section will guide you through adding Paystack as a payment provider in a region using your Medusa admin dashboard.

This step is required for you to be able to use Paystack as a payment provider in your storefront.

### Admin Prerequisites

If you don’t have a Medusa admin installed, make sure to follow along with [the guide on how to install it](https://github.com/medusajs/admin#-quickstart) before continuing with this section.

### Add Paystack to Regions

You can refer to [this documentation in the user guide](../user-guide/regions/providers.mdx#manage-payment-providers) to learn how to add a payment provider like Paystack to a region.



## Storefront Setup

This guide will take you through how to set up Paystack payments in your Medusa storefront. It includes the steps necessary when using one of Medusa’s official storefronts as well as your own custom React-based storefront.

### Storefront Prerequisites

All storefronts require that you obtain your Paystack’s Public Key. You can retrieve it from your Paystack’s dashboard.

### Add to Next.js Storefront

Medusa has a Next.js storefront that you can easily use with your Medusa server. If you don’t have the storefront installed, you can follow [this quickstart guide](../starters/nextjs-medusa-starter).

In your `.env.local` file (or the file you’re using for your environment variables), add the following variable:

```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<PAYSTACK_PUBLIC_KEY>
```

Make sure to replace `<PAYSTACK_PUBLIC_KEY>` with your Paystack Public Key.

Now, if you run your Medusa server and your storefront, on checkout you’ll be able to use Stripe.

![Next.js Stripe Form](https://res.cloudinary.com/femakin/image/upload/v1666371607/Screenshot_2022-10-21_at_17.57.32_fx2nnq.png)



### Add to Gatsby Storefront

Medusa also has a Gatsby storefront that you can use as your ecommerce store. If you don’t have the storefront installed, you can follow [this quickstart guide](../starters/gatsby-medusa-starter).

In your `.env.development` file (or the file you’re using for your environment variables) add the following variable with the value set to the Public Key:

```jsx
GATSBY_STRIPE_KEY=pk_
```

:::note

You might find this environment variable already available so you can just replace its value with your Publishable Key.


### Add to Custom Storefront

This section guides you to add Paystack into a React-based framework. The instructions are general instructions that you can use in your storefront.

The integration with Paystack must have the following workflow:

1. During checkout when the user reaches the payment section, you should create payment sessions. This will initialize the payment_sessions array in the cart object received. The payment_sessions list contains an array of available payment providers.

2. If Paystack is available as a payment provider, you should select Paystack as the payment session for the current cart. This will initialize the payment_session object in the cart object to include data related to Paystack and the current payment session. The payment intent and client secret are included here.

3. After the user enters their card details and submits the form, confirm the payment with Paystack.

4. If the payment is successful, complete the order in Medusa. Otherwise show an error.

In your storefront, you need to install the [React Paystack components library](https://www.npmjs.com/package/react-paystack) and the [Medusa JS Client library](https://www.npmjs.com/package/@medusajs/medusa-js) with the foloowing codes:

```bash 
npm install react-paystack --save
```

```bash 
npm install @medusajs/medusa-js
```




