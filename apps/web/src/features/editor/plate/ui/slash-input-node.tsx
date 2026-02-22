"use client";

import {
   InlineCombobox,
   InlineComboboxContent,
   InlineComboboxEmpty,
   InlineComboboxGroup,
   InlineComboboxGroupLabel,
   InlineComboboxInput,
   InlineComboboxItem,
} from "@packages/ui/components/inline-combobox";
import { AIChatPlugin } from "@platejs/ai/react";
import { toggleList } from "@platejs/list";
import { insertTable } from "@platejs/table";
import {
   BotIcon,
   Heading1Icon,
   Heading2Icon,
   Heading3Icon,
   ListIcon,
   ListOrderedIcon,
   ListTodoIcon,
   MinusIcon,
   PilcrowIcon,
   SparklesIcon,
   TableIcon,
   TextIcon,
} from "lucide-react";
import { KEYS } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { PlateElement, useEditorRef } from "platejs/react";
import * as React from "react";

type SlashCommandItem = {
   group: string;
   icon: React.ReactNode;
   keywords?: string[];
   label: string;
   value: string;
   onSelect: (editor: ReturnType<typeof useEditorRef>) => void;
};

const SLASH_ITEMS: SlashCommandItem[] = [
   // Texto
   {
      group: "Texto",
      icon: <PilcrowIcon />,
      keywords: ["parágrafo", "texto", "normal", "paragraph", "text", "p"],
      label: "Parágrafo",
      value: "Parágrafo",
      onSelect: (editor) => {
         editor.tf.setNodes(
            { type: KEYS.p },
            { match: (n) => editor.api.isBlock(n) },
         );
      },
   },
   {
      group: "Texto",
      icon: <Heading1Icon />,
      keywords: ["h1", "título 1", "heading 1", "title 1", "cabeçalho"],
      label: "Título 1",
      value: "Título 1",
      onSelect: (editor) => {
         editor.tf.setNodes(
            { type: KEYS.h1 },
            { match: (n) => editor.api.isBlock(n) },
         );
      },
   },
   {
      group: "Texto",
      icon: <Heading2Icon />,
      keywords: ["h2", "título 2", "heading 2", "cabeçalho"],
      label: "Título 2",
      value: "Título 2",
      onSelect: (editor) => {
         editor.tf.setNodes(
            { type: KEYS.h2 },
            { match: (n) => editor.api.isBlock(n) },
         );
      },
   },
   {
      group: "Texto",
      icon: <Heading3Icon />,
      keywords: ["h3", "título 3", "heading 3", "cabeçalho"],
      label: "Título 3",
      value: "Título 3",
      onSelect: (editor) => {
         editor.tf.setNodes(
            { type: KEYS.h3 },
            { match: (n) => editor.api.isBlock(n) },
         );
      },
   },
   {
      group: "Texto",
      icon: <TextIcon />,
      keywords: ["citação", "blockquote", "quote", "recuo"],
      label: "Citação",
      value: "Citação",
      onSelect: (editor) => {
         editor.tf.setNodes(
            { type: KEYS.blockquote },
            { match: (n) => editor.api.isBlock(n) },
         );
      },
   },
   {
      group: "Texto",
      icon: <MinusIcon />,
      keywords: ["divisor", "separador", "hr", "linha", "divider", "separator"],
      label: "Separador",
      value: "Separador",
      onSelect: (editor) => {
         editor.tf.setNodes(
            { type: KEYS.hr },
            { match: (n) => editor.api.isBlock(n) },
         );
      },
   },
   // Lista
   {
      group: "Lista",
      icon: <ListIcon />,
      keywords: ["lista", "bullet", "ul", "marcadores", "unordered"],
      label: "Com marcadores",
      value: "Com marcadores",
      onSelect: (editor) => {
         toggleList(editor, { listStyleType: KEYS.ul });
      },
   },
   {
      group: "Lista",
      icon: <ListOrderedIcon />,
      keywords: ["lista numerada", "numbered", "ol", "decimal", "ordered"],
      label: "Numerada",
      value: "Numerada",
      onSelect: (editor) => {
         toggleList(editor, { listStyleType: KEYS.ol });
      },
   },
   {
      group: "Lista",
      icon: <ListTodoIcon />,
      keywords: ["tarefas", "todo", "checklist", "checkbox", "tarefa"],
      label: "Tarefas",
      value: "Tarefas",
      onSelect: (editor) => {
         toggleList(editor, { listStyleType: KEYS.listTodo });
      },
   },
   // Avançado
   {
      group: "Avançado",
      icon: <TableIcon />,
      keywords: ["tabela", "table", "grid", "célula"],
      label: "Tabela",
      value: "Tabela",
      onSelect: (editor) => {
         insertTable(editor, { colCount: 3, rowCount: 3 });
      },
   },
   // IA
   {
      group: "IA",
      icon: <SparklesIcon />,
      keywords: ["ia", "ai", "continuar", "continue", "escrever", "gerar"],
      label: "Continuar escrevendo",
      value: "Continuar escrevendo",
      onSelect: (editor) => {
         const api = editor.getApi(AIChatPlugin).aiChat;
         api.show();
         api.submit("Continue o texto a partir do contexto atual.");
      },
   },
   {
      group: "IA",
      icon: <BotIcon />,
      keywords: ["ia", "ai", "melhorar", "improve", "reescrever", "rewrite"],
      label: "Melhorar texto",
      value: "Melhorar texto",
      onSelect: (editor) => {
         const api = editor.getApi(AIChatPlugin).aiChat;
         api.show();
         api.submit(
            "Melhore a qualidade e clareza do texto selecionado ou atual.",
         );
      },
   },
   {
      group: "IA",
      icon: <BotIcon />,
      keywords: ["ia", "ai", "resumir", "summarize", "resumo", "summary"],
      label: "Resumir",
      value: "Resumir",
      onSelect: (editor) => {
         const api = editor.getApi(AIChatPlugin).aiChat;
         api.show();
         api.submit("Faça um resumo conciso do texto selecionado ou atual.");
      },
   },
];

const GROUPS = ["Texto", "Lista", "Avançado", "IA"] as const;

export function SlashInputElement(props: PlateElementProps) {
   const { children, element } = props;
   const editor = useEditorRef();
   const [search, setSearch] = React.useState("");

   return (
      <PlateElement as="span" {...props}>
         <InlineCombobox
            element={element}
            setValue={setSearch}
            trigger="/"
            value={search}
         >
            <InlineComboboxInput />

            <InlineComboboxContent>
               <InlineComboboxEmpty>Nenhum resultado</InlineComboboxEmpty>

               {GROUPS.map((group) => {
                  const groupItems = SLASH_ITEMS.filter(
                     (item) => item.group === group,
                  );

                  return (
                     <InlineComboboxGroup key={group}>
                        <InlineComboboxGroupLabel>
                           {group}
                        </InlineComboboxGroupLabel>

                        {groupItems.map((item) => (
                           <InlineComboboxItem
                              key={item.value}
                              group={item.group}
                              keywords={item.keywords}
                              label={item.label}
                              onClick={() => item.onSelect(editor)}
                              value={item.value}
                           >
                              <span className="mr-2 text-muted-foreground [&_svg]:size-4">
                                 {item.icon}
                              </span>
                              {item.label}
                           </InlineComboboxItem>
                        ))}
                     </InlineComboboxGroup>
                  );
               })}
            </InlineComboboxContent>
         </InlineCombobox>

         {children}
      </PlateElement>
   );
}
