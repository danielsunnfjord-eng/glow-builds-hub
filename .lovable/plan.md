# Traduzir roteiros inteiros entre idiomas (mantendo formatação e links)

Sim, é possível. Hoje o editor já guarda o conteúdo em três colunas separadas (inglês, português, norueguês), mas o botão de tradução só traduz 4 campos curtos (título, resumo, descrição, "o que você recebe"). O corpo do roteiro, a intro da capa e os blocos da subpágina não são traduzidos — por isso parece que só dá para traduzir "meia página".

## Fase 1 — Teste de prova de conceito (antes de implementar)

Antes de mexer no editor, vou fazer um teste controlado:

1. Escolher um roteiro de teste (pode ser um rascunho não publicado ou um roteiro que você indique).
2. Chamar a IA diretamente com um pedaço real do HTML do `itinerary_content_*` desse roteiro, usando o prompt de "preservar tags, atributos e links, traduzir apenas texto visível".
3. Comparar origem vs. resultado: contagem de tags, links, parágrafos e listas deve ser idêntica; só o texto visível muda.
4. Mostrar o resultado para você aprovar o tom/qualidade.

Se você quiser, posso usar como exemplo um trecho do roteiro de Barcelona ou do Madrid guide que você está criando. Me confirme qual roteiro posso usar, ou se prefere que eu crie um rascunho de teste separado.

## Fase 2 — O que vou construir (depois do teste aprovado)

Um botão **"Traduzir roteiro completo"** no editor do roteiro que:

1. Pergunta o idioma de origem (o idioma em que você escreveu) e os idiomas de destino.
2. Traduz de uma vez:
   - título, resumo, descrição, "o que você recebe" (já existe)
   - **corpo completo do roteiro** (dia a dia ou guia prático)
   - **intro da capa** (cover intro)
   - blocos da subpágina: destaques, checklist, visão dos dias/seções, "o que esperar"
3. Preserva **exatamente** a formatação e os links: títulos, negrito/itálico, listas, tabelas, quebras de página, imagens e `<a href>` continuam idênticos — só o texto visível é traduzido.
4. Mostra uma prévia lado a lado antes de gravar, para você aprovar ou descartar por idioma.
5. Não sobrescreve um idioma que já tem conteúdo sem confirmação.

Também mantém preservados: nomes próprios, hotéis, preços, horários e URLs.

## Detalhes técnicos

- Nova função de servidor `translate-catalog-content` (ou extensão da atual `translate-catalog-fields`) usando o gateway de IA:
  - o corpo é HTML (`itinerary_content_*`, salvo via `sanitizeDocHtml`), então a tradução é feita **em blocos HTML**, com instrução estrita de manter tags, atributos e `href` intactos, traduzindo apenas nós de texto.
  - conteúdo longo é dividido em pedaços por elementos de topo e reagrupado, evitando estouro de contexto e truncamento.
  - validação pós-tradução: comparar a contagem de tags e de links entre origem e resultado; se divergir, refazer aquele bloco.
- Frontend em `src/components/voyage/CatalogShopManager.tsx` + `TranslateBar.tsx`: seleção de origem/destinos, barra de progresso por campo, painel de prévia, gravação nas colunas `*_en` / `*_pt` / `*_no` (incluindo `itinerary_content_*`, `cover_intro_*` e os campos JSON da subpágina).
- Campos de idioma único (imagem, preço em NOK, duração, hotéis, mapa) não são tocados.
