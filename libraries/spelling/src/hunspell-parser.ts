import type {
   AffixRule,
   ParsedAffData,
   ParsedDicData,
   ReplacementRule,
} from "./schemas.ts";

/**
 * Parse a Hunspell AFF (affix) file
 */
export function parseAffFile(content: string): ParsedAffData {
   const lines = content.split("\n");

   let encoding = "UTF-8";
   let flagType: "ASCII" | "UTF-8" | "long" | "num" = "UTF-8";
   let tryChars = "";
   const characterMaps: string[][] = [];
   const replacements: ReplacementRule[] = [];
   const prefixRules: Record<string, AffixRule[]> = {};
   const suffixRules: Record<string, AffixRule[]> = {};
   let forbiddenFlag: string | undefined;
   let noSuggestFlag: string | undefined;
   const breakPatterns: string[] = [];

   let currentAffixType: "PFX" | "SFX" | null = null;
   let currentFlag = "";
   let currentCrossProduct = false;
   let remainingRules = 0;

   for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("#")) {
         continue;
      }

      const parts = line.split(/\s+/);
      const command = parts[0];

      switch (command) {
         case "SET":
            encoding = parts[1] ?? "UTF-8";
            break;

         case "FLAG":
            flagType = (parts[1] as typeof flagType) ?? "UTF-8";
            break;

         case "TRY":
            tryChars = parts[1] ?? "";
            break;

         case "MAP": {
            // MAP can be a count line or a character mapping line
            if (parts.length === 2 && /^\d+$/.test(parts[1] ?? "")) {
               // Count line, skip
               break;
            }
            // Character mapping line
            const mapChars = parts[1];
            if (mapChars) {
               characterMaps.push([...mapChars]);
            }
            break;
         }

         case "REP": {
            // REP can be a count line or a replacement rule
            if (parts.length === 2 && /^\d+$/.test(parts[1] ?? "")) {
               // Count line, skip
               break;
            }
            // Replacement rule
            const from = parts[1];
            const to = parts[2];
            if (from !== undefined) {
               // Handle underscore as space
               const fromStr = from.replace(/_/g, " ");
               const toStr = (to ?? "").replace(/_/g, " ");
               replacements.push({ from: fromStr, to: toStr });
            }
            break;
         }

         case "BREAK": {
            // BREAK can be a count line or a pattern
            if (parts.length === 2 && /^\d+$/.test(parts[1] ?? "")) {
               // Count line, skip
               break;
            }
            const pattern = parts[1];
            if (pattern) {
               breakPatterns.push(pattern);
            }
            break;
         }

         case "FORBIDDENWORD":
            forbiddenFlag = parts[1];
            break;

         case "NOSUGGEST":
            noSuggestFlag = parts[1];
            break;

         case "PFX":
         case "SFX": {
            const flag = parts[1];
            if (!flag) break;

            // Check if this is a header line (has Y/N and count)
            if (parts.length >= 4 && (parts[2] === "Y" || parts[2] === "N")) {
               // Header line: PFX/SFX flag Y/N count
               currentAffixType = command;
               currentFlag = flag;
               currentCrossProduct = parts[2] === "Y";
               remainingRules = Number.parseInt(parts[3] ?? "0", 10);

               // Initialize the rules array for this flag
               if (command === "PFX") {
                  prefixRules[flag] = [];
               } else {
                  suffixRules[flag] = [];
               }
            } else if (
               currentAffixType === command &&
               currentFlag === flag &&
               remainingRules > 0
            ) {
               // Rule line: PFX/SFX flag strip affix [condition]
               const strip = parts[2] === "0" ? "" : (parts[2] ?? "");
               const affix = parts[3] === "0" ? "" : (parts[3] ?? "");
               const condition = parts[4] ?? null;

               const rule: AffixRule = {
                  flag,
                  crossProduct: currentCrossProduct,
                  strip,
                  affix,
                  condition,
               };

               if (command === "PFX") {
                  prefixRules[flag]?.push(rule);
               } else {
                  suffixRules[flag]?.push(rule);
               }

               remainingRules--;
            }
            break;
         }

         // Ignore other commands for now
         default:
            break;
      }
   }

   return {
      encoding,
      flagType,
      tryChars,
      characterMaps,
      replacements,
      prefixRules,
      suffixRules,
      forbiddenFlag,
      noSuggestFlag,
      breakPatterns,
   };
}

/**
 * Parse a Hunspell DIC (dictionary) file
 */
export function parseDicFile(content: string): ParsedDicData {
   const lines = content.split("\n");

   // First line should be the word count
   const firstLine = lines[0]?.trim() ?? "0";
   const wordCount = Number.parseInt(firstLine, 10) || 0;

   const words = new Map<string, string>();

   // Parse word entries starting from line 1
   for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      // Format: word/flags or just word
      const slashIndex = line.indexOf("/");
      if (slashIndex !== -1) {
         const word = line.slice(0, slashIndex);
         const flags = line.slice(slashIndex + 1);
         if (word) {
            words.set(word, flags);
         }
      } else {
         // Word without flags
         words.set(line, "");
      }
   }

   return {
      wordCount,
      words,
   };
}

/**
 * Convert a Hunspell condition pattern to a RegExp
 *
 * Hunspell conditions use a simplified pattern syntax:
 * - `.` matches any character
 * - `[abc]` matches a, b, or c
 * - `[^abc]` matches anything except a, b, or c
 *
 * For prefixes: condition matches the START of the word
 * For suffixes: condition matches the END of the word
 */
export function conditionToRegex(
   condition: string | null,
   type: "prefix" | "suffix",
): RegExp | null {
   if (!condition || condition === ".") {
      return null; // Matches everything
   }

   // Escape special regex characters except [ ] ^ -
   let pattern = condition.replace(/[$()*+.?\\{}|]/g, "\\$&");

   // Anchor the pattern
   if (type === "prefix") {
      pattern = `^${pattern}`;
   } else {
      pattern = `${pattern}$`;
   }

   try {
      return new RegExp(pattern, "u");
   } catch {
      return null;
   }
}

/**
 * Extract flags from a word entry based on flag type
 */
export function parseFlags(
   flagStr: string,
   flagType: "ASCII" | "UTF-8" | "long" | "num",
): string[] {
   if (!flagStr) return [];

   switch (flagType) {
      case "ASCII":
      case "UTF-8":
         // Each character is a flag
         return [...flagStr];

      case "long": {
         // Two-character flags
         const flags: string[] = [];
         for (let i = 0; i < flagStr.length; i += 2) {
            flags.push(flagStr.slice(i, i + 2));
         }
         return flags;
      }

      case "num":
         // Comma-separated numbers
         return flagStr.split(",");

      default:
         return [...flagStr];
   }
}
