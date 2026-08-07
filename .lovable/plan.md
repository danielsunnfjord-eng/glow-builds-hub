# Filtrar as recomendações por idioma do site

## Problema

Na subpágina de um roteiro, a seção "Você também pode gostar" busca qualquer roteiro publicado, sem filtrar por idioma. Numa página em português, aparecem roteiros em inglês.

## Mudança

Aplicar na seção de recomendações a mesma regra de idioma já usada na loja e na home:

- Português: só roteiros com idioma principal português
- Inglês: só roteiros em inglês
- Norueguês: roteiros em norueguês e inglês

Se não houver roteiros suficientes no idioma, a seção mostra só os que existirem (e some se não houver nenhum).

## Detalhe técnico

Em `src/pages/ItineraryShopDetail.tsx`, na query `catalog-related`: incluir `lang` na `queryKey`, selecionar também `primary_language` e aplicar `.eq("primary_language", "pt")` / `.eq(..., "en")` / `.in(..., ["en","no"])` conforme o idioma atual, igual a `ItinerariesShop.tsx`.

Nenhum outro arquivo é alterado.
