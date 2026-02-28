---
name: gestao-de-frontmatter
description: Use quando a tarefa envolve definir ou revisar metadados de posts (título, descrição, slug, palavras-chave) antes da escrita do conteúdo.
---

# Gestão de Frontmatter

## Visão geral
Frontmatter é a base SEO e editorial do post. **Sem frontmatter, não existe conteúdo.**

## Quando usar cada ferramenta

| Campo | Ferramenta | Quando chamar |
|-------|------------|--------------|
| Título | `editTitle` | Após pesquisa, antes de escrever |
| Descrição (meta) | `editDescription` | Após pesquisa, antes de escrever |
| Slug | `editSlug` | Após definir o título |
| Palavras-chave | `editKeywords` | Após pesquisa de keywords |

**Nunca escreva frontmatter como texto ou YAML na resposta.** Chame sempre as ferramentas acima.

## Regra nº 1 — Frontmatter após pesquisa, antes de escrever
Após a pesquisa (webSearch / serpAnalysis), **defina nesta ordem** antes de qualquer parágrafo: título → descrição → slug → palavras‑chave.

## Fluxo de palavras‑chave (obrigatório)
1. **Definir keywords via `editKeywords`**: até 10, com a 1ª como primária.
2. **Aplicar a primária** no conteúdo:
   - aparece no título (via `editTitle`);
   - aparece nos 100 primeiros termos do corpo;
   - aparece em pelo menos um H2;
   - densidade total entre 1–2%.
3. **Distribuir secundárias** naturalmente (H2/H3 e corpo), sem forçar.

## Regras por campo (com exemplos)

### Título — `editTitle`
✅ Curto, claro, inclui a palavra‑chave primária e gera clique. 50–60 chars, keyword no início.
❌ Vago, longo demais, sem foco ou sem palavra‑chave.

**Exemplos**
✅ "Marketing de Conteúdo B2B: guia prático para gerar leads"
❌ "Tudo o que você precisa saber sobre muitas coisas de marketing e conteúdo"

### Descrição (meta) — `editDescription`
✅ 150–160 caracteres, resume o benefício e inclui a primária naturalmente.
❌ Genérica, longa demais, sem ação ou sem palavra‑chave.

**Exemplos**
✅ "Aprenda marketing de conteúdo B2B com etapas claras, exemplos reais e boas práticas para atrair leads qualificados."
❌ "Um artigo incrível sobre marketing de conteúdo que você vai amar ler agora mesmo!"

### Slug — `editSlug`
✅ Minúsculo, curto, com hifens, sem stop words e com a primária.
❌ Longo, com termos inúteis, caracteres especiais ou maiúsculas.

**Exemplos**
✅ "marketing-conteudo-b2b"
❌ "O-Marketing de Conteúdo B2B!!"

### Palavras‑chave — `editKeywords`
✅ Até 10 termos, mistura amplo + específico, inclui long‑tail.
❌ Lista excessiva, irrelevante ou sem hierarquia.

**Exemplos**
✅ marketing de conteúdo b2b; geração de leads b2b; estratégia de conteúdo; funil b2b
❌ marketing; conteúdo; internet; negócios; blog; seo; vendas; empresa; digital; tráfego; anúncio

## Checklist mínimo antes de escrever o corpo
- [ ] `editTitle` chamado — título convincente com keyword no início
- [ ] `editDescription` chamado — 150–160 chars, keyword + benefício
- [ ] `editSlug` chamado — slug curto e limpo
- [ ] `editKeywords` chamado — primária + secundárias relevantes

## Validação após escrever
- Verificar densidade da palavra‑chave primária (1–2%) via `analyzeContent`
- Verificar presença da primária no 1º parágrafo
- Garantir pontuação de SEO ≥ 70

## Erros comuns (evitar)
- Escrever frontmatter como YAML na resposta em vez de chamar as ferramentas
- Usar título sem palavra‑chave primária
- Inserir palavras‑chave de forma artificial
- Slug longo com stop words
- Descrição curta demais ou sem benefício claro
