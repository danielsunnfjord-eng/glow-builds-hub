## Stripe Products + Sale Notifications

**1. Mirror catalogue itineraries as Stripe Products**
- Add a sync function that, for each published `catalog_itineraries` row, creates/updates a Stripe Product (name = itinerary title, description = subtitle, tax code for digital travel guides) and stores the resulting `stripe_product_id` on the row.
- Add `stripe_product_id` column to `catalog_itineraries` (migration).
- Update `create-checkout` edge function to attach the Stripe Product to the line item (via `price_data.product = stripe_product_id`) instead of inline `product_data.name`. Keep dynamic per-currency pricing + 7% service fee logic as-is.
- Run sync once for existing published itineraries; auto-sync on publish/update going forward via trigger from the admin save flow.

**2. Internal "new sale" email to Daniel**
- In the existing Stripe webhook handler (where `catalog_purchases.status` is set to `paid`), enqueue a second email to Daniel's address containing: buyer name, buyer email, itinerary title, amount, currency, purchase timestamp.
- Reuse the existing email infrastructure (same queue as the customer PDF email).
- Daniel's notification address: confirm which address to use (the admin login email, or a different one?).

**3. No changes to**
- Subscription model (staying one-off only)
- Newsletter auto-subscribe (skipped — GDPR)
- Upsell emails (skipped for now)
- Existing 7-day signed download window
- Customer-facing post-purchase email

**One question before building:** Which email address should receive the internal sale notifications?