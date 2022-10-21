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

