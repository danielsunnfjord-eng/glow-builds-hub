Live Stripe is fully provisioned (all 5 go-live steps complete), but no published itineraries are mirrored to the live account yet — only the sandbox account holds products. One itinerary is currently published: **Sogn og Fjordane: The soul of Norwegian fjords** (€35).

## Steps

1. **Run live sync** — invoke `sync-catalog-stripe-products` with `{"environment":"live"}` to mirror every published itinerary to the live Stripe account. This creates the live Product + Price and writes `stripe_product_id_live` back to the database.

2. **Verify a live checkout session** — call `create-catalog-checkout` with `environment: "live"` against the published itinerary, confirm a `clientSecret` comes back (proves live keys, live product, and live price all resolve), and check the edge-function logs for errors.

3. **Smoke-test the customer flow in the preview** — open `/catalogue/sogn-og-fjordane-…`, click the purchase CTA, confirm the embedded Stripe checkout renders in **live mode** (no orange "test mode" banner, no `pk_test_` indicator). I will not complete a real card charge — the goal is to confirm the form loads against live keys.

4. **Report status** — confirm whether customers can now purchase, and flag any remaining issues (e.g. unpublished itineraries that need publishing before they appear for sale).

## Technical notes

- No code changes expected. Sync function and checkout function already support `environment: "live"`.
- Only `is_published = true` itineraries are synced. The other 18 drafts will remain unsynced until you publish them.
- If the live sync fails (e.g. tax code missing, gateway auth), I'll diagnose from edge function logs and propose a fix in a follow-up plan.