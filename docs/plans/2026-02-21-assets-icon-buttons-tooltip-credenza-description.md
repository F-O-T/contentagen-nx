# Design: Assets — Icon Buttons com Tooltip e Credenzas com Description

**Data:** 2026-02-21
**Arquivo afetado:** `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx`

---

## Contexto

A tela de assets (`/assets`) viola dois padrões estabelecidos na plataforma:

1. **Icon buttons sem tooltip** — botões de ação no `AssetCard` (visualizar, renomear, excluir) não têm tooltip, diferente do padrão usado nas outras páginas.
2. **Credenzas sem `CredenzaDescription`** — todas as credenzas abertas na tela carecem de `CredenzaDescription` no header, inclusive uma delas não tem header algum.

---

## Mudanças planejadas

### 1. Tooltips nos icon buttons (`AssetCard`)

**Localização:** componente `AssetCard` (~linha 142), seção de ações do card (~linha 169).

Envolver cada `Button size="icon"` com o padrão `Tooltip > TooltipTrigger asChild`:

| Botão | Ícone | Tooltip text |
|-------|-------|-------------|
| Visualizar | `Eye` | "Visualizar" |
| Renomear | `Pencil` | "Renomear" |
| Excluir | `Trash2` | "Excluir" |

A `div` que contém os botões será envolvida com `TooltipProvider` (necessário pois não há provider global na app).

**Novos imports:**
```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@packages/ui/components/tooltip";
```

### 2. `CredenzaDescription` nas credenzas

**`AssetUploadCredenza`** (~linha 337):
- Adicionar `<CredenzaDescription>` após `<CredenzaTitle>`:
  - Texto: `"Envie imagens, vídeos e PDFs de até 50MB."`

**`AssetRenameContent`** (~linha 378):
- Adicionar `<CredenzaDescription>` após `<CredenzaTitle>`:
  - Texto: `"Altere o nome do arquivo selecionado."`

**`GenerateImageCredenzaContent`** (~linha 586):
- Adicionar `<CredenzaDescription>` após `<CredenzaTitle>`:
  - Texto: `"Descreva a imagem que deseja criar com IA."`

**`AssetViewContent`** (~linha 363) — aberta via hook `openCredenza`:
- Adicionar `<CredenzaHeader>` com `<CredenzaTitle>` e `<CredenzaDescription>`:
  - Título: `"Visualizar arquivo"`
  - Description: `{asset.filename}`

**Import adicional:**
```typescript
import { CredenzaDescription } from "@packages/ui/components/credenza";
```

---

## Escopo

- **1 arquivo alterado:** `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx`
- Sem mudanças de API, banco de dados, routers ou outros arquivos
- Sem novas dependências — `tooltip` e `credenza` já estão em `@packages/ui`

---

## Resultado esperado

- Todos os icon buttons na tela de assets têm tooltip descritivo
- Todas as credenzas têm `CredenzaDescription` no header (padrão de acessibilidade e consistência visual da plataforma)
