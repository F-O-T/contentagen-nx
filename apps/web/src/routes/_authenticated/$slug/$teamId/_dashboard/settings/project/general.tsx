import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   SheetClose,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { createFileRoute } from "@tanstack/react-router";
import {
   Calendar,
   Check,
   Clock,
   Coins,
   Copy,
   Hash,
   Info,
   Key,
   Loader2,
   Pencil,
   Settings2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/project/general",
)({
   component: ProjectGeneralPage,
});

// ============================================
// Mock Data
// ============================================

const MOCK_PROJECT = {
   id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
   name: "Meu Projeto",
   slug: "meu-projeto",
   timezone: "America/Sao_Paulo",
   currency: "BRL",
   publicApiKey: "pk_live_abc123def456ghi789jkl012mno345pqr678stu901",
   createdAt: new Date("2025-06-15T10:30:00Z"),
   status: "active" as const,
};

const TIMEZONE_OPTIONS = [
   { value: "America/Sao_Paulo", label: "América/São Paulo (BRT, UTC-3)" },
   { value: "America/Manaus", label: "América/Manaus (AMT, UTC-4)" },
   { value: "America/Belem", label: "América/Belém (BRT, UTC-3)" },
   { value: "America/Fortaleza", label: "América/Fortaleza (BRT, UTC-3)" },
   { value: "America/Recife", label: "América/Recife (BRT, UTC-3)" },
   { value: "America/Noronha", label: "América/Noronha (FNT, UTC-2)" },
   { value: "America/New_York", label: "América/Nova York (EST, UTC-5)" },
   { value: "America/Los_Angeles", label: "América/Los Angeles (PST, UTC-8)" },
   { value: "Europe/Lisbon", label: "Europa/Lisboa (WET, UTC+0)" },
   { value: "Europe/London", label: "Europa/Londres (GMT, UTC+0)" },
];

const CURRENCY_OPTIONS = [
   { value: "BRL", label: "Real Brasileiro (BRL)" },
   { value: "USD", label: "Dólar Americano (USD)" },
   { value: "EUR", label: "Euro (EUR)" },
   { value: "GBP", label: "Libra Esterlina (GBP)" },
];

function formatDate(date: Date | string | null): string {
   if (!date) return "-";
   const d = new Date(date);
   return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
   });
}

function getTimezoneLabel(value: string): string {
   return (
      TIMEZONE_OPTIONS.find((tz) => tz.value === value)?.label || value
   );
}

function getCurrencyLabel(value: string): string {
   return (
      CURRENCY_OPTIONS.find((c) => c.value === value)?.label || value
   );
}

// ============================================
// Change Name Sheet Content
// ============================================

function ChangeNameSheetContent({
   currentName,
   onClose,
}: {
   currentName: string;
   onClose: () => void;
}) {
   const [name, setName] = useState(currentName);
   const [isPending, setIsPending] = useState(false);

   const isValid = name.trim().length > 0 && name !== currentName;

   const handleSave = () => {
      setIsPending(true);
      setTimeout(() => {
         setIsPending(false);
         toast.success("Nome do projeto atualizado com sucesso!");
         onClose();
      }, 500);
   };

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>Alterar Nome do Projeto</SheetTitle>
            <SheetDescription>
               Atualize o nome de exibição do projeto
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Alert>
               <Info className="size-4" />
               <AlertTitle>Nome do Projeto</AlertTitle>
               <AlertDescription>
                  Este é o nome que aparecerá no painel e nas integrações.
               </AlertDescription>
            </Alert>

            <div className="space-y-2">
               <Label htmlFor="project-name">Nome</Label>
               <Input
                  id="project-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Meu Projeto"
                  value={name}
               />
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button
               disabled={!isValid || isPending}
               onClick={handleSave}
            >
               {isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar
            </Button>
         </SheetFooter>
      </div>
   );
}

// ============================================
// Change Timezone Sheet Content
// ============================================

function ChangeTimezoneSheetContent({
   currentTimezone,
   onClose,
}: {
   currentTimezone: string;
   onClose: () => void;
}) {
   const [timezone, setTimezone] = useState(currentTimezone);
   const [isPending, setIsPending] = useState(false);

   const isValid = timezone !== currentTimezone;

   const handleSave = () => {
      setIsPending(true);
      setTimeout(() => {
         setIsPending(false);
         toast.success("Fuso horário atualizado com sucesso!");
         onClose();
      }, 500);
   };

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>Alterar Fuso Horário</SheetTitle>
            <SheetDescription>
               Selecione o fuso horário do projeto
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Alert>
               <Info className="size-4" />
               <AlertTitle>Fuso Horário</AlertTitle>
               <AlertDescription>
                  O fuso horário é usado para exibir datas e agendar
                  publicações.
               </AlertDescription>
            </Alert>

            <div className="space-y-2">
               <Label htmlFor="timezone">Fuso Horário</Label>
               <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone">
                     <SelectValue placeholder="Selecione um fuso horário" />
                  </SelectTrigger>
                  <SelectContent>
                     {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                           {tz.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button
               disabled={!isValid || isPending}
               onClick={handleSave}
            >
               {isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar
            </Button>
         </SheetFooter>
      </div>
   );
}

// ============================================
// Change Currency Sheet Content
// ============================================

function ChangeCurrencySheetContent({
   currentCurrency,
   onClose,
}: {
   currentCurrency: string;
   onClose: () => void;
}) {
   const [currency, setCurrency] = useState(currentCurrency);
   const [isPending, setIsPending] = useState(false);

   const isValid = currency !== currentCurrency;

   const handleSave = () => {
      setIsPending(true);
      setTimeout(() => {
         setIsPending(false);
         toast.success("Moeda padrão atualizada com sucesso!");
         onClose();
      }, 500);
   };

   return (
      <div className="flex flex-col h-full">
         <SheetHeader>
            <SheetTitle>Alterar Moeda Padrão</SheetTitle>
            <SheetDescription>
               Selecione a moeda padrão do projeto
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Alert>
               <Info className="size-4" />
               <AlertTitle>Moeda Padrão</AlertTitle>
               <AlertDescription>
                  A moeda é usada para exibir valores monetários em
                  relatórios e métricas.
               </AlertDescription>
            </Alert>

            <div className="space-y-2">
               <Label htmlFor="currency">Moeda</Label>
               <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                     <SelectValue placeholder="Selecione uma moeda" />
                  </SelectTrigger>
                  <SelectContent>
                     {CURRENCY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                           {c.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button
               disabled={!isValid || isPending}
               onClick={handleSave}
            >
               {isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Salvar
            </Button>
         </SheetFooter>
      </div>
   );
}

// ============================================
// Skeleton
// ============================================

function ProjectGeneralSkeleton() {
   return (
      <div className="space-y-6">
         <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-1">
               <Skeleton className="h-16 w-full rounded-lg" />
               <Skeleton className="h-16 w-full rounded-lg" />
               <Skeleton className="h-16 w-full rounded-lg" />
               <Skeleton className="h-16 w-full rounded-lg" />
               <Skeleton className="h-16 w-full rounded-lg" />
            </div>
         </div>

         <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
         </div>
      </div>
   );
}

// ============================================
// Error Fallback
// ============================================

function ProjectGeneralErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Geral</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie o nome, slug e configurações padrão do projeto.
            </p>
         </div>
         <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
               Não foi possível carregar as configurações do projeto
            </p>
            <Button variant="outline" onClick={resetErrorBoundary}>
               Tentar novamente
            </Button>
         </div>
      </div>
   );
}

// ============================================
// Main Content Component
// ============================================

function ProjectGeneralContent() {
   const { openSheet, closeSheet } = useSheet();

   const project = MOCK_PROJECT;
   const [slugCopied, setSlugCopied] = useState(false);
   const [apiKeyCopied, setApiKeyCopied] = useState(false);

   const handleChangeName = () => {
      openSheet({
         children: (
            <ChangeNameSheetContent
               currentName={project.name}
               onClose={closeSheet}
            />
         ),
      });
   };

   const handleChangeTimezone = () => {
      openSheet({
         children: (
            <ChangeTimezoneSheetContent
               currentTimezone={project.timezone}
               onClose={closeSheet}
            />
         ),
      });
   };

   const handleChangeCurrency = () => {
      openSheet({
         children: (
            <ChangeCurrencySheetContent
               currentCurrency={project.currency}
               onClose={closeSheet}
            />
         ),
      });
   };

   const handleCopySlug = () => {
      navigator.clipboard.writeText(project.slug);
      setSlugCopied(true);
      toast.success("Slug copiado!");
      setTimeout(() => setSlugCopied(false), 2000);
   };

   const handleCopyApiKey = () => {
      navigator.clipboard.writeText(project.publicApiKey);
      setApiKeyCopied(true);
      toast.success("Chave de API copiada!");
      setTimeout(() => setApiKeyCopied(false), 2000);
   };

   return (
      <TooltipProvider>
         <div className="space-y-6">
            <div>
               <h1 className="text-2xl font-semibold font-serif">Geral</h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie o nome, slug e configurações padrão do projeto.
               </p>
            </div>

            <section className="space-y-3">
               <div>
                  <h2 className="text-lg font-medium">Configurações do Projeto</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Gerencie o nome, slug e configurações padrão do projeto
                  </p>
               </div>
               <ItemGroup>
                  {/* Project Name */}
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Settings2 className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Nome do Projeto</ItemTitle>
                        <ItemDescription className="truncate">
                           {project.name}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 onClick={handleChangeName}
                                 size="icon"
                                 variant="ghost"
                              >
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Editar nome</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  {/* Slug */}
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Hash className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Slug</ItemTitle>
                        <ItemDescription className="truncate font-mono">
                           {project.slug}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 onClick={handleCopySlug}
                                 size="icon"
                                 variant="ghost"
                              >
                                 {slugCopied ? (
                                    <Check className="size-4" />
                                 ) : (
                                    <Copy className="size-4" />
                                 )}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                              {slugCopied ? "Copiado!" : "Copiar slug"}
                           </TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  {/* Timezone */}
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Clock className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Fuso Horário</ItemTitle>
                        <ItemDescription className="truncate">
                           {getTimezoneLabel(project.timezone)}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 onClick={handleChangeTimezone}
                                 size="icon"
                                 variant="ghost"
                              >
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Alterar fuso horário</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  {/* Currency */}
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Coins className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Moeda Padrão</ItemTitle>
                        <ItemDescription className="truncate">
                           {getCurrencyLabel(project.currency)}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 onClick={handleChangeCurrency}
                                 size="icon"
                                 variant="ghost"
                              >
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Alterar moeda</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  {/* Public API Key */}
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Key className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Chave de API Pública</ItemTitle>
                        <ItemDescription className="truncate font-mono">
                           {project.publicApiKey}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 onClick={handleCopyApiKey}
                                 size="icon"
                                 variant="ghost"
                              >
                                 {apiKeyCopied ? (
                                    <Check className="size-4" />
                                 ) : (
                                    <Copy className="size-4" />
                                 )}
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                              {apiKeyCopied ? "Copiado!" : "Copiar chave de API"}
                           </TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>
               </ItemGroup>
            </section>

            <section className="space-y-3">
               <div>
                  <h2 className="text-lg font-medium">Resumo do Projeto</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Visão geral do projeto
                  </p>
               </div>
               <ItemGroup>
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Hash className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>ID do Projeto</ItemTitle>
                        <ItemDescription className="truncate font-mono">
                           {project.id.slice(0, 8)}...
                        </ItemDescription>
                     </ItemContent>
                  </Item>

                  <ItemSeparator />

                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Calendar className="size-4" />
                     </ItemMedia>
                     <ItemContent>
                        <ItemTitle>Criado em</ItemTitle>
                        <ItemDescription>
                           {formatDate(project.createdAt)}
                        </ItemDescription>
                     </ItemContent>
                  </Item>

                  <ItemSeparator />

                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Settings2 className="size-4" />
                     </ItemMedia>
                     <ItemContent>
                        <ItemTitle>Status</ItemTitle>
                        <ItemDescription>
                           <Badge
                              className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              variant="outline"
                           >
                              Ativo
                           </Badge>
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               </ItemGroup>
            </section>
         </div>
      </TooltipProvider>
   );
}

// ============================================
// Page Component
// ============================================

function ProjectGeneralPage() {
   return (
      <ErrorBoundary FallbackComponent={ProjectGeneralErrorFallback}>
         <Suspense fallback={<ProjectGeneralSkeleton />}>
            <ProjectGeneralContent />
         </Suspense>
      </ErrorBoundary>
   );
}
