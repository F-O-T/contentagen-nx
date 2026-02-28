# Auditoria SEO + GEO: Post sobre Licitei.com.br

**Data:** 2026-02-27
**Tipo de conteúdo:** Post informacional/review sobre plataforma SaaS
**Idioma:** Português (Brasil)
**Público-alvo:** Empresas e MEIs interessados em contratos governamentais

---

## Resumo Executivo

O post tem boa estrutura base (FAQ, passo a passo, seções com H2), mas sofre de problemas sérios de E-E-A-T, ausência de dados com fontes, marcadores evidentes de texto gerado por IA, e formatação subótima para extração por mecanismos de resposta (AEO/GEO). O potencial de ranking existe, mas a probabilidade de ser citado por ChatGPT, Perplexity ou Google AI Overviews é baixa no estado atual.

### Top 5 Prioridades

1. Adicionar H1 title tag otimizado + meta description
2. Remover ou fundamentar estatísticas sem fonte
3. Substituir prova social genérica por dados reais
4. Implementar FAQ schema markup
5. Corrigir padrões de escrita AI-detectáveis

### Score Estimado

| Estado | Score |
|--------|-------|
| Atual | 4.5 / 10 |
| Após correções | 7.5–8 / 10 |

---

## 1. Problemas Técnicos e Estruturais

### 1.1 Ausência de H1 explícito

- **Impacto:** Alto
- **Problema:** O post começa com um parágrafo de introdução denso, sem H1 visível. A frase de abertura é uma descrição, não um title tag otimizado.
- **Fix:** Adicionar um H1 claro antes do conteúdo:

```
# Licitei.com.br: Guia Completo da Plataforma de Licitações Públicas
```

Ou para intent de comparação:

```
# Licitei.com.br: O Que É, Como Funciona e Vale a Pena em 2025?
```

---

### 1.2 Meta description ausente

- **Impacto:** Alto
- **Problema:** Não foi fornecida. CTR no SERP depende diretamente disso.
- **Fix sugerido:**

> "Licitei.com.br é a plataforma que centraliza editais de licitações públicas do Brasil. Veja funcionalidades, como se cadastrar e dicas para vencer pregões eletrônicos."

---

### 1.3 FAQ com perguntas não naturais para busca por voz

- **Impacto:** Médio
- **Problema:** Perguntas como "A Licitei.com.br é gratuita?" são aceitáveis, mas faltam perguntas de alto volume de busca que os usuários realmente digitam ou falam.
- **Perguntas faltando no FAQ:**
  - "como participar de licitações públicas pela primeira vez"
  - "preciso de CNPJ para licitar"
  - "qual a diferença entre pregão eletrônico e concorrência"
  - "como me cadastrar no SICAF"

---

### 1.4 Listas de funcionalidades sem H3

- **Impacto:** Médio
- **Problema:** As 5 funcionalidades principais usam texto em negrito inline, não H3. Isso reduz a probabilidade de aparecer como list snippet no Google.
- **Fix:** Estruturar cada item como H3:

```markdown
### Busca Avançada e Filtros
Pesquise por modalidade, valor, localização ou palavras-chave específicas...

### Alertas Personalizados
Configure notificações por e-mail ou push para editais que combinem com seu perfil...
```

---

## 2. Problemas de Conteúdo e E-E-A-T

### 2.1 Estatística sem fonte: os 70% de acessos mobile

- **Impacto:** Alto (risco de E-E-A-T)
- **Problema:** "Ideal para mobile, onde 70% dos acessos ocorrem" — sem fonte. Para GEO, estatísticas sem atribuição são ignoradas por AIs.
- **Fix:** Citar a fonte real, ou reformular:

> "Segundo dados internos da plataforma divulgados em [ano], 70% das sessões ocorrem via dispositivos móveis."

Ou remover se não for verificável.

---

### 2.2 Prova social genérica sem nomes ou números

- **Impacto:** Alto
- **Problema:** Frases como "Licitantes relatam mais eficiência no dia a dia" e "Usuários acessam detalhes completos" são afirmações vazias. Nenhuma IA vai citá-las, e o Google não as considera sinais de autoridade.
- **Fix:** Substituir por depoimentos reais com nome, empresa e resultado mensurável:

> *"Antes, gastávamos 3 horas por dia procurando editais em 12 sites diferentes. Com a Licitei, caiu para 20 minutos."*
> — **José Lima, sócio da Construtora Lima & Filhos (SP)**

---

### 2.3 Ausência total de autor / byline

- **Impacto:** Alto (E-E-A-T)
- **Problema:** Não há assinatura de autor, credenciais, ou indicação de quem escreveu. Páginas sobre licitações e contratos governamentais precisam de sinais de expertise.
- **Fix:** Adicionar bio de autor com credenciais relevantes (ex.: "especialista em contratos públicos", "auditora certificada") e link para perfil.

---

### 2.4 Sem data de atualização

- **Impacto:** Médio
- **Problema:** Post sem data. O tema cita a Lei 14.133/2021, que muda. AIs preferem citar fontes datadas e atualizadas.
- **Fix:** Adicionar no início:

```
Publicado em: [data] | Atualizado em: [data]
```

---

### 2.5 Sem seção de contras / limitações

- **Impacto:** Médio (E-E-A-T)
- **Problema:** O post é 100% positivo sobre a plataforma, o que reduz credibilidade. Um conteúdo imparcial converte melhor e ranqueia melhor para queries de avaliação.
- **Fix:** Adicionar seção "Prós e Contras da Licitei.com.br":

```markdown
### Prós
- Alertas personalizados poupam horas de busca manual
- Cobre portais federais, estaduais e municipais
- Interface mobile-friendly

### Contras
- Plano gratuito tem alertas limitados
- Não substitui a análise cuidadosa do edital completo
- Cobertura de municípios pequenos pode ser inconsistente
```

---

## 3. Problemas de GEO (Generative Engine Optimization)

### 3.1 Ausência de bloco de definição canônico

- **Impacto:** Alto
- **Problema:** A seção "O que é a Licitei.com.br" tem boa intenção, mas o parágrafo de abertura é longo e não estruturado como definição autocontida. AIs precisam de 1-2 frases que possam ser extraídas diretamente.
- **Fix — reformatar como Definition Block:**

> **Licitei.com.br é uma plataforma brasileira de monitoramento de licitações públicas** que agrega editais de órgãos federais, estaduais e municipais em um único painel. Ela escaneia portais como PNCP, Compras.gov.br e sites de prefeituras diariamente, entregando alertas personalizados por e-mail ou app com base em CNAE, palavras-chave e localização da empresa.

---

### 3.2 Dados sem atribuição reduzem citações por IA

- **Impacto:** Alto
- **Problema:** Todo o post usa dados e afirmações sem citar fontes (exceto a referência à Lei 14.133). AIs como Perplexity e ChatGPT priorizam fontes com dados verificáveis e atribuídos.
- **Fix — aplicar Evidence Sandwich em afirmações chave:**

> "Pregões eletrônicos representam a modalidade dominante em contratos públicos no Brasil. Segundo o Portal Nacional de Contratações Públicas (PNCP), [X]% das licitações publicadas em [ano] foram pregões eletrônicos. Isso torna o monitoramento dessa modalidade prioridade para empresas que buscam contratos governamentais."

---

### 3.3 Sem tabela comparativa com concorrentes

- **Impacto:** Alto (GEO + rankings para queries comparativas)
- **Problema:** Não existe nenhuma comparação com BLL Licitações, LicitaX, ou o próprio PNCP direto. Queries como "melhor plataforma de licitações" ou "Licitei vs BLL" têm intent comercial alto e são frequentemente respondidas por AIs via tabelas.
- **Fix — adicionar Comparison Block:**

| Recurso | Licitei.com.br | PNCP (direto) | BLL Licitações |
|---------|---------------|---------------|---------------|
| Alertas por e-mail | Sim | Não | Sim |
| Cobre municípios | Sim | Parcial | Sim |
| Histórico de vencedores | Sim | Não | Limitado |
| Plano gratuito | Sim | Gratuito | Freemium |
| Interface mobile | Sim | Não otimizado | Sim |
| Sugestão por IA | Sim | Não | Não |

**Conclusão:** Licitei.com.br é ideal para quem quer centralizar busca e receber alertas automáticos. O PNCP direto é gratuito, mas exige monitoramento manual diário.

---

### 3.4 Sem citações de especialistas

- **Impacto:** Médio
- **Problema:** Post inteiramente baseado em afirmações próprias. Expert Quote Blocks aumentam credibilidade e probabilidade de citação por IA.
- **Fix — incluir pelo menos uma citação:**

> *"A principal barreira para pequenas empresas em licitações não é a capacitação, é o tempo gasto descobrindo oportunidades. Ferramentas de monitoramento resolvem exatamente isso,"* diz **[Nome]**, advogado especializado em direito administrativo.

---

## 4. Padrões de Escrita AI-Detectável

O post contém múltiplos marcadores clássicos de texto gerado por IA que reduzem credibilidade com leitores e com sistemas de avaliação de conteúdo.

| Trecho problemático | Problema | Sugestão |
|---------------------|----------|----------|
| "Com prática, você vai dominar o fluxo em uma semana." | Afirmação sem fundamento, padrão AI vago | Remover ou substituir por dado real |
| "Licitantes relatam mais eficiência no dia a dia" | Prova social genérica sem nome ou número | Depoimento real ou remover |
| "isso economiza horas de busca manual" | Vago — quantas horas? | "economiza até 3h/dia de busca manual" (se verificável) |
| "Pronto para captar contratos públicos?" | CTA formulaico AI-style | Substituir por CTA específico com proposta de valor |
| "transforme licitações em receita recorrente" | Clichê de CTA AI | Ser mais específico sobre o resultado esperado |
| "nivela o jogo para pequenas empresas" | Clichê genérico | "permite que MEIs compitam nos mesmos editais que grandes empresas" |
| "Essas ferramentas tornam a plataforma indispensável" | "indispensável" = intensificador vazio | Remover ou substituir por dado concreto |
| "Acesse a plataforma agora e transforme..." | Fórmula de conclusão AI | CTA direto e específico |
| "Por fim, dados históricos ajudam..." | Transição formulaica | "Dados históricos também ajudam..." |

---

## 5. Oportunidades de Keywords Faltantes

O post foca quase exclusivamente na marca "Licitei.com.br", perdendo volume de busca informacional relevante.

| Keyword | Intent | Prioridade |
|---------|--------|-----------|
| como participar de licitações públicas | Informacional | Alta |
| pregão eletrônico como funciona | Informacional | Alta |
| plataforma de licitações públicas | Comercial | Alta |
| como se cadastrar no SICAF | Informacional | Média |
| licitações para MEI | Informacional | Média |
| melhor plataforma de licitações | Comercial | Média |
| edital de licitação o que é | Informacional | Média |
| licitei vs bll licitações | Comparacional | Média |

**Recomendação:** O post deveria ranquear para pelo menos 3-4 dessas keywords além da marca. Isso exige incluir as keywords naturalmente em H2s, introdução e FAQ.

---

## 6. Plano de Ação Priorizado

### Crítico — fazer antes de publicar ou republicar

- [ ] Adicionar H1 otimizado e meta description
- [ ] Remover ou fundamentar a estatística de 70% mobile com fonte
- [ ] Adicionar data de publicação e autor com credenciais
- [ ] Reescrever os padrões AI-detectáveis listados na seção 4
- [ ] Reformatar funcionalidades como H3 (não negrito inline)

### Alto impacto

- [ ] Adicionar depoimento real com nome, empresa e número concreto
- [ ] Incluir tabela comparativa com concorrentes (Licitei vs PNCP vs BLL)
- [ ] Adicionar seção de Prós e Contras
- [ ] Implementar FAQ schema markup no CMS
- [ ] Reescrever bloco de definição como Self-Contained Answer Block

### Médio prazo

- [ ] Criar conteúdo de suporte linkado internamente:
  - "Como se cadastrar no SICAF passo a passo"
  - "Lei 14.133/2021 explicada para empresas"
  - "Pregão eletrônico: guia completo"
- [ ] Adicionar case study com resultados mensuráveis
- [ ] Expandir FAQ com perguntas de busca por voz natural
- [ ] Citar dados de fontes externas (PNCP, TCU, IBGE) com links para Evidence Sandwich
- [ ] Incluir citação de especialista (advogado de direito administrativo ou consultor de licitações)

---

## Referências de Padrões Utilizados

- **Definition Block** — para queries "O que é [X]?" (AEO)
- **Evidence Sandwich** — claim → dados com fonte → implicação (GEO)
- **Comparison Table Block** — para queries "[X] vs [Y]" (AEO + GEO)
- **Expert Quote Block** — atribuição nomeada aumenta credibilidade para citação por IA
- **FAQ Block** — perguntas phrased como usuários realmente buscam + FAQ schema
- **Step-by-Step Block** — H3 + numeração clara para list snippets (AEO)

---

## Metodologia: Skills e Raciocínio por Trás da Análise

### Skills utilizadas

#### 1. `using-superpowers`
Invocada antes de qualquer ação, conforme instrução do sistema. Seu papel é mapear quais skills especializadas existem e garantir que a resposta use o melhor conjunto de ferramentas disponível — evitando respostas genéricas quando existe conhecimento estruturado aplicável.

#### 2. `seo-audit`
Skill principal desta análise. Ela carrega um framework completo de auditoria SEO organizado por prioridade:

1. Crawlabilidade e indexação
2. Fundações técnicas
3. Otimização on-page
4. Qualidade de conteúdo
5. Autoridade e links

Além do framework, a skill referencia dois arquivos internos que foram lidos diretamente:

- **`references/aeo-geo-patterns.md`** — padrões de formatação otimizados para Answer Engine Optimization (AEO) e Generative Engine Optimization (GEO). Inclui: Definition Block, Step-by-Step Block, Comparison Table Block, FAQ Block, Evidence Sandwich, Expert Quote Block, Self-Contained Answer Block.
- **`references/ai-writing-detection.md`** — lista de marcadores linguísticos associados a texto gerado por IA: em dashes, verbos sobreusados, adjetivos vazios, frases de abertura/transição/conclusão formulaicas e intensificadores inúteis.

---

### Raciocínio por trás da análise

#### Por que SEO + GEO juntos?

O usuário pediu explicitamente análise de "blog, seo e geo". SEO tradicional e GEO (otimização para mecanismos generativos) têm sobreposição, mas objetivos distintos:

- **SEO** busca ranking orgânico no Google — depende de estrutura técnica, keywords, E-E-A-T, velocidade.
- **GEO** busca citação por AIs (ChatGPT, Perplexity, Google AI Overviews) — depende de dados verificáveis com fonte, definições autocontidas, blocos estruturados extraíveis, e autoridade atribuída.

Um post pode ranquear bem no Google sem ser citado por AIs, e vice-versa. A análise dual aumenta o alcance do conteúdo em ambas as superfícies.

#### Como o post foi classificado

O conteúdo foi identificado como **post informacional/review** sobre uma plataforma SaaS de licitações. Isso determinou quais frameworks aplicar:

- Posts de review precisam de **E-E-A-T forte** (quem escreveu? qual a experiência real com o produto?)
- Posts informativos sobre SaaS precisam de **comparação com alternativas** para capturar intent comercial
- Posts sobre temas regulatórios (licitações, Lei 14.133) precisam de **dados com fontes governamentais** para credibilidade com AIs

#### Detecção de padrões AI

Os marcadores de escrita gerada por IA foram identificados aplicando o checklist do `ai-writing-detection.md` contra o texto original:

- Frases de CTA formulaicas ("Pronto para captar contratos públicos?", "transforme licitações em receita recorrente")
- Prova social vaga sem atribuição ("Licitantes relatam mais eficiência")
- Afirmações não fundamentadas ("você vai dominar o fluxo em uma semana")
- Intensificadores vazios ("indispensável", "econômica horas")
- Transições formulaicas ("Por fim", "Isso economiza")

A presença desses padrões não invalida o conteúdo, mas reduz a percepção de credibilidade e pode acionar filtros de conteúdo gerado por IA em sistemas de avaliação.

#### Priorização das recomendações

As correções foram ordenadas por **impacto imediato no ranking e citação**:

1. **Crítico** — problemas que bloqueiam ranking ou indexação (H1 ausente, estatística sem fonte, ausência de autor)
2. **Alto impacto** — melhorias que aumentam CTR, E-E-A-T e probabilidade de ser citado por IA (depoimentos reais, tabela comparativa, FAQ schema)
3. **Médio prazo** — construção de autoridade tópica via cluster de conteúdo (posts satélite sobre SICAF, Lei 14.133, pregão eletrônico)
