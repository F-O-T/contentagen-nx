# Phase 3 Week 9-10: Forms Feature - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build complete forms feature with form builder UI, management, submissions inbox, and analytics dashboard. Forms can be embedded via SDK on external websites.

**Architecture:** Forms defined in dashboard with drag-and-drop builder. Stored in PostgreSQL. Embedded via SDK with automatic event tracking. Submissions stored and viewable in dashboard.

**Tech Stack:** React 19, TanStack Router, oRPC, Radix UI, Tailwind CSS, @dnd-kit/core (drag-and-drop)

**Duration:** 2 weeks

---

## Week 9: Forms Builder & Management

### Task 1: Forms API Router

**Files:**
- Create: `packages/api/src/server/routers/forms.ts`
- Modify: `packages/api/src/server/router.ts`

**Step 1: Create forms router**

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@packages/database/client';
import { forms, formSubmissions } from '@packages/database/schemas/forms';
import { eq, and, desc } from 'drizzle-orm';
import { APIError } from '@packages/utils/errors';

const fieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'textarea', 'checkbox', 'select']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const formsRouter = router({
  /**
   * Create form
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      fields: z.array(fieldSchema),
      settings: z.object({
        successMessage: z.string().optional(),
        redirectUrl: z.string().optional(),
        sendEmailNotification: z.boolean().optional(),
        emailRecipients: z.array(z.string().email()).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      const [form] = await db.insert(forms).values({
        organizationId: resolvedCtx.organizationId,
        name: input.name,
        description: input.description,
        fields: input.fields,
        settings: input.settings || {},
        isActive: true,
      }).returning();

      return form;
    }),

  /**
   * List all forms
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const allForms = await db.select()
        .from(forms)
        .where(eq(forms.organizationId, resolvedCtx.organizationId))
        .orderBy(desc(forms.createdAt));

      // Get submission counts
      const formsWithCounts = await Promise.all(
        allForms.map(async (form) => {
          const submissions = await db.select({ count: sql<number>`count(*)` })
            .from(formSubmissions)
            .where(eq(formSubmissions.formId, form.id));

          return {
            ...form,
            submissionCount: Number(submissions[0]?.count || 0),
          };
        })
      );

      return formsWithCounts;
    }),

  /**
   * Get form by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      const [form] = await db.select()
        .from(forms)
        .where(
          and(
            eq(forms.id, input.id),
            eq(forms.organizationId, resolvedCtx.organizationId)
          )
        )
        .limit(1);

      if (!form) {
        throw APIError.notFound('Form not found');
      }

      return form;
    }),

  /**
   * Update form
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      fields: z.array(fieldSchema).optional(),
      settings: z.object({
        successMessage: z.string().optional(),
        redirectUrl: z.string().optional(),
        sendEmailNotification: z.boolean().optional(),
        emailRecipients: z.array(z.string().email()).optional(),
      }).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      const { id, ...updates } = input;

      // Verify ownership
      const [existing] = await db.select()
        .from(forms)
        .where(
          and(
            eq(forms.id, id),
            eq(forms.organizationId, resolvedCtx.organizationId)
          )
        )
        .limit(1);

      if (!existing) {
        throw APIError.notFound('Form not found');
      }

      const [updated] = await db.update(forms)
        .set(updates)
        .where(eq(forms.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete form
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      // Verify ownership
      const [existing] = await db.select()
        .from(forms)
        .where(
          and(
            eq(forms.id, input.id),
            eq(forms.organizationId, resolvedCtx.organizationId)
          )
        )
        .limit(1);

      if (!existing) {
        throw APIError.notFound('Form not found');
      }

      await db.delete(forms).where(eq(forms.id, input.id));

      return { success: true };
    }),

  /**
   * Get form submissions
   */
  getSubmissions: protectedProcedure
    .input(z.object({
      formId: z.string().uuid(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const resolvedCtx = await ctx;

      // Verify form ownership
      const [form] = await db.select()
        .from(forms)
        .where(
          and(
            eq(forms.id, input.formId),
            eq(forms.organizationId, resolvedCtx.organizationId)
          )
        )
        .limit(1);

      if (!form) {
        throw APIError.notFound('Form not found');
      }

      const submissions = await db.select()
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, input.formId))
        .orderBy(desc(formSubmissions.submittedAt))
        .offset((input.page - 1) * input.limit)
        .limit(input.limit);

      // Get total count
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, input.formId));

      return {
        submissions,
        total: Number(count),
        page: input.page,
        limit: input.limit,
        pages: Math.ceil(Number(count) / input.limit),
      };
    }),
});
```

**Step 2: Mount forms router**

File: `packages/api/src/server/router.ts`

```typescript
import { formsRouter } from './routers/forms';

export const appRouter = router({
  // ... existing
  forms: formsRouter,
});
```

**Step 3: Test forms API**

```bash
curl -X POST http://localhost:3000/api/forms/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contact Form",
    "fields": [
      {"id": "name", "type": "text", "label": "Name", "required": true},
      {"id": "email", "type": "email", "label": "Email", "required": true}
    ]
  }'
```

**Step 4: Commit**

```bash
git add packages/api
git commit -m "feat(api): add forms router

- CRUD operations for forms
- Get form submissions
- Pagination support
- Validate field schemas"
```

---

### Task 2: Forms List Page

**Files:**
- Create: `apps/web/src/routes/$slug/_dashboard/forms/index.tsx`
- Create: `apps/web/src/features/forms/ui/forms-list.tsx`

**Step 1: Create forms list route**

File: `apps/web/src/routes/$slug/_dashboard/forms/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { FormsList } from '@/features/forms/ui/forms-list';

export const Route = createFileRoute('/$slug/_dashboard/forms/')({
  component: FormsPage,
});

function FormsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-muted-foreground">
            Create and manage forms for your website
          </p>
        </div>
      </div>

      <FormsList />
    </div>
  );
}
```

**Step 2: Create forms list component**

File: `apps/web/src/features/forms/ui/forms-list.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { Button } from '@packages/ui/components/button';
import { Card, CardContent } from '@packages/ui/components/card';
import { PlusIcon, EyeIcon, EditIcon, TrashIcon } from 'lucide-react';
import { useSheet } from '@/hooks/use-sheet';
import { useAlertDialog } from '@/hooks/use-alert-dialog';
import { Link } from '@tanstack/react-router';

export function FormsList() {
  const { data: forms, isLoading } = trpc.forms.list.useQuery();
  const { openSheet } = useSheet();
  const { openAlertDialog } = useAlertDialog();

  const deleteMutation = trpc.forms.delete.useMutation();

  const handleDelete = (formId: string, formName: string) => {
    openAlertDialog({
      title: 'Delete Form',
      description: `Are you sure you want to delete "${formName}"? All submissions will be lost.`,
      actionLabel: 'Delete',
      variant: 'destructive',
      onAction: async () => {
        await deleteMutation.mutateAsync({ id: formId });
      },
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openSheet({ children: <CreateFormSheet /> })}>
          <PlusIcon className="size-4 mr-2" />
          Create Form
        </Button>
      </div>

      {forms?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No forms yet</p>
            <Button onClick={() => openSheet({ children: <CreateFormSheet /> })}>
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms?.map(form => (
            <Card key={form.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{form.name}</h3>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {form.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{form.fields.length} fields</span>
                      <span>{form.submissionCount} submissions</span>
                      <span className={form.isActive ? 'text-green-600' : 'text-gray-400'}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link to="/$slug/forms/$formId/submissions" params={{ formId: form.id }}>
                        <EyeIcon className="size-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link to="/$slug/forms/$formId" params={{ formId: form.id }}>
                        <EditIcon className="size-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(form.id, form.name)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateFormSheet() {
  // Implementation in next task
  return <div>Create Form (Task 3)</div>;
}
```

**Step 3: Add to navigation**

```tsx
<NavItem href="/$slug/forms" icon={FormIcon}>
  Forms
</NavItem>
```

**Step 4: Test forms list**

Navigate to `/your-org/forms` - should show:
- Empty state if no forms
- Create button
- Forms list (if any exist)

**Step 5: Commit**

```bash
git add apps/web/src/routes apps/web/src/features/forms
git commit -m "feat(forms): add forms list page

- Display all forms
- Show field count and submissions
- Delete form functionality
- Empty state"
```

---

### Task 3: Form Builder UI

**Files:**
- Create: `apps/web/src/features/forms/ui/form-builder.tsx`
- Create: `apps/web/src/features/forms/ui/field-palette.tsx`
- Create: `apps/web/src/features/forms/ui/form-canvas.tsx`

**Step 1: Install drag-and-drop library**

```bash
cd apps/web
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Create field palette**

File: `apps/web/src/features/forms/ui/field-palette.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@packages/ui/components/card';
import { useDraggable } from '@dnd-kit/core';
import { TypeIcon, MailIcon, TextIcon, CheckSquareIcon, ListIcon } from 'lucide-react';

const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: TypeIcon },
  { type: 'email', label: 'Email', icon: MailIcon },
  { type: 'textarea', label: 'Text Area', icon: TextIcon },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquareIcon },
  { type: 'select', label: 'Dropdown', icon: ListIcon },
] as const;

export function FieldPalette() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add Fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {FIELD_TYPES.map(field => (
          <DraggableFieldType key={field.type} {...field} />
        ))}
      </CardContent>
    </Card>
  );
}

function DraggableFieldType({ type, label, icon: Icon }: typeof FIELD_TYPES[number]) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-3 border rounded cursor-grab hover:bg-accent"
    >
      <Icon className="size-4" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
```

**Step 3: Create form canvas**

File: `apps/web/src/features/forms/ui/form-canvas.tsx`

```tsx
import { Card, CardContent } from '@packages/ui/components/card';
import { Button } from '@packages/ui/components/button';
import { Input } from '@packages/ui/components/input';
import { Label } from '@packages/ui/components/label';
import { Switch } from '@packages/ui/components/switch';
import { TrashIcon, GripVerticalIcon } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'checkbox' | 'select';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormCanvasProps {
  fields: FormField[];
  onFieldUpdate: (id: string, updates: Partial<FormField>) => void;
  onFieldDelete: (id: string) => void;
}

export function FormCanvas({ fields, onFieldUpdate, onFieldDelete }: FormCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'form-canvas',
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div ref={setNodeRef} className="min-h-[400px] space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Drag fields from the left to build your form
            </div>
          ) : (
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map(field => (
                <SortableField
                  key={field.id}
                  field={field}
                  onUpdate={(updates) => onFieldUpdate(field.id, updates)}
                  onDelete={() => onFieldDelete(field.id)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SortableField({
  field,
  onUpdate,
  onDelete,
}: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div {...listeners} {...attributes} className="cursor-grab">
            <GripVerticalIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
              className="font-medium"
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <TrashIcon className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 pl-6">
        <div>
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Enter placeholder text..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={field.required}
            onCheckedChange={(required) => onUpdate({ required })}
          />
          <Label>Required field</Label>
        </div>

        {field.type === 'select' && (
          <div>
            <Label>Options (one per line)</Label>
            <textarea
              value={field.options?.join('\n') || ''}
              onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(Boolean) })}
              className="w-full px-3 py-2 border rounded"
              rows={4}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Create form builder page**

File: `apps/web/src/routes/$slug/_dashboard/forms/$formId.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { FormBuilder } from '@/features/forms/ui/form-builder';

export const Route = createFileRoute('/$slug/_dashboard/forms/$formId')({
  component: FormBuilderPage,
});

function FormBuilderPage() {
  return (
    <div className="container mx-auto py-6">
      <FormBuilder />
    </div>
  );
}
```

File: `apps/web/src/features/forms/ui/form-builder.tsx`

```tsx
import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { FieldPalette } from './field-palette';
import { FormCanvas } from './form-canvas';
import { Button } from '@packages/ui/components/button';
import { Input } from '@packages/ui/components/input';
import { Label } from '@packages/ui/components/label';
import { Card, CardContent, CardHeader, CardTitle } from '@packages/ui/components/card';
import { trpc } from '@/lib/trpc';
import { useParams, useNavigate } from '@tanstack/react-router';

export function FormBuilder() {
  const params = useParams({ from: '/$slug/_dashboard/forms/$formId' });
  const navigate = useNavigate();

  const { data: form } = trpc.forms.getById.useQuery(
    { id: params.formId },
    { enabled: params.formId !== 'new' }
  );

  const [name, setName] = useState(form?.name || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState<any[]>(form?.fields || []);

  const createMutation = trpc.forms.create.useMutation();
  const updateMutation = trpc.forms.update.useMutation();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Adding new field from palette
    if (active.id.toString().startsWith('palette-')) {
      const fieldType = active.data.current?.type;
      const newField = {
        id: `field-${Date.now()}`,
        type: fieldType,
        label: `New ${fieldType} field`,
        placeholder: '',
        required: false,
        options: fieldType === 'select' ? [] : undefined,
      };
      setFields([...fields, newField]);
      return;
    }

    // Reordering fields
    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);

    if (oldIndex !== newIndex) {
      setFields(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const handleSave = async () => {
    if (params.formId === 'new') {
      const created = await createMutation.mutateAsync({
        name,
        description,
        fields,
      });
      navigate({ to: '/$slug/forms/$formId', params: { formId: created.id } });
    } else {
      await updateMutation.mutateAsync({
        id: params.formId,
        name,
        description,
        fields,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {params.formId === 'new' ? 'Create Form' : 'Edit Form'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/$slug/forms' })}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Form
          </Button>
        </div>
      </div>

      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Form Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Contact Form"
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this form"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Builder */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[250px_1fr] gap-6">
          <FieldPalette />
          <FormCanvas
            fields={fields}
            onFieldUpdate={(id, updates) => {
              setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
            }}
            onFieldDelete={(id) => {
              setFields(fields.filter(f => f.id !== id));
            }}
          />
        </div>
      </DndContext>
    </div>
  );
}
```

**Step 5: Test form builder**

1. Navigate to `/your-org/forms`
2. Click "Create Form"
3. Drag fields from palette
4. Configure field properties
5. Reorder fields
6. Save form

**Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(forms): add form builder UI

- Drag-and-drop field palette
- Form canvas with sortable fields
- Field configuration
- Save form functionality"
```

---

## Week 10: Submissions & Analytics

### Task 4: Submissions Inbox

**Files:**
- Create: `apps/web/src/routes/$slug/_dashboard/forms/$formId/submissions.tsx`
- Create: `apps/web/src/features/forms/ui/submissions-table.tsx`

**Step 1: Create submissions route**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { SubmissionsTable } from '@/features/forms/ui/submissions-table';

export const Route = createFileRoute('/$slug/_dashboard/forms/$formId/submissions')({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { formId } = useParams();
  const { data: form } = trpc.forms.getById.useQuery({ id: formId });

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{form?.name} Submissions</h1>
        <p className="text-muted-foreground">
          View and manage form submissions
        </p>
      </div>

      <SubmissionsTable formId={formId} />
    </div>
  );
}
```

**Step 2: Create submissions table**

File: `apps/web/src/features/forms/ui/submissions-table.tsx`

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@packages/ui/components/table';
import { Card } from '@packages/ui/components/card';
import { Button } from '@packages/ui/components/button';
import { useCredenza } from '@/hooks/use-credenza';

export function SubmissionsTable({ formId }: { formId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.forms.getSubmissions.useQuery({
    formId,
    page,
    limit: 50,
  });

  const { data: form } = trpc.forms.getById.useQuery({ id: formId });
  const { openCredenza } = useCredenza();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted At</TableHead>
              {form?.fields.map(field => (
                <TableHead key={field.id}>{field.label}</TableHead>
              ))}
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.submissions.map(submission => (
              <TableRow key={submission.id}>
                <TableCell>
                  {new Date(submission.submittedAt).toLocaleString()}
                </TableCell>
                {form?.fields.map(field => (
                  <TableCell key={field.id}>
                    {submission.data[field.id] || '-'}
                  </TableCell>
                ))}
                <TableCell>
                  {submission.metadata?.referrer ? (
                    <a
                      href={submission.metadata.referrer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {new URL(submission.metadata.referrer).hostname}
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      openCredenza({
                        children: <SubmissionDetails submission={submission} form={form} />,
                      });
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Page {data?.page} of {data?.pages} ({data?.total} total submissions)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= (data?.pages || 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function SubmissionDetails({ submission, form }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Submission Data</h3>
        <dl className="space-y-2">
          {form.fields.map((field: any) => (
            <div key={field.id} className="flex gap-2">
              <dt className="font-medium min-w-[120px]">{field.label}:</dt>
              <dd>{submission.data[field.id] || '-'}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Metadata</h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium">Submitted:</dt>
            <dd>{new Date(submission.submittedAt).toLocaleString()}</dd>
          </div>
          {submission.metadata?.referrer && (
            <div>
              <dt className="font-medium">Referrer:</dt>
              <dd>{submission.metadata.referrer}</dd>
            </div>
          )}
          {submission.metadata?.visitorId && (
            <div>
              <dt className="font-medium">Visitor ID:</dt>
              <dd className="font-mono text-xs">{submission.metadata.visitorId}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
```

**Step 3: Test submissions inbox**

1. Create a form
2. Submit via SDK (or manually insert test data)
3. Navigate to submissions page
4. View submission details

**Step 4: Commit**

```bash
git add apps/web
git commit -m "feat(forms): add submissions inbox

- Display all form submissions
- Paginated table
- View submission details modal
- Show referrer and metadata"
```

---

### Task 5: Form Analytics

**Files:**
- Create: `apps/web/src/routes/$slug/_dashboard/forms/$formId/analytics.tsx`
- Create: `apps/web/src/features/forms/ui/form-analytics.tsx`

**Step 1: Create analytics route**

```tsx
import { createFileRoute } from '@tantml:react-router';
import { FormAnalytics } from '@/features/forms/ui/form-analytics';

export const Route = createFileRoute('/$slug/_dashboard/forms/$formId/analytics')({
  component: FormAnalyticsPage,
});

function FormAnalyticsPage() {
  const { formId } = useParams();

  return (
    <div className="container mx-auto py-6">
      <FormAnalytics formId={formId} />
    </div>
  );
}
```

**Step 2: Create analytics component**

File: `apps/web/src/features/forms/ui/form-analytics.tsx`

```tsx
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@packages/ui/components/card';

export function FormAnalytics({ formId }: { formId: string }) {
  const { data: form } = trpc.forms.getById.useQuery({ id: formId });
  const { data: submissions } = trpc.forms.getSubmissions.useQuery({
    formId,
    page: 1,
    limit: 1000, // Get all for analytics
  });

  // Calculate metrics
  const totalSubmissions = submissions?.total || 0;
  const avgSubmissionsPerDay = totalSubmissions / 30; // Rough estimate

  // Calculate field completion rates
  const fieldStats = form?.fields.map(field => {
    const completed = submissions?.submissions.filter(
      s => s.data[field.id] && s.data[field.id] !== ''
    ).length || 0;

    return {
      fieldName: field.label,
      completionRate: totalSubmissions > 0 ? (completed / totalSubmissions) * 100 : 0,
      completed,
      total: totalSubmissions,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{form?.name} Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Submissions</CardDescription>
            <CardTitle className="text-4xl">{totalSubmissions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Avg Per Day</CardDescription>
            <CardTitle className="text-4xl">{avgSubmissionsPerDay.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-4xl">
              {fieldStats && fieldStats.length > 0
                ? (fieldStats.reduce((sum, f) => sum + f.completionRate, 0) / fieldStats.length).toFixed(1)
                : '0'}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Field Completion Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Field Completion Rates</CardTitle>
          <CardDescription>
            Percentage of submissions with each field completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fieldStats?.map(stat => (
              <div key={stat.fieldName}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{stat.fieldName}</span>
                  <span>{stat.completionRate.toFixed(1)}% ({stat.completed}/{stat.total})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${stat.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Add analytics tab to form page**

Add tabs to form submissions page:

```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="submissions">Submissions</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>

  <TabsContent value="submissions">
    <SubmissionsTable formId={formId} />
  </TabsContent>

  <TabsContent value="analytics">
    <FormAnalytics formId={formId} />
  </TabsContent>
</Tabs>
```

**Step 4: Test analytics**

Navigate to form analytics - should show:
- Total submissions
- Average per day
- Completion rate
- Field completion breakdown

**Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(forms): add analytics dashboard

- Key metrics cards
- Field completion rates
- Visual progress bars
- Tabs for submissions/analytics"
```

---

## Week 9-10 Checklist

### Week 9
- [x] Forms API router
- [x] Forms list page
- [x] Form builder with drag-and-drop
- [x] Field palette
- [x] Form canvas

### Week 10
- [x] Submissions inbox
- [x] Paginated submissions table
- [x] Submission details modal
- [x] Form analytics dashboard

**Phase 3 Complete!** 🎉🎉🎉

**All 10 Weeks Complete!**

You now have complete implementation plans for:
- ✅ Phase 1: Event System (Weeks 1-3)
- ✅ Phase 2: SDK Enhancement (Weeks 4-6)
- ✅ Phase 3: Platform Features (Weeks 7-10)

Ready to start implementation! Use **superpowers:executing-plans** to execute week by week.
