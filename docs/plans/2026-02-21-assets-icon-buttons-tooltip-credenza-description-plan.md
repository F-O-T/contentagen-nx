# Assets — Icon Button Tooltips e Credenza Descriptions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corrigir dois desvios de padrão na tela de assets: icon buttons sem tooltip e credenzas sem `CredenzaDescription`.

**Architecture:** Mudanças puramente de UI em um único arquivo. Não há lógica nova — apenas aplicar os wrappers `Tooltip`/`TooltipTrigger` já usados em outras telas, e adicionar `CredenzaDescription` nas credenzas existentes.

**Tech Stack:** React, `@packages/ui/components/tooltip`, `@packages/ui/components/credenza`, Lucide icons.

---

## Arquivo alvo

```
apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx
```

Não há testes unitários a escrever — são mudanças de markup JSX sem lógica. A verificação é visual (typecheck + inspeção visual no browser).

---

### Task 1: Adicionar imports de Tooltip e CredenzaDescription

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx`

**Step 1: Abrir o arquivo e localizar o bloco de imports existente**

Linhas 1–46 do arquivo atual. O import de `credenza` está na linha 4–11 e não inclui `CredenzaDescription`. Não há nenhum import de `tooltip`.

**Step 2: Adicionar `CredenzaDescription` ao import de credenza**

Encontrar:
```typescript
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
```

Substituir por:
```typescript
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
```

**Step 3: Adicionar import de Tooltip após o import de credenza**

Após o bloco de import de credenza, adicionar:
```typescript
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
```

**Step 4: Verificar typecheck**

```bash
bun run typecheck
```

Esperado: sem erros (os imports existem nos packages).

---

### Task 2: Adicionar tooltips aos icon buttons do `AssetCard`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx` (função `AssetCard`, ~linha 169)

**Context:** O `AssetCard` renderiza uma `div` com os botões de ação na linha ~169:

```tsx
<div className="flex items-center justify-center gap-1 border-t bg-background/80 px-1 py-1.5">
   {isImage && (
     <Button className="size-8 shrink-0" onClick={() => onView(asset)} size="icon" variant="ghost">
        <Eye className="size-4" />
     </Button>
   )}
   <Button className="size-8 shrink-0" onClick={() => onRename(asset)} size="icon" variant="ghost">
      <Pencil className="size-4" />
   </Button>
   <Button className="size-8 shrink-0 text-destructive hover:text-destructive" disabled={isDeleting} onClick={() => onDelete(asset.id)} size="icon" variant="ghost">
      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
   </Button>
</div>
```

**Step 1: Substituir a `div` de ações pelo bloco com `TooltipProvider` e tooltips individuais**

Localizar a `div` de ações (começa em `<div className="flex items-center justify-center gap-1 border-t bg-background/80 px-1 py-1.5">`) e substituir por:

```tsx
<TooltipProvider>
   <div className="flex items-center justify-center gap-1 border-t bg-background/80 px-1 py-1.5">
      {isImage && (
        <Tooltip>
           <TooltipTrigger asChild>
              <Button
                 className="size-8 shrink-0"
                 onClick={() => onView(asset)}
                 size="icon"
                 variant="ghost"
              >
                 <Eye className="size-4" />
              </Button>
           </TooltipTrigger>
           <TooltipContent>Visualizar</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
         <TooltipTrigger asChild>
            <Button
               className="size-8 shrink-0"
               onClick={() => onRename(asset)}
               size="icon"
               variant="ghost"
            >
               <Pencil className="size-4" />
            </Button>
         </TooltipTrigger>
         <TooltipContent>Renomear</TooltipContent>
      </Tooltip>
      <Tooltip>
         <TooltipTrigger asChild>
            <Button
               className="size-8 shrink-0 text-destructive hover:text-destructive"
               disabled={isDeleting}
               onClick={() => onDelete(asset.id)}
               size="icon"
               variant="ghost"
            >
               {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
               ) : (
                  <Trash2 className="size-4" />
               )}
            </Button>
         </TooltipTrigger>
         <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
   </div>
</TooltipProvider>
```

**Step 2: Verificar typecheck**

```bash
bun run typecheck
```

Esperado: sem erros.

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx
git commit -m "feat(assets): add tooltips to AssetCard icon buttons"
```

---

### Task 3: Adicionar `CredenzaDescription` às 3 credenzas com título mas sem description

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx`

São 3 componentes a corrigir neste task:

#### 3a — `AssetUploadCredenza` (~linha 349)

Localizar:
```tsx
<CredenzaHeader>
   <CredenzaTitle>Upload de imagem</CredenzaTitle>
</CredenzaHeader>
```

Substituir por:
```tsx
<CredenzaHeader>
   <CredenzaTitle>Upload de imagem</CredenzaTitle>
   <CredenzaDescription>
      Envie imagens, vídeos e PDFs de até 50MB.
   </CredenzaDescription>
</CredenzaHeader>
```

#### 3b — `AssetRenameContent` (~linha 411)

Localizar:
```tsx
<CredenzaHeader>
   <CredenzaTitle>Renomear arquivo</CredenzaTitle>
</CredenzaHeader>
```

Substituir por:
```tsx
<CredenzaHeader>
   <CredenzaTitle>Renomear arquivo</CredenzaTitle>
   <CredenzaDescription>
      Altere o nome do arquivo selecionado.
   </CredenzaDescription>
</CredenzaHeader>
```

#### 3c — `GenerateImageCredenzaContent` (~linha 621)

Localizar:
```tsx
<CredenzaHeader>
   <CredenzaTitle className="flex items-center gap-2">
      <Sparkles className="size-4 text-purple-500" />
      Gerar Imagem com IA
   </CredenzaTitle>
</CredenzaHeader>
```

Substituir por:
```tsx
<CredenzaHeader>
   <CredenzaTitle className="flex items-center gap-2">
      <Sparkles className="size-4 text-purple-500" />
      Gerar Imagem com IA
   </CredenzaTitle>
   <CredenzaDescription>
      Descreva a imagem que deseja criar com IA.
   </CredenzaDescription>
</CredenzaHeader>
```

**Step 1: Aplicar as 3 substituições acima**

**Step 2: Verificar typecheck**

```bash
bun run typecheck
```

Esperado: sem erros.

**Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx
git commit -m "feat(assets): add CredenzaDescription to upload, rename, and generate credenzas"
```

---

### Task 4: Adicionar `CredenzaHeader` ao `AssetViewContent`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx` (função `AssetViewContent`, ~linha 363)

**Context:** `AssetViewContent` é renderizado como `children` via `openCredenza({ children: <AssetViewContent asset={asset} /> })`. Atualmente não tem header algum — apenas a imagem e o nome do arquivo em um `<p>`.

**Step 1: Substituir o conteúdo de `AssetViewContent`**

Localizar:
```tsx
function AssetViewContent({ asset }: { asset: Asset }) {
   return (
      <div className="flex flex-col items-center gap-2 p-2">
         <img
            alt={asset.alt ?? asset.filename}
            className="max-h-[85vh] w-auto max-w-full object-contain"
            src={asset.publicUrl}
         />
         <p className="text-center text-sm text-muted-foreground truncate px-2 w-full">
            {asset.filename}
         </p>
      </div>
   );
}
```

Substituir por:
```tsx
function AssetViewContent({ asset }: { asset: Asset }) {
   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Visualizar arquivo</CredenzaTitle>
            <CredenzaDescription>{asset.filename}</CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            <div className="flex flex-col items-center gap-2">
               <img
                  alt={asset.alt ?? asset.filename}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                  src={asset.publicUrl}
               />
            </div>
         </CredenzaBody>
      </>
   );
}
```

> Nota: `max-h-[85vh]` reduzido para `max-h-[70vh]` para acomodar o header sem overflow. O `<p>` com o filename é removido pois a `CredenzaDescription` já exibe o nome.

**Step 2: Verificar typecheck**

```bash
bun run typecheck
```

Esperado: sem erros.

**Step 3: Commit final**

```bash
git add apps/web/src/routes/_authenticated/$slug/$teamSlug/_dashboard/assets/index.tsx
git commit -m "feat(assets): add CredenzaHeader with description to AssetViewContent"
```

---

## Verificação final

```bash
bun run typecheck
bun run check
```

Navegar até `/[slug]/[teamSlug]/assets` no browser e verificar:
- Hover nos botões do card → tooltip aparece ("Visualizar", "Renomear", "Excluir")
- Clicar "Upload de imagem" → credenza com description visível abaixo do título
- Clicar "Renomear" em um asset → credenza com description
- Clicar "Gerar com IA" (se feature flag ativa) → credenza com description
- Clicar "Visualizar" em uma imagem → credenza com header "Visualizar arquivo" e filename como description
