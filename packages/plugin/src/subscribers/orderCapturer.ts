import { EventBusService, OrderService, CartService } from "@medusajs/medusa";

type InjectedDependencies = {
  eventBusService: EventBusService;
  orderService: OrderService;
  cartService: CartService;
};

type OrderPlacedData = {
  id: string;
};

function isOrderPlacedData(data: unknown): data is OrderPlacedData {
  return typeof data === "object" && data !== null && "id" in data;
}

class PaystackOrderCapturer {
  eventBusService: EventBusService;
  orderService: OrderService;

  constructor(container: InjectedDependencies) {
    this.eventBusService = container.eventBusService;
    this.orderService = container.orderService;

    this.eventBusService.subscribe("order.placed", this.handleOrder);
  }

  handleOrder = async (data: unknown) => {
    try {
      if (!isOrderPlacedData(data)) {
        return;
      }

      const order = await this.orderService.retrieve(data.id, {
        relations: ["payments"],
      });
      if (!order) return;

      // Check if the order was paid for with Paystack
      const isPaidForWithPaystack = order.payments?.some(
        p => p.provider_id === "paystack",
      );
      if (!isPaidForWithPaystack) return;

      // Capture the payment
      await this.orderService.capturePayment(order.id);
    } catch (error) {
      console.error("Error capturing Paystack order:", error);
    }
  };
}

export default PaystackOrderCapturer;
