---
name: diretrizes-de-escrita
description: Use quando for escrever, revisar ou padronizar posts de blog com foco em SEO, GEO (citação por IA) e engajamento editorial. Cobre estrutura, hook, H2, listas, FAQ, bucket brigades e conclusão.
---

# Diretrizes de Escrita (Posts de Blog)

## Ferramentas obrigatórias

Todo conteúdo vai para o editor via ferramentas — nunca como texto na resposta.

### Regras críticas de uso de ferramentas

**⛔ NUNCA faça uma chamada por elemento.** Isso quebra a formatação e produz espaços em branco desnecessários entre parágrafos e itens de lista.

**✅ SEMPRE escreva seções completas em uma única chamada.** Cada chamada de `insertElement` deve conter o conteúdo completo de uma seção — não apenas um parágrafo ou um item de lista.

| O que inserir | Ferramenta | Como usar |
|---------------|------------|-----------|
| H2 de seção | `insertElement` | `type: "heading"`, `level: "h2"` — uma chamada por heading |
| Seção completa (parágrafos, bucket brigade, dados) | `insertElement` | `type: "text"`, `position: "end"` — todos os parágrafos da seção em UMA chamada |
| Lista completa | `insertElement` | `type: "list"`, `position: "end"` — TODOS os itens em UMA ÚNICA chamada, separados por `\n` |
| Tabela | `insertElement` | `type: "table"`, `position: "end"` |

**Exemplo correto — lista com 5 itens (1 chamada):**
```
insertElement(type="list", ordered=true, content="Item 1 — explicação completa com por quê e como.\nItem 2 — explicação completa com por quê e como.\nItem 3 — explicação completa com por quê e como.")
```

**Exemplo errado — lista fragmentada (NÃO FAÇA ISSO):**
```
insertElement(type="list", content="Item 1")  // chamada 1
insertElement(type="list", content="Item 2")  // chamada 2 ← ERRADO, cria espaço extra
```

**Sequência para cada seção H2:**
1. `insertElement(type="heading", level="h2", content="Título da seção")`
2. `insertElement(type="text", content="Parágrafo 1.\n\nParágrafo 2.\n\nParágrafo 3.")` — todos os parágrafos juntos
3. `insertElement(type="list", content="Item 1\nItem 2\nItem 3")` — se houver lista, todos os itens juntos

**Regra:** nunca use H1 no corpo — o título do artigo já é o H1.

## Visão geral
Guia completo para escrever posts que ranqueiam em buscadores, são citados por IA (GEO) e convertem leitores. Cada regra tem impacto direto em ranqueamento ou citabilidade — não são sugestões.

## ⚠️ Meta obrigatória de extensão

**Todo artigo deve ter entre 2.000 e 3.000 palavras.** Esta não é uma sugestão — é um requisito mínimo de SEO. Artigos abaixo de 2.000 palavras têm ranqueamento reduzido e baixa citabilidade por IA. Use a estrutura completa abaixo para atingir esse volume.

## Princípio central
**Responda primeiro, contextualize depois.** Cada parágrafo deve fazer sentido sozinho — para humanos e para IA. Motores de IA recortam parágrafos, não artigos inteiros.

---

## Estrutura obrigatória de artigo

Todo artigo segue esta sequência — sem exceções:

1. **Introdução** (≤100 palavras) — definição direta + keyword + promessa de valor
2. **H2 #1: Definição expandida** — Definition Block GEO + 1 dado verificável com URL específico
3. **H2 #2–N: Subtemas principais** — um por conceito, ação ou etapa
4. **H2: Passo a passo / Como fazer** (quando aplicável)
5. **H2: Erros comuns / O que evitar** (quando aplicável)
6. **FAQ** — 4–6 perguntas com respostas de 2–3 frases cada (obrigatório)
7. **Conclusão com título específico** — 1 recapitulação + 3 takeaways + 1 CTA

---

## Introdução: a porta de entrada (≤100 palavras)

**Fórmula:**
> [Definição direta em 1 frase com keyword]. [Dado de impacto com fonte]. [O que o leitor vai aprender/ganhar].

✅ BOME:
> Licitações públicas são processos obrigatórios que o governo usa para contratar bens e serviços com transparência e competitividade. O mercado federal movimentou mais de R$ 52 bilhões em contratações em 2023, conforme o Portal da Transparência (portaldatransparencia.gov.br/licitacoes). Aqui você aprende as modalidades, como participar e as estratégias para vencer.

❌ RUIM:
> Neste artigo, vamos explorar o conceito de licitações públicas. Antes de começar, é importante entender o contexto histórico do tema e como ele evoluiu ao longo dos anos.

**Regras:**
- Keyword principal obrigatoriamente nos primeiros 100 palavras
- Proibido: "Neste artigo, vamos…", "Antes de falar…", preâmbulos de qualquer tipo
- Dado de impacto facultativo, mas quando usado precisa de URL de página específica

---

## H2: fórmula de títulos de seção

H2 deve ter **verbo + tópico + qualificador** ou ser uma **pergunta direta de busca**. Nunca apenas um substantivo.

| Tipo | Fórmula | ✅ Exemplo |
|------|---------|-----------|
| Como fazer | "Como [ação] [contexto]" | "Como participar de licitações em 6 passos" |
| Por que | "Por que [tema] é [qualidade] em [ano/contexto]" | "Por que licitações eletrônicas dominam em 2024" |
| Comparação | "[A] vs [B]: como escolher" | "Pregão vs Concorrência: qual modalidade usar" |
| Definição GEO | "O que é [termo] e como funciona" | "O que é o PNCP e como acessar editais" |
| Lista | "As [N] [objeto]: quando usar cada [um/a]" | "As 5 modalidades de licitação: quando usar cada uma" |
| Erros | "[N] erros que [consequência negativa]" | "5 erros que reprovam propostas no pregão" |

❌ NUNCA use H2 só como rótulo:
- "Modalidades de licitação" → sem verbo, sem benefício
- "Estatísticas" → dado isolado, não é seção de artigo
- "Portal PNCP" → apenas substantivo
- "Conclusão" → vago, use título específico

---

## Parágrafos: regras de escaneabilidade e GEO

- **Máximo 3–4 frases.** Parágrafos longos não são citados por IA e afastam leitores.
- **Autocontidos.** Um leitor que pulou os parágrafos anteriores deve entender o atual. Sem "Como vimos…", "Além disso…" como abertura.
- **Primeira frase = tópico principal.** Não abra com conectivos de dependência.
- **Dados distribuídos.** Estatísticas vão no parágrafo da seção relevante — nunca em seção isolada de "Estatísticas".

✅ Parágrafo autocontido (GEO-ready):
> O Pregão Eletrônico é a modalidade obrigatória para aquisição de bens e serviços comuns, segundo a Lei 14.133/2021 (planalto.gov.br/lei-14133-2021). É a modalidade mais usada no governo federal, respondendo pela maioria das licitações. Qualquer empresa cadastrada no SICAF pode participar, incluindo MEIs.

❌ Parágrafo dependente (não citável por IA):
> Além disso, como vimos na seção anterior, ela também se aplica a outros casos relevantes que merecem atenção do leitor interessado no tema.

---

## Listas de passos: fórmula Power List

Cada item de lista numerada segue obrigatoriamente: **O quê → Por quê → Como**.

✅ BONS EXEMPLOS (mínimo 2 frases por item):
> 1. **Cadastre sua empresa no SICAF** — o portal centraliza sua habilitação para todas as licitações federais, sem necessidade de recadastrar a cada processo. Acesse compras.gov.br/sicaf, selecione "Cadastro" e tenha CNPJ ativo, certidão fiscal e balanço patrimonial em mãos.
>
> 2. **Monitore editais diariamente no PNCP** — oportunidades têm prazos curtos, geralmente 8 dias úteis no pregão eletrônico. Use o filtro por CNAE no pncp.gov.br/busca para receber alertas de editais relevantes para o seu segmento.

❌ RUIM (apenas "O quê" — item raso):
> 1. Cadastre sua empresa: No SICAF e PNCP.
> 2. Monitore editais: Acesse o PNCP.

**Regra:** item com menos de 2 frases é raso demais. Expanda com "por quê" e "como exatamente".

---

## Definition Block (GEO obrigatório)

Toda primeira seção com definição usa este bloco — é o formato mais citado por motores de IA:

**Formato:**
> [Termo] é [definição precisa], [contexto de uso]. [Benefício prático ou impacto em 1 frase].

✅ BOME:
> Licitação pública é o processo administrativo pelo qual o governo seleciona o fornecedor mais vantajoso para bens, obras ou serviços, garantindo isonomia e uso eficiente do erário. Toda contratação acima dos limites de dispensa obrigatoriamente passa por licitação.

❌ RUIM (vago, não citável):
> Licitações públicas são processos que o governo usa para contratar coisas de forma transparente e competitiva.

---

## Bucket brigades: transições entre seções

Use **1 bucket brigade por H2** que não abre com dado ou definição direta. Mantêm a leitura fluindo:

- "Mas há um detalhe que a maioria ignora:"
- "E aqui está o ponto mais importante:"
- "O problema real é mais simples do que parece:"
- "Na prática, isso significa:"
- "Antes de seguir, uma ressalva crítica:"
- "Mas atenção — este passo é onde a maioria erra:"

---

## FAQ: seção obrigatória antes da conclusão

**4–6 perguntas.** Respostas de **2–3 frases autocontidas.** É a principal fonte de citação por IA (Answer Engine Optimization).

**Formato:**
```
## Perguntas frequentes sobre [tema]

**[Pergunta direta que alguém buscaria no Google?]**
[Resposta completa em 2–3 frases sem depender do restante do artigo.]

**[Próxima pergunta?]**
[Resposta.]
```

✅ BOAS PERGUNTAS (intenção de busca real):
- "Qualquer empresa pode participar de licitações públicas?"
- "O que é necessário para se cadastrar no SICAF?"
- "Qual a diferença entre pregão e concorrência?"
- "Licitação eletrônica é obrigatória pela nova lei?"

❌ PERGUNTAS FRACAS (vagas, não são buscas reais):
- "Por que licitações são importantes?" — sem intenção de busca clara
- "Como funciona isso?" — sem contexto

---

## SEO: regras aplicadas durante a escrita

1. **Keyword principal nos primeiros 100 palavras** — preferencialmente na primeira ou segunda frase.
2. **Keyword ou variação semântica em pelo menos 2 H2s** — variações naturais, nunca forçadas.
3. **Densidade 1–2%** — nunca repita keyword em frases consecutivas.
4. **Âncoras descritivas para links** — "veja o guia de licitações eletrônicas", nunca "clique aqui".
5. **Sem seção isolada de estatísticas** — distribua dados ao longo das seções relevantes.
6. **H2 a cada 200–300 palavras** — ritmo de escaneabilidade e SEO.

---

## GEO: regras para ser citado por IA

1. **Definition Block na primeira seção** (obrigatório) — formato mais citado.
2. **Parágrafos autocontidos** — IA recorta parágrafos isolados.
3. **Estatísticas com URL de página específica** — domínio-raiz não vale (ver gestao-de-citacoes).
4. **FAQ obrigatório** — 4–6 perguntas com respostas autocontidas.
5. **Fluência + dados = maior boost** (pesquisa Princeton: +37% estatísticas, +30% fluência). Não sacrifique fluidez por dados brutos.
6. **Tom autoritativo** — escreva como especialista que ensina, não como gerador de conteúdo.

---

## Conclusão: fórmula obrigatória

**Título da conclusão deve ser específico** — nunca "Conclusão".

✅ "Pronto para licitar? Próximos passos"
✅ "O que fazer agora: guia rápido para começar"
❌ "Conclusão"

**Estrutura:**
1. **1 frase de síntese** — não repita títulos de seções, sintetize o aprendizado central.
2. **Até 3 bullets de ação** — concretos, não resumos.
3. **1 CTA específico** — o que fazer agora, com verbo no imperativo.

✅ BOA CONCLUSÃO:
> **Pronto para sua primeira licitação?**
> A Lei 14.133/2021 modernizou o processo, mas quem cadastra, monitora e prepara propostas competitivas sai na frente.
> - Cadastre sua empresa no SICAF ainda hoje (compras.gov.br/sicaf).
> - Configure alertas de edital no PNCP filtrados pelo seu CNAE.
> - Estude o Pregão Eletrônico — representa a maioria das oportunidades federais.
> Acesse pncp.gov.br/busca e comece sua busca por editais hoje.

❌ RUIM:
> **Conclusão**
> Em resumo, licitações são importantes e agora você sabe mais sobre elas. Esperamos que este artigo tenha sido útil.

---

## Checklist de qualidade antes de publicar

- [ ] **Total de palavras: 2.000–3.000** (obrigatório — conte antes de finalizar)
- [ ] Keyword principal nos primeiros 100 palavras
- [ ] Resposta/definição nos primeiros 100 palavras
- [ ] H2 com verbo + tópico + qualificador (sem H2s só com substantivos)
- [ ] H2 a cada 200–300 palavras
- [ ] Definition Block na primeira seção de definição
- [ ] Parágrafos máx. 3–4 frases, autocontidos
- [ ] Cada item de lista tem O quê + Por quê + Como (min. 2 frases)
- [ ] FAQ com 4–6 perguntas e respostas autocontidas
- [ ] Sem seção isolada de "Estatísticas"
- [ ] Estatísticas com URL de página específica (não domínio-raiz)
- [ ] Bucket brigade em pelo menos 1 seção longa
- [ ] Conclusão com título específico + 3 bullets de ação + CTA

---

## O que evitar sempre

- "Neste artigo, vamos…" — proibido
- "Conclusão" como H2 — substitua por título específico
- Seção de "Estatísticas" separada — integre os dados nas seções relevantes
- Parágrafos abrindo com "Além disso", "Por outro lado", "Também é importante" — sinal de dependência contextual (ruim para GEO)
- Itens de lista com apenas 1 frase — rasos demais, expanda com por quê e como
- "Como vimos anteriormente" — cada parágrafo é autocontido
- H2 só com substantivo (ex: "Modalidades", "Estatísticas", "Conclusão")

---

## Referências
- **Estruturas:** `references/frameworks-de-conteudo.md`
- **Templates por tipo:** `references/templates-por-tipo.md`
- **Engajamento:** `references/tecnicas-de-engajamento.md`
- **Títulos:** `references/formulas-de-titulo.md`
