
## Where the first itinerary stands today

Sogn og Fjordane is the only itinerary with `is_published = true`, price €30, full content, hero image, body PDF, map and budget. The buy button + checkout edge function already exist. But three concrete blockers will stop a real customer from completing a purchase and getting their PDF.

## Blockers (in priority order)

### 1. The downloadable PDF is not wired up (will break post-payment)
- `download-catalog-pdf` reads from `catalog_itineraries.pdf_path` (a Storage path in the `catalog-pdfs` bucket).
- For Sogn og Fjordane, `pdf_path` is **NULL**. Only `body_pdf_url` (a public URL to a body-only PDF in `catalog-images`) is set.
- Result: customer pays, lands on success page, clicks Download → "PDF not available yet".

**Fix options (pick one):**
- **A.** Generate the full deliverable PDF (cover + body + practical info) via the existing `generate-catalog-pdf` function, save it to the private `catalog-pdfs` bucket, and store the path in `pdf_path`. *Recommended — this is what the function was built for.*
- **B.** Upload a final PDF manually in the editor and save its path to `pdf_path`.

### 2. Stripe is hardcoded to sandbox
- Both `create-catalog-checkout` and `verify-catalog-purchase` call `createStripeClient("sandbox")`.
- Real payments will not go through until we (a) complete Stripe go-live so `STRIPE_LIVE_API_KEY` exists, and (b) switch the env based on the build (`pk_test_` → sandbox, `pk_live_` → live) like the rest of the platform expects.

**Action:** trigger Stripe go-live from the project, then update the two edge functions to derive `StripeEnv` from a value passed in by the client (`getStripeEnvironment()`).

### 3. No webhook → purchases only confirmed if the user returns to the success page
- `verify-catalog-purchase` runs only when the browser hits `/catalogue/success?...`. If the customer closes the tab after paying, `catalog_purchases.status` stays `pending` forever and they never get the download email.
- Add a `stripe-webhook` edge function listening for `checkout.session.completed` that marks the purchase paid and triggers the delivery email (using `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET`, which are already in secrets).

## Nice-to-have, not blockers
- Delivery email with the download link (currently the success page is the only path to the PDF).
- Multi-currency at checkout (today price is forced to EUR even though we display NOK/BRL elsewhere).
- Move from redirect checkout to embedded checkout to match the platform standard.

## Suggested order

1. Generate & attach the full PDF for Sogn og Fjordane (Blocker 1).
2. Add the Stripe webhook + a simple delivery email so paid status + PDF link reach the customer reliably (Blocker 3).
3. Run Stripe go-live, then switch the two functions to env-aware (Blocker 2).
4. Test end-to-end in sandbox with card `4242 4242 4242 4242`, then once more in live with a real card after go-live.

## Question before I build

Which blocker do you want me to tackle first — **(1) wire up the downloadable PDF**, **(2) add the webhook + delivery email**, or **(3) start the Stripe go-live flow**? I'd recommend (1) since nothing else matters if the file can't be delivered.
