import { Combobox } from "@packages/ui/components/combobox";
import { useMemo } from "react";

interface LanguageCommandProps {
   compact?: boolean;
}

export function LanguageCommand({ compact = false }: LanguageCommandProps) {
   const languageOptions = useMemo(
      () => [
         {
            flag: "🇧🇷",
            name: "Português",
            value: "pt-BR",
         },
      ],
      [],
   );

   const comboboxOptions = useMemo(
      () =>
         languageOptions.map((option) => ({
            label: compact ? option.flag : `${option.flag} ${option.name}`,
            value: option.value,
         })),
      [languageOptions, compact],
   );

   return (
      <Combobox
         className="gap-2 flex items-center justify-center"
         emptyMessage="Nenhum idioma encontrado."
         onValueChange={() => {
            // Only Portuguese supported
         }}
         options={comboboxOptions}
         searchPlaceholder="Pesquisar idiomas..."
         value="pt-BR"
      />
   );
}
