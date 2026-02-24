import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { getInitials } from "@packages/utils/text";
import { Ellipsis, Loader2, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { WriterInstructionsSection } from "./writer-instructions-section";
import { WriterPhotoUpload } from "./writer-photo-upload";
import { WriterContentSection, type ContentItem } from "./writer-content-section";

type WriterTab = "identidade" | "memoria" | "conteudo";

interface WriterBuilderProps {
   name: string;
   onNameChange: (name: string) => void;
   description: string;
   onDescriptionChange: (description: string) => void;
   profilePhotoUrl: string | null;
   onSave: () => void;
   isSaving: boolean;
   onDelete?: () => void;
   writerId?: string;
   instructions?: InstructionMemoryItem[];
   recentContent?: ContentItem[];
   contentCount?: number;
}

export function WriterBuilder({
   name,
   onNameChange,
   description,
   onDescriptionChange,
   profilePhotoUrl,
   onSave,
   isSaving,
   onDelete,
   writerId,
   instructions,
   recentContent,
   contentCount,
}: WriterBuilderProps) {
   const [activeTab, setActiveTab] = useState<WriterTab>("identidade");

   const tabs = [
      { id: "identidade" as const, label: "Identidade" },
      ...(writerId ? [{ id: "memoria" as const, label: "Memória" }] : []),
      ...(writerId ? [{ id: "conteudo" as const, label: "Conteúdo" }] : []),
   ];

   const activeInstructionCount = instructions?.filter((i) => i.enabled).length ?? 0;

   return (
      <main className="flex flex-col">
         {/* Mobile identity bar — visible only on small screens */}
         {writerId && (
            <div className="flex items-center gap-3 pb-4 border-b md:hidden">
               <Avatar className="size-10 rounded-lg shrink-0">
                  <AvatarImage alt={name} src={profilePhotoUrl ?? undefined} />
                  <AvatarFallback className="rounded-lg text-sm font-medium">
                     {getInitials(name)}
                  </AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0">
                  {name && <p className="text-sm font-semibold truncate">{name}</p>}
                  <p className="text-xs text-muted-foreground">
                     {activeInstructionCount} {activeInstructionCount !== 1 ? "instruções" : "instrução"} ativas · {contentCount ?? 0} conteúdo{(contentCount ?? 0) !== 1 ? "s" : ""}
                  </p>
               </div>
            </div>
         )}

         {/* Content area: sidebar + main */}
         <div className="flex flex-1">
            {/* Sidebar — hidden on mobile, visible on md+ */}
            {writerId && (
               <aside className="hidden md:flex flex-col w-56 shrink-0 border-r py-4 pr-4 space-y-5">
                  {/* Identity */}
                  <div className="flex flex-col items-center gap-3 text-center">
                     <Avatar className="size-20 rounded-xl">
                        <AvatarImage alt={name} src={profilePhotoUrl ?? undefined} />
                        <AvatarFallback className="rounded-xl text-base font-semibold">
                           {getInitials(name)}
                        </AvatarFallback>
                     </Avatar>
                     {name && (
                        <p className="text-sm font-medium truncate w-full">{name}</p>
                     )}
                  </div>

                  {/* Stats */}
                  <div className="border-t pt-4 space-y-2.5">
                     <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Instruções ativas</span>
                        <span className="text-xs font-medium tabular-nums">{activeInstructionCount}</span>
                     </div>
                     {contentCount !== undefined && (
                        <div className="flex items-center justify-between gap-2">
                           <span className="text-xs text-muted-foreground">Conteúdos gerados</span>
                           <span className="text-xs font-medium tabular-nums">{contentCount}</span>
                        </div>
                     )}
                  </div>
               </aside>
            )}

            {/* Main content */}
            <div className="flex flex-col flex-1 min-w-0">
               {/* Tab bar + actions */}
               <div
                  className={cn(
                     "flex items-center justify-between border-b",
                     writerId && "md:pl-4",
                  )}
               >
                  <div className="flex items-center overflow-x-auto flex-1 min-w-0" role="tablist">
                     {tabs.map((tab) => (
                        <Button
                           aria-selected={activeTab === tab.id}
                           className={cn(
                              "px-4 py-4 h-auto rounded-none border-b-2 text-sm font-medium shrink-0",
                              activeTab === tab.id
                                 ? "border-primary text-primary"
                                 : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50",
                           )}
                           id={`tab-${tab.id}`}
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           role="tab"
                           variant="ghost"
                        >
                           {tab.label}
                        </Button>
                     ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pr-4 shrink-0">
                     <Button disabled={isSaving} onClick={onSave} size="sm">
                        {isSaving ? (
                           <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                           <>
                              <Save className="size-3.5" />
                              <span className="hidden sm:inline">Salvar</span>
                           </>
                        )}
                     </Button>
                     {onDelete && (
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button size="icon-sm" variant="outline">
                                 <Ellipsis className="size-3.5" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onClick={onDelete}
                              >
                                 <Trash2 />
                                 Excluir escritor
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     )}
                  </div>
               </div>

               {/* Tab content */}
               <div className={cn(writerId && "md:px-4")}>
                  {activeTab === "identidade" && (
                     <div aria-labelledby="tab-identidade" id="tabpanel-identidade" role="tabpanel" tabIndex={0}>
                        {writerId ? (
                           /* Single column on mobile/tablet, two-column on lg+ */
                           <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-x-10">
                              <div className="col-span-1 lg:col-span-2 divide-y">
                                 <section className="space-y-3 py-4">
                                    <div className="space-y-0.5">
                                       <Label className="text-sm font-medium" htmlFor="writer-name">Nome</Label>
                                       <p className="text-xs text-muted-foreground">
                                          Nome público do escritor.
                                       </p>
                                    </div>
                                    <Input
                                       id="writer-name"
                                       onChange={(e) => onNameChange(e.target.value)}
                                       placeholder="Ex: Rafael Técnico"
                                       value={name}
                                    />
                                 </section>

                                 <section className="space-y-3 py-4">
                                    <div className="space-y-0.5">
                                       <Label className="text-sm font-medium" htmlFor="writer-description">Persona</Label>
                                       <p className="text-xs text-muted-foreground">
                                          Descreva quem é este escritor: audiência, expertise, estilo, o que ele evita. Injetada em cada geração como contexto de identidade.
                                       </p>
                                    </div>
                                    <Textarea
                                       className="min-h-[160px] resize-none"
                                       id="writer-description"
                                       onChange={(e) => onDescriptionChange(e.target.value)}
                                       placeholder="Ex: Rafael é um DevRel sênior escrevendo para desenvolvedores intermediários. Usa exemplos em TypeScript. Prefere frases curtas e nunca usa voz passiva. Cita documentação oficial quando possível."
                                       value={description}
                                    />
                                 </section>
                              </div>

                              {/* Photo upload — stacks below on mobile, right column on lg+ */}
                              <div className="py-4 space-y-3 border-t lg:border-t-0 lg:border-l lg:pl-4">
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Foto de perfil</p>
                                    <p className="text-xs text-muted-foreground">
                                       Aparece nos seletores de escritor. PNG, JPG, WEBP — máx. 5 MB.
                                    </p>
                                 </div>
                                 <WriterPhotoUpload
                                    currentPhotoUrl={profilePhotoUrl}
                                    writerId={writerId}
                                    writerName={name}
                                 />
                              </div>
                           </div>
                        ) : (
                           /* Single column for new writer */
                           <div className="divide-y">
                              <section className="space-y-3 py-4">
                                 <div className="space-y-0.5">
                                    <Label className="text-sm font-medium" htmlFor="writer-name">Nome</Label>
                                    <p className="text-xs text-muted-foreground">
                                       Nome público do escritor.
                                    </p>
                                 </div>
                                 <Input
                                    className="max-w-md"
                                    id="writer-name"
                                    onChange={(e) => onNameChange(e.target.value)}
                                    placeholder="Ex: Rafael Técnico"
                                    value={name}
                                 />
                              </section>

                              <section className="space-y-3 py-4">
                                 <div className="space-y-0.5">
                                    <Label className="text-sm font-medium" htmlFor="writer-description">Persona</Label>
                                    <p className="text-xs text-muted-foreground">
                                       Descreva quem é este escritor: audiência, expertise, estilo, o que ele evita. Injetada em cada geração como contexto de identidade.
                                    </p>
                                 </div>
                                 <Textarea
                                    className="max-w-2xl min-h-[140px] resize-none"
                                    id="writer-description"
                                    onChange={(e) => onDescriptionChange(e.target.value)}
                                    placeholder="Ex: Rafael é um DevRel sênior escrevendo para desenvolvedores intermediários. Usa exemplos em TypeScript. Prefere frases curtas e nunca usa voz passiva. Cita documentação oficial quando possível."
                                    value={description}
                                 />
                              </section>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === "memoria" && writerId && (
                     <div aria-labelledby="tab-memoria" id="tabpanel-memoria" role="tabpanel" tabIndex={0}>
                        <WriterInstructionsSection
                           instructions={instructions ?? []}
                           writerId={writerId}
                        />
                     </div>
                  )}

                  {activeTab === "conteudo" && writerId && (
                     <div aria-labelledby="tab-conteudo" id="tabpanel-conteudo" role="tabpanel" tabIndex={0}>
                        <WriterContentSection
                           contentCount={contentCount ?? 0}
                           recentContent={recentContent ?? []}
                        />
                     </div>
                  )}
               </div>
            </div>
         </div>
      </main>
   );
}
