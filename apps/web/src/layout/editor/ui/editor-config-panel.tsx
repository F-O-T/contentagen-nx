/**
 * Painel de configuracoes do editor.
 * Configuracoes para:
 * - FIM: habilitar/desabilitar, delay, threshold
 * - Edit: keybinds, comportamento
 * - Markdown Preview: estilo de renderizacao
 * - Tema do editor
 */

import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { Slider } from "@packages/ui/components/slider";
import { Switch } from "@packages/ui/components/switch";
import { cn } from "@packages/ui/lib/utils";
import {
   FileText,
   GripVertical,
   Keyboard,
   Settings,
   Sparkles,
   X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
   setConfigPanelOpen,
   setConfigPanelWidth,
   setEditorConfig,
   useConfigPanel,
   useConfigPanelWidth,
   useEditorConfig,
} from "../hooks/use-editor-state";

interface EditorConfigPanelProps {
   className?: string;
}

export function EditorConfigPanel({ className }: EditorConfigPanelProps) {
   const isOpen = useConfigPanel();
   const config = useEditorConfig();
   const panelWidth = useConfigPanelWidth();
   const [isResizing, setIsResizing] = useState(false);
   const resizeStartX = useRef(0);
   const resizeStartWidth = useRef(0);

   const handleResizeStart = useCallback(
      (e: React.MouseEvent) => {
         e.preventDefault();
         setIsResizing(true);
         resizeStartX.current = e.clientX;
         resizeStartWidth.current = panelWidth;
      },
      [panelWidth],
   );

   useEffect(() => {
      if (!isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
         const delta = resizeStartX.current - e.clientX;
         setConfigPanelWidth(resizeStartWidth.current + delta);
      };

      const handleMouseUp = () => {
         setIsResizing(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
         document.removeEventListener("mousemove", handleMouseMove);
         document.removeEventListener("mouseup", handleMouseUp);
      };
   }, [isResizing]);

   if (!isOpen) return null;

   return (
      <div
         className={cn(
            "flex flex-col h-full border-l bg-background relative",
            className,
         )}
         style={{ width: panelWidth }}
      >
         <button
            className={cn(
               "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors flex items-center justify-center",
               isResizing && "bg-primary/30",
            )}
            onMouseDown={handleResizeStart}
            type="button"
         >
            <GripVertical className="size-3 text-muted-foreground/50 absolute" />
         </button>

         <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
               <Settings className="size-4" />
               <span className="font-medium">Configuracoes</span>
            </div>
            <Button
               className="size-7"
               onClick={() => setConfigPanelOpen(false)}
               size="icon"
               variant="ghost"
            >
               <X className="size-4" />
            </Button>
         </div>

         <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-53px)]">
            <ConfigSection
               description="Sugestoes de texto enquanto voce digita"
               icon={<Sparkles className="size-4" />}
               title="Autocompletar (FIM)"
            >
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <Label className="text-sm" htmlFor="fim-enabled">
                        Habilitar
                     </Label>
                     <Switch
                        checked={config.fimEnabled}
                        id="fim-enabled"
                        onCheckedChange={(enabled) =>
                           setEditorConfig({ fimEnabled: enabled })
                        }
                     />
                  </div>

                  {config.fimEnabled && (
                     <>
                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <Label className="text-sm">Delay (ms)</Label>
                              <span className="text-xs text-muted-foreground">
                                 {config.fimDebounceMs}ms
                              </span>
                           </div>
                           <Slider
                              className="w-full"
                              max={2000}
                              min={100}
                              onValueChange={(value) =>
                                 setEditorConfig({
                                    fimDebounceMs: value[0] ?? 500,
                                 })
                              }
                              step={100}
                              value={[config.fimDebounceMs]}
                           />
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <Label className="text-sm">
                                 Confianca minima
                              </Label>
                              <span className="text-xs text-muted-foreground">
                                 {Math.round(
                                    config.fimConfidenceThreshold * 100,
                                 )}
                                 %
                              </span>
                           </div>
                           <Slider
                              className="w-full"
                              max={100}
                              min={20}
                              onValueChange={(value) =>
                                 setEditorConfig({
                                    fimConfidenceThreshold:
                                       (value[0] ?? 60) / 100,
                                 })
                              }
                              step={5}
                              value={[
                                 Math.round(
                                    config.fimConfidenceThreshold * 100,
                                 ),
                              ]}
                           />
                        </div>
                     </>
                  )}
               </div>
            </ConfigSection>

            <ConfigSection
               description="Edite texto selecionado com instrucoes"
               icon={<Keyboard className="size-4" />}
               title="Edicao com IA (Ctrl+K)"
            >
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <Label className="text-sm" htmlFor="edit-enabled">
                        Habilitar
                     </Label>
                     <Switch
                        checked={config.editEnabled}
                        id="edit-enabled"
                        onCheckedChange={(enabled) =>
                           setEditorConfig({ editEnabled: enabled })
                        }
                     />
                  </div>

                  {config.editEnabled && (
                     <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/50 rounded-md p-2">
                        <div className="flex items-center justify-between">
                           <span>Abrir edicao</span>
                           <kbd className="px-1.5 py-0.5 bg-muted rounded">
                              Ctrl+K
                           </kbd>
                        </div>
                        <div className="flex items-center justify-between">
                           <span>Aceitar</span>
                           <kbd className="px-1.5 py-0.5 bg-muted rounded">
                              Ctrl+Enter
                           </kbd>
                        </div>
                        <div className="flex items-center justify-between">
                           <span>Cancelar</span>
                           <kbd className="px-1.5 py-0.5 bg-muted rounded">
                              Esc
                           </kbd>
                        </div>
                     </div>
                  )}
               </div>
            </ConfigSection>

            <ConfigSection
               description="Destacar erros de ortografia"
               icon={<FileText className="size-4" />}
               title="Verificacao ortografica"
            >
               <div className="flex items-center justify-between">
                  <Label className="text-sm" htmlFor="spelling-enabled">
                     Habilitar
                  </Label>
                  <Switch
                     checked={config.spellingEnabled}
                     id="spelling-enabled"
                     onCheckedChange={(enabled) =>
                        setEditorConfig({ spellingEnabled: enabled })
                     }
                  />
               </div>
            </ConfigSection>

            <ConfigSection
               icon={<Keyboard className="size-4" />}
               title="Atalhos de teclado"
            >
               <div className="text-xs text-muted-foreground space-y-1.5 bg-muted/50 rounded-md p-2">
                  <div className="flex items-center justify-between">
                     <span>Salvar</span>
                     <kbd className="px-1.5 py-0.5 bg-muted rounded">
                        Ctrl+S
                     </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                     <span>Command Palette</span>
                     <kbd className="px-1.5 py-0.5 bg-muted rounded">
                        Ctrl+Shift+P
                     </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                     <span>Toggle Chat</span>
                     <kbd className="px-1.5 py-0.5 bg-muted rounded">
                        Ctrl+B
                     </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                     <span>Modo Zen</span>
                     <kbd className="px-1.5 py-0.5 bg-muted rounded">
                        Ctrl+Shift+Z
                     </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                     <span>Aceitar FIM</span>
                     <kbd className="px-1.5 py-0.5 bg-muted rounded">Tab</kbd>
                  </div>
               </div>
            </ConfigSection>
         </div>
      </div>
   );
}

interface ConfigSectionProps {
   icon: React.ReactNode;
   title: string;
   description?: string;
   children: React.ReactNode;
}

function ConfigSection({
   icon,
   title,
   description,
   children,
}: ConfigSectionProps) {
   return (
      <div className="space-y-3">
         <div className="flex items-start gap-2">
            <div className="text-muted-foreground mt-0.5">{icon}</div>
            <div>
               <h3 className="text-sm font-medium">{title}</h3>
               {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
               )}
            </div>
         </div>
         <div className="pl-6">{children}</div>
      </div>
   );
}
