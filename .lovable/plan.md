# Add Purchases overview to Admin

## Current state
- The Admin dashboard has tabs: Projects, Requests, Assistant, Routes, Creator.
- The Catalogue module shows the itinerary editor/manager (`CatalogShopManager`), not customers.
- `catalog_purchases` is only queried to match against trip-request emails in the Requests tab.
- There is no place to see every customer who bought a pre-designed itinerary.

## Goal
Add a dedicated **Purchases** tab in the Admin that lists all `catalog_purchases` records, including customer and itinerary details.

## Changes

### 1. `src/pages/Admin.tsx`
- Add `"purchases"` to `activeTab` union.
- Add a new tab button next to Requests/Projects.
- Fetch `catalog_purchases` joined with `catalog_itineraries` (title, slug) and order by `created_at` descending.
- Render a table with columns:
  - Customer (name + email)
  - Itinerary (title + link to `/catalogue/:slug`)
  - Amount (with correct currency symbol)
  - Status (paid / pending)
  - Purchase date
  - Download token / Actions (copy/resend link)
- Add a stats row for total purchases, paid count, and revenue by currency.

### 2. Localization
- Add new keys under `admin.purchases*` in `src/i18n/locales/en.ts`, `pt.ts`, and `no.ts`.

### 3. No backend changes needed
- `catalog_purchases` is already accessible via existing RLS policies for authenticated admin/staff users.

## Outcome
Admins can open the **Purchases** tab and see a complete, filterable list of everyone who bought a pre-designed itinerary, with direct links to the itinerary subpages and quick revenue totals.