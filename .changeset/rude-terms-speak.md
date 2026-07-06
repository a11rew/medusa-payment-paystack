---
"medusa-payment-paystack": patch
---

Send integer subunit amounts to Paystack. Payment initiation no longer fails on decimal totals due to floating-point drift, and refunds now convert to the smallest currency unit instead of under-refunding by 100x.
