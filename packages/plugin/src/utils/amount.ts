import type { BigNumberInput } from "@medusajs/framework/types";
import { MathBN } from "@medusajs/framework/utils";

/**
 * Scales a Medusa amount (decimal major units, e.g. 19.99) to the integer
 * subunit Paystack expects. Paystack rejects non-integer amounts, and plain
 * float math drifts (19.99 * 100 === 1998.9999999999998), so the scaling runs
 * through MathBN and the result is rounded.
 *
 * https://paystack.com/docs/api/#supported-currency
 */
export function getPaystackAmount(amount: BigNumberInput): number {
  return Math.round(MathBN.mult(amount, 100).toNumber());
}
