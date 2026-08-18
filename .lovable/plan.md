# Traduzir também os blocos da subpágina

## Situação atual (verificada)

O tradutor hoje cobre apenas os campos que existem em três versões no banco:

- título, resumo, descrição, "o que você recebe"
- intro da capa
- corpo completo do roteiro

Os blocos da subpágina **não são traduzidos**, e não é só um esquecimento do
tradutor: as colunas `subpage_checklist`, `subpage_day_overview`,
`subpage_expectations` e `subpage_highlights` guardam **um único texto**, sem
versão por idioma. Ou seja, hoje a subpágina mostra esses blocos no idioma em
que foram escritos, independentemente do idioma da página.

Já as vitrines (loja de roteiros e destaques da home) usam título e resumo por
idioma — essas **já** aparecem traduzidas assim que o tradutor grava.

## O que proponho construir

1. Passar os blocos da subpágina a ter versão por idioma, mantendo o conteúdo
   atual como versão do idioma principal do roteiro (nada se perde).
2. Incluir esses blocos no tradutor: ao traduzir PT → EN/NO, também são
   traduzidos destaques, checklist, visão dos dias/seções e "o que esperar",
   com prévia e aprovação como nos demais campos.
3. Subpágina passa a exibir o bloco no idioma da página, com queda para o
   idioma principal quando aquele idioma ainda não foi traduzido.
4. Editor mostra os blocos do idioma que está sendo editado (segue o seletor de
   idioma já existente no formulário).

Itens que continuam sem tradução por natureza: URL do mapa, imagens, preço,
hotéis e duração.

## Detalhes técnicos

- Formato dos JSONs passa a ser mapa por idioma:
  `{"en": [...], "pt": [...], "no": [...]}`. A leitura aceita os dois formatos
  (array antigo = idioma principal), então nenhuma migração destrutiva é
  necessária; a gravação já sai no formato novo.
- `TranslateItineraryPanel.tsx`: novos itens de tradução, um por entrada de
  bloco (strings curtas, enviadas em lote para `translateCatalogChunks`), com
  regravação nos JSONs por idioma.
- `CatalogShopManager.tsx`: leitura/gravação dos blocos indexada pelo idioma em
  edição.
- `ItineraryShopDetail.tsx`: seleção do bloco pelo locale da rota, com fallback.
