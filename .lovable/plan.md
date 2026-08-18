# Traduzir roteiros inteiros entre idiomas (mantendo formatação e links)

## Teste já feito com o roteiro de Barcelona

Peguei o conteúdo real do roteiro `o-melhor-de-barcelona` (escrito em português, ~17.500 caracteres, em Markdown com títulos `##` de dia, subtítulos `### Manhã/Tarde/Noite`, negritos "Sugestão de jantar / Dica local / Transporte / Reservas") e traduzi um trecho real para inglês pela IA.

Resultado da comparação origem × tradução:

```text
                títulos ##   títulos ###   negritos   links   linhas
origem              1             3           12        0       15
tradução            1             3           12        0       15
```

Ou seja: **a formatação sobreviveu 100%** — mesma quantidade de títulos, mesmos níveis, mesmos negritos, mesmas quebras de parágrafo. A qualidade do texto em inglês ficou natural, no seu tom.

Dois ajustes que o teste revelou e que vou embutir no prompt final:
- horários ficaram como "15h"/"21h" — em inglês devem virar "3pm"/"9pm" (e em norueguês "kl. 15").
- alguns nomes locais devem ser traduzidos quando têm nome consagrado ("Bairro Gótico" → "Gothic Quarter"), mas nomes de restaurantes, ruas e endereços continuam intactos.

Observação: esse roteiro hoje não tem links no corpo. A mesma regra vale para links — a instrução manda manter `[texto](url)` com a URL idêntica; quando houver links, valido a contagem antes de gravar.

## O que vou construir

Um botão **"Traduzir roteiro completo"** no editor do roteiro que:

1. Pergunta o idioma de origem e os idiomas de destino.
2. Traduz de uma vez:
   - título, resumo, descrição, "o que você recebe" (já existe hoje)
   - **corpo completo do roteiro** (dia a dia ou guia prático)
   - **intro da capa** (cover intro)
   - blocos da subpágina: destaques, checklist, visão dos dias/seções, "o que esperar"
3. Preserva formatação e links: títulos, negrito/itálico, listas, tabelas, quebras de página e `[texto](url)` idênticos — só o texto visível muda.
4. Localiza horários, moedas e nomes consagrados; mantém restaurantes, hotéis, ruas e endereços no original.
5. Mostra prévia antes de gravar, com aprovação por idioma; não sobrescreve um idioma já preenchido sem confirmação.

## Detalhes técnicos

- Nova função de servidor `translate-catalog-content` (irmã de `translate-catalog-fields`) no gateway de IA, com o prompt validado no teste acima.
- Corpo longo dividido em blocos por título `##` (limite de ~6.000 caracteres por chamada, cortando sempre em fronteira de título) e reagrupado — evita truncamento em roteiros longos.
- Validação automática por bloco: contagem de `##`, `###`, `**` e links deve bater com a origem; se divergir, o bloco é refeito uma vez.
- Frontend em `src/components/voyage/CatalogShopManager.tsx` + `TranslateBar.tsx`: seleção de origem/destinos, progresso por campo, painel de prévia e gravação em `*_en` / `*_pt` / `*_no`, incluindo `itinerary_content_*`, `cover_intro_*` e os campos JSON da subpágina.
- Campos de idioma único (imagem, preço NOK, duração, hotéis, mapa) não são tocados.
