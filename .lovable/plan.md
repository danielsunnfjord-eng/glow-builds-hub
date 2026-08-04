# Barcelona em inglês na página em português + rótulo "A jornada"

## Causa encontrada

Consultei os dados do catálogo. No roteiro `o-melhor-de-barcelona` os resumos estão **trocados de coluna**:

- coluna do inglês (`summary_en`) → contém o texto em **português**
- coluna do português (`summary_pt`) → contém o texto em **inglês**

Todos os outros roteiros estão corretos (ex.: Roma e Paris têm inglês no campo inglês e português no campo português). Ou seja, não é um erro da página: a subpágina lê o campo certo, mas o conteúdo desse roteiro foi gravado invertido.

Por que aconteceu: no editor, o campo principal de resumo sempre grava na coluna em inglês, mesmo quando o idioma principal do roteiro é português. Quando a tradução automática rodou depois, ela preencheu a coluna em português com a versão em inglês.

## O que vou fazer

1. **Corrigir os dados do roteiro de Barcelona**: trocar o conteúdo entre as colunas de resumo (inglês ↔ português), para que cada idioma mostre o texto correto. Vou verificar também título, descrição e "o que você recebe" desse roteiro e corrigir se estiverem invertidos da mesma forma.
2. **Evitar repetição**: no editor, gravar o texto do campo principal na coluna do idioma principal escolhido (em vez de sempre no campo em inglês), mantendo os outros idiomas como estão.
3. **Trocar o rótulo** da seção da subpágina: "A JORNADA" passa a ser "O ROTEIRO" na versão em português. Inglês e norueguês ficam como estão.

## Detalhes técnicos

- Migração/atualização de dados na tabela `catalog_itineraries` apenas para a linha `o-melhor-de-barcelona` (swap entre `*_en` e `*_pt` nos campos invertidos).
- `src/components/voyage/CatalogShopManager.tsx`: no save, mapear o campo principal para `summary_<primary_language>` (e demais campos correspondentes) em vez de forçar `_en`.
- `src/i18n/locales/pt.ts`: `shop.intro` = "O roteiro".
