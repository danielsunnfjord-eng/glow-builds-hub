## Add a "Sync to Stripe" button in the catalogue admin

Give yourself an explicit moment to push an itinerary to Stripe when it's truly ready for sale, instead of relying on the lazy auto-create that fires on the first checkout.

### What the button does

For the current itinerary, call the existing `sync-catalog-stripe-products` edge function (already deployed, already idempotent) for **both** environments (sandbox + live) so previews and production stay in sync. The function will:

- Create the Stripe Product if none exists for that environment, or
- Update the existing Product's name, description, hero image, and tax code, or
- Recreate it if Stripe returns an error on update.

It then writes `stripe_product_id_sandbox` / `stripe_product_id_live` and `stripe_synced_at` back to `catalog_itineraries`. Price is **not** synced — it stays dynamic on the DB row and is sent at checkout via `price_data` (already the case today).

### Where the button lives

In `src/components/voyage/CatalogShopManager.tsx`, in the itinerary editor header next to the existing publish / Google Doc sync controls.

Behavior:
- Label: `Sync to Stripe`
- Disabled when the itinerary is unsaved or `is_published === false`, with a tooltip: *"Publish the itinerary before syncing to Stripe."*
- Spinner while running; toast on success showing `created` / `updated` / `recreated` per environment.
- Below the button, show a small status line:
  - `Last synced: <relative time>` from `stripe_synced_at`
  - Or `Not yet synced` (in which case Stripe will lazily create on first checkout — explained in tooltip).

### Catalogue list view

In the same file's catalogue table, add a tiny badge per row:
- ✅ `Synced` when `stripe_product_id_sandbox` (or `_live`) is set
- ⚪ `Not synced` otherwise

So you can see at a glance which itineraries are live in Stripe.

### Backend

No new edge functions, no schema changes. `sync-catalog-stripe-products` already accepts `{ itinerary_id, environment }` and handles single-itinerary sync.

Two invocations from the client (parallel):
```ts
supabase.functions.invoke("sync-catalog-stripe-products", { body: { itinerary_id, environment: "sandbox" } })
supabase.functions.invoke("sync-catalog-stripe-products", { body: { itinerary_id, environment: "live" } })
```

Toast aggregates both results. If live fails (e.g. live key not yet claimed), show a soft warning rather than an error — sandbox success is still useful.

### Safety net stays

The lazy create-on-first-checkout path in `create-catalog-checkout/index.ts` stays untouched, so a forgotten sync never blocks a sale.

### Verification

1. Add a new test itinerary, publish it, click **Sync to Stripe** → toast says "created" for sandbox, row badge flips to ✅, `stripe_synced_at` updates.
2. Edit the title/hero image, click again → toast says "updated", `stripe_product_id_sandbox` unchanged.
3. Confirm an unpublished itinerary disables the button.
