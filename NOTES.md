# Notes

## Decisions

**1. Amount representation and calculation**

I used decimal.js, keeping API amounts as strings and validating their format and precision before calculating. I considered bigint, which worked well in the demo, but handling asset units alongside USD prices required more conversion code. Fees are deducted once, and the USD total includes available, pending and claiming balances, rounded to two decimal places only for display

**2. Balance immediately after a claim**

I kept the latest server balance visible and showed the claim status separately. A local reservation overlay would make the balance change immediately, but stale snapshots make it harder to avoid double subtraction or temporary jumps. The app blocks another claim until the current operation finishes and a sufficiently recent balance snapshot arrives, with recovery information preserved across reloads

**3. Unknown claim result**

After a timeout, the app shows that the outcome is unknown instead of reporting a failed claim. It saves the request body and idempotency key before submission, so recovery can resend the same operation even after a reload. I chose manual recovery over automatic retries, while respecting the server’s rate-limit delay. An explicit rejection lets the user correct the request; a lost response does not prove that nothing happened.

## Working with AI

#1
My first visual prompt did not specify a clear brand reference, so the AI proposed navy and gold. I changed it to ask for an analysis of CashMine’s actual website and colors. That produced a design based on the existing brand rather than a guess

#2 The AI reported successful layout checks, but I still noticed a spacing problem in the “Trading fees. Coming back.” card. I pointed it out, and the investigation found that desktop flex sizing was causing an overlap on mobile. The fix separated mobile and desktop sizing and added checks for vertical overlap.

#3 I challenged the recommendation to keep a custom fetch client because we were maintaining timeout and cancellation code ourselves. We switched to Axios while keeping the validation and idempotency rules in our application code. This reduced the custom request code, and the existing tests still passed. 

## Not done / known issues
At the time of this review, the amount tests still covered the earlier demo helpers rather than the new decimal calculations. Cross-tab claim coordination also needs work because the storage check is not an atomic lock. The final deployed claim flow had not been verified in this review, and the README still described the older demo. I would update the documentation, test the production amount functions and verify submission, recovery and settlement on the live build.
