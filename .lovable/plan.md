# Show view and download counts on itinerary shop cards

Yes — this is possible. The data already exists:

- **Views**: each itinerary already tracks a view counter that increases when someone opens its page (e.g. 213, 131, 73 views on current itineraries).
- **Downloads**: paid purchases are already recorded per itinerary (currently 1 paid purchase in total across the catalogue).

## What will be built

On each card in the itinerary shop, in the spot where the price used to be, show a small stats row matching the screenshot:

```text
👁  2,965      ⬇  197
```

- Eye icon + view count, download icon + purchase count.
- Numbers formatted with locale-aware thousands separators (2 965 / 2.965 / 2,965 depending on language).
- Muted small text, aligned with the card footer, consistent with the existing card styling.
- Tooltip/aria labels translated for EN, NO and PT-BR ("views", "downloads").

### Zero handling

Almost all itineraries currently have 0 purchases. Default behaviour: always show the eye count, and show the download count only when it is greater than 0 (so cards don't advertise "0 downloads"). Tell me if you'd rather always show both.

## Technical notes

- The shop query adds `view_count` to the selected columns of `catalog_itineraries`.
- Purchase counts come from the existing `get_catalog_sales_counts()` database function, which returns paid counts per itinerary. It is currently only callable by internal/admin roles, so a small migration grants execute permission to public visitors (it exposes only aggregate counts, no customer data).
- The shop page fetches the counts once alongside the itinerary list and maps them by itinerary id.
- Files touched: `src/pages/ItinerariesShop.tsx`, the three locale files, plus one database permission migration.
