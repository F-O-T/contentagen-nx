# Onboarding UI Redesign — Developer-Focused

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the onboarding wizard UI to feel polished, developer-oriented, and efficient — with a structured layout (fixed header/footer), tighter copy, compact logo upload, and SDK code snippets on the products step.

**Architecture:** Keep existing 4-step wizard logic and Better Auth client integration. Restructure the layout into header (stepper) / main (content) / footer (buttons). Add a code snippet preview component on the products step with package manager tabs.

**Tech Stack:** React, TanStack Form, shadcn/Tailwind, defineStepper, Tabs (Radix), new CodeBlock component

---

## Design Decisions

### Layout: Three-Zone Page
- **Header**: Logo/wordmark left, stepper center (variant="line"), user avatar right (optional)
- **Main**: Vertically centered, max-w-lg, step heading + form
- **Footer**: Fixed bottom, top border, Back (left) / Continue (right) buttons inside same max-w container

### Copy: Developer Casual (Portuguese)
- Direct, friendly, uses dev terms naturally
- No fluff paragraphs — short subtexts

### Code Snippets: Products Step Only
- When Content/Analytics selected, show SDK install + usage preview
- Tabs for package manager: npm / pnpm / bun
- Static/illustrative code — no real API keys

### Logo Upload: Compact Circle
- 64x64 circular dropzone replacing the 176px tall rectangle
- Camera icon when empty, image preview when selected
- Sits above the workspace name input

### Visual Polish
- Subtle opacity+translateY transition when switching steps
- Product cards: ring on selection + subtle scale(1.02)
- Code block animates in on first product selection
- Footer buttons: h-10, not flex-1 stretched

---

## Tasks

### Task 1: Restructure OnboardingWizard Layout

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/onboarding-wizard.tsx`

**Changes:**
- Replace current `flex min-h-screen items-center justify-center` with a three-zone layout:
  - `<header>` — fixed top, contains logo + stepper
  - `<main>` — flex-1, overflow-y-auto, centers step content vertically
  - `<footer>` — fixed bottom, border-t, contains navigation buttons
- Move Back/Continue buttons OUT of individual step components and INTO the wizard footer
- Each step component now only renders heading + form fields (no buttons)
- Pass `isPending` and `onSubmit` refs up so the footer button can trigger step submission
- Keep the stepper with `variant="line"`

**Step-by-step:**

1. Update `OnboardingWizard` to render the three-zone layout:
```tsx
<div className="flex min-h-screen flex-col bg-background">
  {/* Header */}
  <header className="border-b px-4 py-4">
    <div className="mx-auto flex max-w-lg items-center justify-between">
      <h1 className="font-serif text-xl font-bold tracking-tight">Contentta</h1>
      <div className="flex-1 px-8">
        <Stepper.Navigation>
          {steps.map((step) => (
            <Stepper.Step key={step.id} of={step.id} />
          ))}
        </Stepper.Navigation>
      </div>
    </div>
  </header>

  {/* Main */}
  <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
    <div className="w-full max-w-lg">
      {methods.flow.switch({...})}
    </div>
  </main>

  {/* Footer */}
  <footer className="border-t px-4 py-4">
    <div className="mx-auto flex max-w-lg items-center justify-between">
      {canGoBack && (
        <Button variant="outline" onClick={handleBack} disabled={isPending}>
          Voltar
        </Button>
      )}
      <div className="ml-auto">
        <Button onClick={handleNext} disabled={isPending || !canContinue}>
          {isPending ? <Spinner className="size-4" /> : isLastStep ? "Concluir" : "Continuar"}
        </Button>
      </div>
    </div>
  </footer>
</div>
```

2. Add state management for step submission:
- Each step exposes a `ref` with `{ submit: () => Promise<boolean>, canContinue: boolean }`
- Footer "Continue" button calls the active step's submit
- On success, advance to next step

3. Commit

---

### Task 2: Refactor Step Components to Remove Buttons

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/profile-step.tsx`
- Modify: `apps/web/src/features/onboarding/ui/workspace-step.tsx`
- Modify: `apps/web/src/features/onboarding/ui/project-step.tsx`
- Modify: `apps/web/src/features/onboarding/ui/products-step.tsx`

**Changes per step:**
- Remove `<Button>` elements (Back + Continue) from each step's JSX
- Remove `onBack` prop from all step interfaces
- Each step uses `useImperativeHandle` to expose:
  ```tsx
  useImperativeHandle(ref, () => ({
    submit: async () => { /* trigger form submit, return true on success */ },
    canContinue: boolean, // e.g., products step: selected.length > 0
  }));
  ```
- `ProfileStep`, `WorkspaceStep`, `ProjectStep` — `canContinue` is always `true` (form validation handles it)
- `ProductsStep` — `canContinue` = `selected.length > 0`
- Remove `isPending` button rendering from each step (footer handles it)
- Keep `isPending` state for disabling inputs during submission

**Step-by-step:**
1. Update all 4 step components with `forwardRef` + `useImperativeHandle`
2. Remove button JSX and `onBack` props
3. Update `OnboardingWizard` to use refs and wire footer buttons
4. Commit

---

### Task 3: Update Copy to Developer Casual Tone

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/profile-step.tsx`
- Modify: `apps/web/src/features/onboarding/ui/workspace-step.tsx`
- Modify: `apps/web/src/features/onboarding/ui/project-step.tsx`
- Modify: `apps/web/src/features/onboarding/ui/products-step.tsx`

**Copy changes:**

| Step | Current Heading | New Heading | Current Subtext | New Subtext |
|------|----------------|-------------|-----------------|-------------|
| Profile | "Como podemos te chamar?" | "Como podemos te chamar?" | "Precisamos do seu nome para personalizar sua experiência." | "Usado para personalizar sua experiência." |
| Workspace | "Crie seu workspace" | "Crie seu workspace" | "O workspace é a sua organização. Você pode ter vários projetos dentro dele." | "Seu workspace organiza projetos, conteúdo e equipe." |
| Project | "Crie seu primeiro projeto" | "Crie seu primeiro projeto" | "Dê um nome para o seu projeto. Você pode ter vários projetos no mesmo workspace." | "Projetos organizam seu conteúdo por site, blog ou produto." |
| Products | "O que você quer fazer?" | "O que você quer fazer?" | "Selecione os produtos que deseja usar. Você pode mudar depois." | "Selecione os produtos para começar. Você pode mudar depois." |

Headings are already good. Just tighten subtexts — remove redundancy, keep them to one short sentence.

**Step-by-step:**
1. Update subtext strings in all 4 files
2. Commit

---

### Task 4: Compact Logo Upload (Circle Dropzone)

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/workspace-step.tsx`

**Changes:**
- Replace the 176px tall Dropzone with a compact 64x64 circular upload area
- Center it above the workspace name input
- Use a camera/upload icon as empty state (replace Building icon)
- Show image preview clipped to circle
- Add slug preview below the input as muted text: `contentta.co/slug-here`

**New layout:**
```tsx
<div className="space-y-6">
  <div className="space-y-2 text-center">
    <h2>...</h2>
    <p>...</p>
  </div>

  <form className="space-y-4" onSubmit={handleSubmit}>
    {/* Circular logo upload centered */}
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative size-16 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors overflow-hidden"
      >
        {filePreview ? (
          <img src={filePreview} className="size-full object-cover" />
        ) : (
          <Camera className="size-5 text-muted-foreground mx-auto" />
        )}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={...} />
    </div>

    {/* Workspace name */}
    <FieldGroup>
      <form.Field name="workspaceName">
        {(field) => (
          <Field>
            <FieldLabel>Nome do Workspace</FieldLabel>
            <Input ... />
            {/* Slug preview */}
            <p className="text-xs text-muted-foreground mt-1">
              contentta.co/{createSlug(field.state.value) || "seu-workspace"}
            </p>
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  </form>
</div>
```

**Step-by-step:**
1. Replace Dropzone with compact circle upload using a hidden file input + button
2. Add slug preview below the input
3. Keep the useFileUpload hook for preview/validation
4. Commit

---

### Task 5: Create CodeBlock Component

**Files:**
- Create: `packages/ui/src/components/code-block.tsx`
- Modify: `packages/ui/package.json` (add export)

**Component spec:**
- Simple code display component (no syntax highlighting library needed)
- Dark background, monospace font, rounded corners
- Copy-to-clipboard button in top-right
- Optional language label in top-left
- Optional Tabs integration for multiple variants (npm/pnpm/bun)

```tsx
interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

// Usage:
<CodeBlock code="npm install @contentta/sdk" language="bash" />

// With tabs:
<Tabs defaultValue="npm">
  <TabsList variant="line">
    <TabsTrigger value="npm">npm</TabsTrigger>
    <TabsTrigger value="pnpm">pnpm</TabsTrigger>
    <TabsTrigger value="bun">bun</TabsTrigger>
  </TabsList>
  <TabsContent value="npm">
    <CodeBlock code="npm install @contentta/sdk" language="bash" />
  </TabsContent>
  ...
</Tabs>
```

**Styling:**
```tsx
<div className="relative rounded-lg bg-zinc-950 dark:bg-zinc-900 text-zinc-100 text-sm">
  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
    <span className="text-xs text-zinc-400">{language}</span>
    <button onClick={copyToClipboard}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  </div>
  <pre className="overflow-x-auto p-4">
    <code className="font-mono text-sm">{code}</code>
  </pre>
</div>
```

**Step-by-step:**
1. Create the `code-block.tsx` component
2. Add `"./components/code-block"` export to `packages/ui/package.json`
3. Commit

---

### Task 6: Add Code Snippets to Products Step

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/products-step.tsx`

**Changes:**
- Import `CodeBlock` from `@packages/ui/components/code-block`
- Import `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@packages/ui/components/tabs`
- Below the product cards, conditionally render a code snippet section when `selected.length > 0`
- Code snippets are static/illustrative

**Snippet logic:**
```tsx
const installCommands = {
  npm: "npm install @contentta/sdk",
  pnpm: "pnpm add @contentta/sdk",
  bun: "bun add @contentta/sdk",
};

const usageSnippets: Record<Product, string> = {
  content: `import { Contentta } from '@contentta/sdk'

const client = new Contentta({
  apiKey: 'your-api-key'
})

// Crie e publique conteúdo
const page = await client.content.create({
  title: 'Meu primeiro post',
  body: '...'
})`,
  analytics: `import { Contentta } from '@contentta/sdk'

const client = new Contentta({
  apiKey: 'your-api-key'
})

// Acompanhe eventos
client.capture('page_view', {
  url: window.location.href
})`,
};
```

**Layout:**
```tsx
{selected.length > 0 && (
  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <Tabs defaultValue="npm">
      <TabsList variant="line">
        <TabsTrigger value="npm">npm</TabsTrigger>
        <TabsTrigger value="pnpm">pnpm</TabsTrigger>
        <TabsTrigger value="bun">bun</TabsTrigger>
      </TabsList>
      <TabsContent value="npm">
        <CodeBlock code={installCommands.npm} language="bash" />
      </TabsContent>
      ...
    </Tabs>

    {/* Usage examples for selected products */}
    {selected.map((product) => (
      <CodeBlock key={product} code={usageSnippets[product]} language="typescript" />
    ))}
  </div>
)}
```

**Step-by-step:**
1. Add snippet data constants
2. Add conditional code block rendering below product cards
3. Commit

---

### Task 7: Product Card Visual Polish

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/products-step.tsx`

**Changes:**
- Add `ring-2 ring-primary/20` on selected state (in addition to border)
- Add `transition-transform hover:scale-[1.01]` to cards
- Replace custom SVG checkbox with shadcn `Checkbox` component for consistency
- Slightly larger icon container (size-12 instead of size-10)

**Step-by-step:**
1. Update card className with ring and scale transitions
2. Replace SVG checkbox with Checkbox component
3. Adjust icon container size
4. Commit

---

### Task 8: Step Transition Animation

**Files:**
- Modify: `apps/web/src/features/onboarding/ui/onboarding-wizard.tsx`

**Changes:**
- Wrap step content in a div with Tailwind's `animate-in fade-in slide-in-from-bottom-2 duration-200`
- Use a `key` based on current step ID to trigger re-mount and animation on step change

```tsx
<main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
  <div
    key={currentStepId}
    className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
  >
    {methods.flow.switch({...})}
  </div>
</main>
```

**Step-by-step:**
1. Add animation wrapper with step-based key
2. Verify transitions work on step change
3. Commit

---

### Task 9: Typecheck & Final Verification

**Step-by-step:**
1. Run `bun run typecheck` to verify no TypeScript errors
2. Run `bun run check` to verify Biome lint/format
3. Fix any issues found
4. Final commit
