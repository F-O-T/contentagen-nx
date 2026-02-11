import { Button } from "@packages/ui/components/button";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Event catalog — static list of all known events grouped by category
// ---------------------------------------------------------------------------

interface EventOption {
   value: string;
   label: string;
   category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
   content: "Conteúdo",
   ai: "IA",
   form: "Formulário",
   seo: "SEO",
   experiment: "Experimento",
   webhook: "Webhook",
   sdk: "SDK",
};

const ALL_EVENTS: EventOption[] = [
   // Content
   {
      value: "content.page.view",
      label: "Visualização de página",
      category: "content",
   },
   {
      value: "content.page.published",
      label: "Conteúdo publicado",
      category: "content",
   },
   {
      value: "content.page.updated",
      label: "Conteúdo atualizado",
      category: "content",
   },
   { value: "content.created", label: "Conteúdo criado", category: "content" },
   {
      value: "content.deleted",
      label: "Conteúdo excluído",
      category: "content",
   },
   {
      value: "content.scroll.milestone",
      label: "Marco de rolagem",
      category: "content",
   },
   { value: "content.time.spent", label: "Tempo gasto", category: "content" },
   { value: "content.cta.click", label: "Clique em CTA", category: "content" },
   {
      value: "content.exported",
      label: "Conteúdo exportado",
      category: "content",
   },
   {
      value: "content.archived",
      label: "Conteúdo arquivado",
      category: "content",
   },
   // AI
   { value: "ai.completion", label: "Completion de IA", category: "ai" },
   { value: "ai.chat_message", label: "Mensagem de chat IA", category: "ai" },
   { value: "ai.agent_action", label: "Ação de agente IA", category: "ai" },
   // Form
   {
      value: "form.impression",
      label: "Impressão de formulário",
      category: "form",
   },
   { value: "form.submitted", label: "Formulário enviado", category: "form" },
   { value: "form.field_error", label: "Erro de campo", category: "form" },
   {
      value: "form.conversion",
      label: "Conversão de formulário",
      category: "form",
   },
   { value: "form.created", label: "Formulário criado", category: "form" },
   { value: "form.updated", label: "Formulário atualizado", category: "form" },
   { value: "form.deleted", label: "Formulário excluído", category: "form" },
   // SEO
   { value: "seo.analyzed", label: "Análise SEO", category: "seo" },
   { value: "seo.indexed", label: "Indexação SEO", category: "seo" },
   // Experiment
   {
      value: "experiment.started",
      label: "Experimento iniciado",
      category: "experiment",
   },
   {
      value: "experiment.conversion",
      label: "Conversão de experimento",
      category: "experiment",
   },
   // Webhook
   {
      value: "webhook.endpoint.created",
      label: "Endpoint criado",
      category: "webhook",
   },
   {
      value: "webhook.endpoint.updated",
      label: "Endpoint atualizado",
      category: "webhook",
   },
   {
      value: "webhook.endpoint.deleted",
      label: "Endpoint excluído",
      category: "webhook",
   },
   {
      value: "webhook.delivered",
      label: "Webhook entregue",
      category: "webhook",
   },
   // SDK
   {
      value: "sdk.author.fetched",
      label: "Autor buscado (SDK)",
      category: "sdk",
   },
   {
      value: "sdk.content.listed",
      label: "Conteúdos listados (SDK)",
      category: "sdk",
   },
   {
      value: "sdk.content.fetched",
      label: "Conteúdo buscado (SDK)",
      category: "sdk",
   },
   {
      value: "sdk.image.fetched",
      label: "Imagem buscada (SDK)",
      category: "sdk",
   },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EventComboboxProps {
   value: string;
   onValueChange: (value: string) => void;
   placeholder?: string;
   className?: string;
}

export function EventCombobox({
   value,
   onValueChange,
   placeholder = "Selecione um evento...",
   className,
}: EventComboboxProps) {
   const [open, setOpen] = useState(false);
   const [search, setSearch] = useState("");

   const selectedEvent = ALL_EVENTS.find((e) => e.value === value);

   const filteredByCategory = useMemo(() => {
      const term = search.trim().toLowerCase();
      const filtered = term
         ? ALL_EVENTS.filter(
              (e) =>
                 e.value.toLowerCase().includes(term) ||
                 e.label.toLowerCase().includes(term),
           )
         : ALL_EVENTS;

      const grouped = new Map<string, EventOption[]>();
      for (const event of filtered) {
         const group = grouped.get(event.category) ?? [];
         group.push(event);
         grouped.set(event.category, group);
      }
      return grouped;
   }, [search]);

   const hasResults = filteredByCategory.size > 0;
   const isCustomValue = value && !ALL_EVENTS.some((e) => e.value === value);

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <PopoverTrigger asChild>
            <Button
               aria-expanded={open}
               className={cn(
                  "w-full justify-between font-normal truncate",
                  !value && "text-muted-foreground",
                  className,
               )}
               role="combobox"
               variant="outline"
            >
               <span className="truncate">
                  {selectedEvent
                     ? selectedEvent.label
                     : isCustomValue
                       ? value
                       : placeholder}
               </span>
               <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent align="start" className="w-[340px] p-0">
            <Command shouldFilter={false}>
               <CommandInput
                  onValueChange={setSearch}
                  placeholder="Buscar evento..."
                  value={search}
               />
               <CommandList className="max-h-[280px]">
                  {!hasResults && search.trim() && (
                     <CommandEmpty>
                        <button
                           className="w-full text-left px-2 py-1.5 text-sm"
                           onClick={() => {
                              onValueChange(search.trim());
                              setSearch("");
                              setOpen(false);
                           }}
                           type="button"
                        >
                           Usar "{search.trim()}" como evento personalizado
                        </button>
                     </CommandEmpty>
                  )}
                  {!hasResults && !search.trim() && (
                     <CommandEmpty>Nenhum evento encontrado.</CommandEmpty>
                  )}
                  {Array.from(filteredByCategory.entries()).map(
                     ([category, events]) => (
                        <CommandGroup
                           heading={CATEGORY_LABELS[category] ?? category}
                           key={category}
                        >
                           {events.map((event) => (
                              <CommandItem
                                 key={event.value}
                                 onSelect={() => {
                                    onValueChange(
                                       event.value === value ? "" : event.value,
                                    );
                                    setSearch("");
                                    setOpen(false);
                                 }}
                                 value={event.value}
                              >
                                 <CheckIcon
                                    className={cn(
                                       "mr-2 size-4 shrink-0",
                                       value === event.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                    )}
                                 />
                                 <div className="flex flex-col gap-0">
                                    <span className="text-sm">
                                       {event.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                       {event.value}
                                    </span>
                                 </div>
                              </CommandItem>
                           ))}
                        </CommandGroup>
                     ),
                  )}
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
