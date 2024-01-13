import { Order } from "@medusajs/medusa"
import { Container, Heading, Text } from "@medusajs/ui"
import { paymentInfoMap } from "@modules/checkout/components/payment"
import Divider from "@modules/common/components/divider"
import { formatAmount } from "medusa-react"

type PaymentDetailsProps = {
  order: Order
}

const currencyCodeSymbolMap: { [key: string]: string } = {
  USD: "$",
  EUR: "€",
  DKK: "kr",
  GBP: "£",
  SEK: "kr",
  NOK: "kr",
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payments[0]

  return (
    <div>
      <Heading level="h2" className="flex flex-row my-6 text-3xl-regular">
        Payment
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start w-full gap-x-1">
            <div className="flex flex-col w-1/3">
              <Text className="mb-1 txt-medium-plus text-ui-fg-base">
                Payment method
              </Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="mb-1 txt-medium-plus text-ui-fg-base">
                Payment details
              </Text>
              <div className="flex items-center gap-2 txt-medium text-ui-fg-subtle">
                <Container className="flex items-center p-2 h-7 w-fit bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text>
                  {payment.provider_id === "stripe" && payment.data.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${formatAmount({
                        amount: payment.amount,
                        region: order.region,
                        includeTaxes: false, // Taxes are already included in the amount
                      })} paid at ${new Date(
                        payment.created_at
                      ).toLocaleString()}`}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
