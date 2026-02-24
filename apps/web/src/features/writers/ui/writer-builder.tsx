import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { useState } from "react";
import { WriterHeader } from "./writer-header";
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

   return (
      <main className="flex flex-col">
         <WriterHeader
            description={description}
            isSaving={isSaving}
            name={name}
            onDelete={onDelete}
            onDescriptionChange={onDescriptionChange}
            onNameChange={onNameChange}
            onSave={onSave}
         />

         {/* Tab bar */}
         <div className="flex items-center border-t border-b py-1" role="tablist">
            {tabs.map((tab) => (
               <Button
                  aria-selected={activeTab === tab.id}
                  className={cn(
                     "px-4 py-2 h-auto rounded-none border-b-2 text-sm font-medium",
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

         {/* Content */}
         <div className="flex flex-col gap-4 pt-4">
            {activeTab === "identidade" && (
               <div aria-labelledby="tab-identidade" id="tabpanel-identidade" role="tabpanel" tabIndex={0}>
                  <div className="max-w-2xl space-y-6">
                     {writerId && (
                        <Card>
                           <CardContent className="p-6">
                              <div className="space-y-4">
                                 <div>
                                    <p className="text-sm font-medium">Foto de perfil</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                       Aparece nos seletores de escritor. PNG, JPG, WEBP — máx. 5 MB.
                                    </p>
                                 </div>
                                 <WriterPhotoUpload
                                    currentPhotoUrl={profilePhotoUrl}
                                    writerId={writerId}
                                    writerName={name}
                                 />
                              </div>
                           </CardContent>
                        </Card>
                     )}

                     <Card>
                        <CardContent className="p-6 space-y-5">
                           <div className="space-y-1.5">
                              <Label htmlFor="writer-name">Nome</Label>
                              <Input
                                 id="writer-name"
                                 onChange={(e) => onNameChange(e.target.value)}
                                 placeholder="Ex: Rafael Técnico"
                                 value={name}
                              />
                           </div>
                           <div className="space-y-1.5">
                              <Label htmlFor="writer-description">Persona</Label>
                              <p className="text-xs text-muted-foreground">
                                 Descreva quem é este escritor: audiência, expertise, estilo, o que ele evita. Esta descrição é injetada em cada geração como contexto de identidade.
                              </p>
                              <Textarea
                                 className="min-h-[140px] resize-none"
                                 id="writer-description"
                                 onChange={(e) => onDescriptionChange(e.target.value)}
                                 placeholder="Ex: Rafael é um DevRel sênior escrevendo para desenvolvedores intermediários. Usa exemplos em TypeScript. Prefere frases curtas e nunca usa voz passiva. Cita documentação oficial quando possível."
                                 value={description}
                              />
                           </div>
                        </CardContent>
                     </Card>
                  </div>
               </div>
            )}

            {activeTab === "memoria" && writerId && (
               <div aria-labelledby="tab-memoria" id="tabpanel-memoria" role="tabpanel" tabIndex={0}>
                  <div className="max-w-2xl">
                     <WriterInstructionsSection
                        instructions={instructions ?? []}
                        writerId={writerId}
                     />
                  </div>
               </div>
            )}

            {activeTab === "conteudo" && writerId && (
               <div aria-labelledby="tab-conteudo" id="tabpanel-conteudo" role="tabpanel" tabIndex={0}>
                  <div className="max-w-4xl">
                     <WriterContentSection
                        contentCount={contentCount ?? 0}
                        recentContent={recentContent ?? []}
                     />
                  </div>
               </div>
            )}
         </div>
      </main>
   );
}
