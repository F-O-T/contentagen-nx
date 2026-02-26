# Templates de Schema JSON-LD para blogs

Este documento reúne **templates de JSON-LD** para posts de blog.
O objetivo é aumentar **visibilidade e citação por IA**.

> Importante
> Preencha todos os campos com dados reais.
> Evite datas falsas ou autores inexistentes.

---

## 1) Article Schema (blog posts)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Título do post",
  "description": "Resumo do post em 1–2 frases",
  "image": "https://site.com/imagens/post.jpg",
  "author": {
    "@type": "Person",
    "name": "Nome do autor",
    "url": "https://site.com/autor/nome"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Nome da organização",
    "logo": {
      "@type": "ImageObject",
      "url": "https://site.com/imagens/logo.png"
    }
  },
  "datePublished": "2026-02-11",
  "dateModified": "2026-02-11",
  "mainEntityOfPage": "https://site.com/blog/titulo-do-post"
}
```

---

## 2) FAQPage Schema (aumenta visibilidade)

> Observação: FAQ Schema pode elevar visibilidade em motores de IA.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que é GEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GEO é a otimização de conteúdo para motores de resposta com IA."
      }
    },
    {
      "@type": "Question",
      "name": "GEO substitui SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não. GEO complementa SEO ao focar em citações por IA."
      }
    }
  ]
}
```

---

## 3) HowTo Schema (tutoriais)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Como otimizar um post para IA",
  "description": "Passo a passo para tornar um post citável.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Definir a pergunta principal",
      "text": "Identifique a questão central do post."
    },
    {
      "@type": "HowToStep",
      "name": "Responder em 2–3 frases",
      "text": "Comece com a resposta objetiva."
    },
    {
      "@type": "HowToStep",
      "name": "Adicionar estatística",
      "text": "Inclua dados com fonte confiável."
    }
  ]
}
```

---

## 4) BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Blog",
      "item": "https://site.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "GEO",
      "item": "https://site.com/blog/geo"
    }
  ]
}
```

---

## 5) SpeakableSpecification (voz)

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "GEO para blogs",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [
      ".resposta-direta",
      ".faq-principal"
    ]
  }
}
```

---

## 6) Schema combinado (Article + FAQ + Breadcrumb)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "Guia de GEO",
      "description": "Como otimizar posts para citação por IA.",
      "image": "https://site.com/imagens/geo.jpg",
      "author": {
        "@type": "Person",
        "name": "Nome do autor"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Nome da organização"
      },
      "datePublished": "2026-02-11",
      "mainEntityOfPage": "https://site.com/blog/geo"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "O que é GEO?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "GEO é a otimização de conteúdo para motores de resposta com IA."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Blog",
          "item": "https://site.com/blog"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "GEO",
          "item": "https://site.com/blog/geo"
        }
      ]
    }
  ]
}
```

---

## Links de validação

- https://validator.schema.org/
- https://search.google.com/test/rich-results

---

## Checklist rápido

- [ ] Título e descrição claros
- [ ] Autor real com URL
- [ ] Datas corretas
- [ ] FAQ com perguntas objetivas
- [ ] Breadcrumb atualizado

---

## Observação final

Schema não substitui conteúdo de qualidade.
Ele facilita a compreensão e a citação por IA.
