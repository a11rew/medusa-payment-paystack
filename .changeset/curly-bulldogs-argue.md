---
"medusa-payment-paystack": patch
---

Removes outdated Paystack API wrapper package we were using prior fixing deprecated dependency warnings.

Also changes how we generate references. Transactions are initialized with Paystack and the returned reference used instead of an arbitrary cuid.
