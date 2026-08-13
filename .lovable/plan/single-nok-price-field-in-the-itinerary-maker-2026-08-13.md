# Single NOK price field in the itinerary maker

NOK is now the base currency and every displayed price is converted live to BRL, USD and EUR. The editor still asks for four separate prices, which is redundant and causes "placeholder" warnings.

## Change

In the itinerary editor (catalog shop manager), the price block becomes a single field:

- Keep **Price (NOK)** only.
- Remove the **Price (EUR)**, **Price (USD)** and **Price (BRL)** inputs and their orange "Placeholder — set the real ... price" hints.
- The readiness/publish check that currently requires all four prices to be set and different now only requires a NOK price greater than zero.

Nothing else changes: the public pages, checkout, and currency conversion logic stay exactly as they are.

## Technical notes

File: `src/components/voyage/CatalogShopManager.tsx`

- Remove the EUR/USD/BRL `Label`/`Input` blocks (around lines 2079-2101), leaving the NOK field.
- Simplify the completeness condition (lines 1512-1515) to `Number(s.priceNok) > 0`.
- Keep `priceEur/priceUsd/priceBrl` in the draft state and in the save payloads so existing rows and the DB columns are untouched; only the UI inputs and the validation rule change.
