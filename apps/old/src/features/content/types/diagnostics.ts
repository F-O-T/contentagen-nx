export type DiagnosticSeverity = "error" | "warning" | "info";
export type DiagnosticType =
   | "spelling"
   | "grammar"
   | "seo"
   | "pattern"
   | "structure"
   | "readability";

export type SpellingGrammarError = {
   id: string;
   type: "spelling" | "grammar";
   original: string;
   suggestion: string;
   offset: number;
   length: number;
   message: string;
   ignored?: boolean;
};

export type Diagnostic = {
   id: string;
   type: DiagnosticType;
   severity: DiagnosticSeverity;
   message: string;
   offset: number;
   length: number;
   original?: string;
   suggestion?: string;
};

export type DiagnosticsResult = {
   spelling: SpellingGrammarError[];
   grammar: SpellingGrammarError[];
   seo: {
      score: number;
      issues: Array<{
         type: string;
         message: string;
         severity: DiagnosticSeverity;
      }>;
   } | null;
   patterns: Array<{
      pattern: string;
      message: string;
      severity: DiagnosticSeverity;
   }>;
   readability: {
      score: number;
      level: string;
   } | null;
   checkedAt: Date;
};

export type CursorPosition = {
   line: number;
   column: number;
};

export type EditorMode = "edit" | "preview" | "diff";
