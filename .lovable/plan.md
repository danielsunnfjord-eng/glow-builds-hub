# Um documento, três idiomas: tradução automática dos roteiros do Catálogo

## Como funciona hoje (verificado no código)

- Você sobe um PDF pronto; ele é guardado em `body_pdf_url` e apenas **mesclado**
  entre a capa e as páginas finais. O sistema nunca lê o conteúdo dele.
- Existe **um único** `pdf_path` por roteiro — ou seja, um só arquivo de entrega,
  em uma só língua.
- A loja filtra por `primary_language`: um roteiro em PT simplesmente **não
  aparece** para quem navega em inglês (e para norueguês só aparecem EN e NO).
- O tradutor que já existe cobre título, resumo, descrição, "o que você recebe",
  intro da capa e o corpo em texto — mas não o PDF que você sobe, nem os blocos
  da subpágina.

## O que vou construir

Fluxo novo, do upload à entrega:

```text
PDF que você sobe  →  extração (texto + imagens + links)  →  conteúdo no idioma
de origem  →  tradução para os outros 2 idiomas  →  3 PDFs gerados com o layout
Fjord & Waves  →  1 produto na loja, disponível nas 3 línguas
```

1. **Extração do PDF**: ao anexar o documento, o sistema lê o arquivo, separa
   títulos, parágrafos, listas e **links clicáveis**, extrai as imagens
   embutidas e monta o conteúdo estruturado no idioma de origem. Você revê e
   corrige no editor antes de seguir.
2. **Tradução ao publicar**: ao publicar, o sistema traduz para os outros dois
   idiomas com o tradutor já validado (mantém títulos, negritos, listas e
   `[texto](url)` com a URL idêntica), incluindo os blocos da subpágina
   (destaques, checklist, visão dos dias/seções, "o que esperar").
   Você aprova numa prévia lado a lado; nada é publicado sem seu OK.
3. **Um PDF por idioma**: gerado com o template do site (capa, imagens, mesma
   ordem e mesmos links). Guardados separadamente e prontos para download
   imediato na compra.
4. **Loja e subpágina em todas as línguas**: o roteiro passa a aparecer nas três
   versões do site. Quando um idioma ainda não foi traduzido, o card mostra o
   idioma original em vez de esconder o roteiro.
5. **Entrega**: o cliente que comprou em inglês recebe o PDF em inglês; e-mail e
   link de download seguem o idioma da compra.
6. **Indicador de estado** no editor: "traduzido / pendente / desatualizado" por
   idioma, com botão para retraduzir quando você mexe no original.

### O que muda na prática para você

Você continua escrevendo e diagramando fora do sistema, sobe **um** arquivo, e o
resto (idiomas, PDFs, subpáginas, entrega) é automático.

### Limite honesto sobre o layout

Você escolheu o template do site para as versões traduzidas. Isso significa: o
mesmo conteúdo, as mesmas imagens, os mesmos links e a mesma ordem — mas
diagramados pelo template Fjord & Waves, não pixel a pixel igual ao seu Canva.
É o único caminho confiável: texto traduzido muda de comprimento e quebraria um
layout fixo. Se quiser, o PDF original continua servido como está para o idioma
de origem.

## Detalhes técnicos

- **Banco**: novas colunas em `catalog_itineraries` — `pdf_path_en/pt/no`,
  `translation_status` (jsonb: estado e hash do original por idioma), e os
  blocos `subpage_*` passam a mapa por idioma (`{"en":[...],"pt":[...]}`),
  com leitura compatível com o formato atual (array = idioma principal).
- **Extração**: feita no navegador do admin com o pdf.js já usado em
  `PdfJsViewer`, produzindo Markdown + imagens enviadas para o storage; uma
  passada de IA apenas para arrumar títulos/listas, sem reescrever o texto.
- **Tradução**: reaproveita `translateCatalogChunks`
  (`src/lib/translateCatalog.functions.ts`) e o painel
  `TranslateItineraryPanel.tsx`, ampliados para os blocos da subpágina e para
  disparo no momento de publicar.
- **PDFs por idioma**: `generate-catalog-pdf` passa a receber o idioma e gravar
  em `pdf_path_<lang>`; `download-catalog-pdf`, `create-catalog-checkout` e
  `verify-catalog-purchase` escolhem o arquivo pelo idioma da compra, com
  fallback para o idioma de origem.
- **Vitrines**: `ItinerariesShop.tsx` e `FeaturedItineraries.tsx` deixam de
  filtrar por `primary_language` e passam a escolher o campo do idioma com
  fallback; `ItineraryShopDetail.tsx` idem, incluindo os blocos da subpágina.

## Ordem de entrega

1. Colunas e leitura por idioma com fallback (loja deixa de esconder roteiros).
2. Extração do PDF para conteúdo estruturado, com revisão no editor.
3. Tradução ampliada (corpo + blocos da subpágina) com prévia e aprovação.
4. Geração e entrega do PDF por idioma.
