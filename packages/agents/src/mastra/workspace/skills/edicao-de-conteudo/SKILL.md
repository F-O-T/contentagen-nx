---
name: edicao-de-conteudo
description: Use ao editar ou revisar conteúdo de blog posts com ferramentas de editor, especialmente para melhorar estrutura, clareza, SEO, links e posicionamento de mídia.
---

# Edição de Conteúdo

## Visão geral
Guia completo (pt-BR) para usar as ferramentas de edição de conteúdo com foco em qualidade, legibilidade e SEO. **Siga as regras abaixo e nunca escreva Markdown de imagens manualmente.**

## Regras essenciais (obrigatórias)
- **Sem H1 no corpo.** O título fica no frontmatter. Comece o conteúdo com **## (H2)**.
- **Nunca inclua** contagem de palavras, progresso de escrita, meta‑comentários, notas internas ou comentários entre colchetes.
- **Evite padrões ruins:** introdução longa (>150 palavras antes de gerar valor), keyword stuffing, parágrafos gigantes (máx. 3–4 frases), instruções vagas e frases de enchimento.
- **Imagens:** espere o usuário fornecer a URL. Use **insertImage** com URL e texto alternativo. **Nunca** pesquise imagens, **nunca** use URL placeholder e **nunca** escreva `![alt](url)` manualmente.
- **Markdown:** H2/H3 com `##`/`###`, ênfase com **negrito** e *itálico*, `código` inline e links com `[texto](url)`.
- **Tabelas:** use para comparação de features, dados de referência e cronogramas. **Não** use para lista de uma coluna, instruções sequenciais ou só 2 itens. Máx. 3–5 colunas (mobile), cabeçalhos curtos (1–3 palavras), texto alinhado à esquerda e números à direita.
- **Interleaved thinking após cada tool call:** 1) reflita sobre o resultado 2) pense no próximo passo 3) aja chamando a próxima ferramenta.

## Organização das ferramentas (quando e como usar)

### 1) Manipulação de texto
**Insert Text** — use para acrescentar trechos, introduções curtas ou complementos em pontos exatos.
- ✅ Use quando faltar contexto, exemplos ou transições.
- ❌ Não use para “colocar qualquer coisa” antes de entender a lacuna.

**Replace Text** — use para ajustar termos, corrigir repetições ou substituir frases vagas por conteúdo específico.
- ✅ Troque termos genéricos por termos precisos.
- ❌ Não faça substituições massivas sem revisar fluidez.

**Delete Text** — use para remover redundâncias, trechos fora do tópico e parágrafos longos demais.
- ✅ Remova introduções infladas e “encheção de linguiça”.
- ❌ Não delete informações que suportam o argumento principal.

**Format Text** — use para dar ênfase pontual e legibilidade.
- ✅ Destaque termos-chave e conceitos.
- ❌ Evite excesso de **negrito** ou *itálico*.

### 2) Estrutura e organização
**Insert Heading** — use para criar seções (H2), subseções (H3) e tópicos menores (H4).
- ✅ Seções claras, com títulos objetivos.
- ❌ Nunca use H1 no corpo.

**Insert List** — use para listas de passos, recursos ou agrupamentos.
- ✅ Prefira listas quando o texto vira “parede”.
- ❌ Não transforme tudo em lista; equilíbrio é essencial.

**Insert Code Block** — use para snippets com linguagem definida e, se necessário, uma legenda curta.
- ✅ Use quando o leitor precisa copiar/entender código.
- ❌ Não use para pseudo‑código quando uma explicação bastar.

**Insert Table** — use para comparações e dados estruturados.
- ✅ Resuma diferenças, preços, prazos, métricas.
- ❌ Não use tabela para 2 itens ou lista simples.

### 3) Mídia e apoio visual
**Insert Image** — use somente com URL fornecida pelo usuário.
- ✅ Defina alt text claro e descritivo; adicione legenda se agrega valor.
- ❌ Jamais invente URL ou escreva Markdown de imagem manualmente.
- ❌ **NUNCA** insira blocos de texto descrevendo imagens (ex: "Infográfico X" + "Alt: ...") no corpo do artigo.
- ❌ **NUNCA** use suggestImages — imagens são responsabilidade do usuário.

### 4) SEO e otimização editorial
**Inject Keywords** — use para inserir palavras‑chave faltantes mantendo naturalidade.
- ✅ Coloque keyword em H2, no 1º parágrafo e em substituições contextuais.
- ❌ Nunca force repetição; preserve legibilidade.

**Add Internal Links** — use após buscar conteúdos relacionados e inserir links internos relevantes.
- ✅ Máx. 3 links; posicione após seções principais, antes da conclusão ou no fim.
- ❌ Não linkar excessivamente ou fora de contexto.

**Add External Links** — use para citar fontes confiáveis (estatísticas, estudos, fatos datados).
- ✅ Prefira fontes oficiais, acadêmicas ou reconhecidas no tema.
- ❌ Evite links frágeis, promocionais ou sem autoridade.

**Improve Readability** — use para clareza: frases longas, vocabulário complexo e parágrafos extensos.
- ✅ Divida frases com 20+ palavras e parágrafos com 100+ palavras.
- ✅ Meta: Flesch ~60.

**Optimize Title** — use para reescrever o título com keyword no início e até 60 caracteres.
- ✅ Mantenha natural e fácil de ler.
- ❌ Não sacrifique clareza por SEO.

**Optimize Meta** — use para meta description com keyword e CTA (150–160 caracteres).
- ✅ Extraia pontos principais do conteúdo.

**Generate Quick Answer** — use para criar resposta rápida nos primeiros 100 palavras (resumo rápido, definição, pontos‑chave ou comparação).
- ✅ Ajuda a capturar a intenção do leitor imediatamente.

## Exemplos rápidos (✅/❌)

**Sem H1 no corpo**
- ✅ `## Benefícios do SEO local`
- ❌ `# Benefícios do SEO local`

**Imagem sempre via ferramenta**
- ✅ “Inserir imagem com URL fornecida pelo usuário usando insertImage.”
- ❌ `![gráfico](https://exemplo.com/grafico.png)`

**Tabela bem usada**
- ✅ Comparar 3 planos com 3–5 colunas, cabeçalhos curtos
- ❌ Tabela de uma coluna com 2 itens

**Introdução enxuta**
- ✅ 2–3 frases que entregam valor e contexto
- ❌ 8 parágrafos antes de chegar ao ponto

## Checklist final do editor
- Conteúdo começa em **H2** (sem H1).
- Sem meta‑comentários, notas internas ou placeholders de imagem.
- Parágrafos curtos e leitura fluida.
- Keywords naturais, sem stuffing.
- Links internos/externos com propósito.
- Imagens **somente** com URL fornecida pelo usuário — nunca inventar, nunca sugerir como texto.
- Estatísticas e dados somente de fontes reais obtidas via ferramentas de pesquisa.
