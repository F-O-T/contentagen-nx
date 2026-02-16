"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "../lib/utils";

interface CodeBlockProps {
   code: string;
   language?: string;
   className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
   const [copied, setCopied] = useState(false);

   const handleCopy = useCallback(async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   }, [code]);

   return (
      <div
         className={cn(
            "relative rounded-lg bg-zinc-950 text-zinc-100 text-sm dark:bg-zinc-900",
            className,
         )}
      >
         <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
            {language ? (
               <span className="text-xs text-zinc-400">{language}</span>
            ) : (
               <span />
            )}
            <button
               className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
               onClick={handleCopy}
               type="button"
            >
               {copied ? (
                  <>
                     <Check className="size-3.5" />
                     <span>Copiado</span>
                  </>
               ) : (
                  <>
                     <Copy className="size-3.5" />
                     <span>Copiar</span>
                  </>
               )}
            </button>
         </div>
         <pre className="overflow-x-auto p-4">
            <code className="font-mono text-sm">{code}</code>
         </pre>
      </div>
   );
}
