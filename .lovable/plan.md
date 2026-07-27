## Goal
Show admin, on each trip request in the dashboard, whether the client has already purchased an itinerary from the shop — matched automatically by email.

## How the match works
- On the Requests tab, for every visible `trip_requests` row, look up paid rows in `catalog_purchases` where `customer_email = trip_requests.client_email` (case-insensitive).
- Group results per email so one query covers the whole list.
- A request is a "customer" if it has ≥1 `paid` purchase for that email.

## UI changes (Admin.tsx, Requests tab only)
On each request card, next to the status badge:
- If purchases found: a green "Customer" badge showing the count (e.g. "Customer · 2 purchases").
- Expand the card with a small "Previous purchases" block listing each: itinerary title, purchase date, amount + currency, status. Titles link to the itinerary shop detail page.
- If no match: no extra badge (keeps the card clean).

No changes to the public site, the trip request form, or the purchases table.

## Technical details
- New react-query query `["request-purchases", emails]` in `src/pages/Admin.tsx`:
  - Collect unique lowercase emails from `tripRequests`.
  - `supabase.from('catalog_purchases').select('id, customer_email, itinerary_id, amount_total, currency, status, created_at, catalog_itineraries(title_en, slug)').in('customer_email', emails).eq('status','paid')`.
  - Build `Map<emailLower, Purchase[]>`.
- Render badge + list from that map inside the existing `tripRequests.map(...)` block.
- Add localized strings `requests.customerBadge`, `requests.previousPurchases`, `requests.noPurchases` to `en.ts`, `pt.ts`, `no.ts`.

## RLS / permissions
`catalog_purchases` already allows staff/admin SELECT (used by existing sales dashboards), so no policy changes are needed. If the query returns empty for a known match, we'll re-verify the policy at implementation time.

## Out of scope
- No schema changes, no foreign key between the tables.
- No changes to the client-facing form or emails.
- Email normalization is limited to lowercasing; no alias handling (`+tag`, etc.).