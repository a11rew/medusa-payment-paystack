import type {
  OrderService,
  SubscriberConfig,
  SubscriberArgs,
} from "@medusajs/medusa";
import PaystackPaymentProcessor, {
  type PaystackPaymentProcessorConfig,
} from "../services/paystack-payment-processor";

type OrderPlacedData = {
  id: string;
};

function isOrderPlacedData(data: unknown): data is OrderPlacedData {
  return typeof data === "object" && data !== null && "id" in data;
}

export const config: SubscriberConfig = {
  event: "order.placed",
};

export default async function orderCapturer({
  container,
  data,
}: SubscriberArgs) {
  const orderService = container.resolve<OrderService>("orderService");
  const pluginConfiguration = container.resolve<
    PaystackPaymentProcessor & {
      configuration: PaystackPaymentProcessorConfig;
    }
  >(`pp_${PaystackPaymentProcessor.identifier}`).configuration;

  try {
    if (!isOrderPlacedData(data)) {
      return;
    }

    const order = await orderService.retrieve(data.id, {
      relations: ["payments"],
    });
    if (!order) return;

    // Check if the order was paid for with Paystack
    const isPaidForWithPaystack = order.payments?.some(
      p => p.provider_id === "paystack",
    );
    if (!isPaidForWithPaystack) return;

    if (pluginConfiguration.debug) {
      console.info(
        "PS_P_Debug: Capturing Paystack order with data:",
        JSON.stringify(data, null, 2),
      );
    }

    // Capture the payment
    await orderService.capturePayment(order.id);
  } catch (error) {
    console.error("Error capturing Paystack order:", error);
  }
}
