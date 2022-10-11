import { MedusaError } from "medusa-core-utils";

export default async (req, res) => {
  const { Paystack_order_id } = req.query;

  try {
    const orderService = req.scope.resolve("orderService");
    const PaystackProviderService = req.scope.resolve("pp_Paystack");

    const PaystackOrder = await PaystackProviderService.retrieveCompletedOrder(
      Paystack_order_id
    );

    const cartId = PaystackOrder.merchant_data;
    const order = await orderService.retrieveByCartId(cartId);

    await PaystackProviderService.acknowledgeOrder(
      PaystackOrder.order_id,
      order.id
    );

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
