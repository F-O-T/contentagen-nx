// ──────────────────────────────────────────────
// Token Types
// ──────────────────────────────────────────────

interface NumberToken {
   type: "number";
   value: number;
}

interface VariableToken {
   type: "variable";
   name: string;
}

interface OperatorToken {
   type: "operator";
   value: "+" | "-" | "*" | "/";
}

interface LParenToken {
   type: "lparen";
}

interface RParenToken {
   type: "rparen";
}

type Token =
   | NumberToken
   | VariableToken
   | OperatorToken
   | LParenToken
   | RParenToken;

// ──────────────────────────────────────────────
// AST Node Types
// ──────────────────────────────────────────────

interface NumberNode {
   type: "number";
   value: number;
}

interface VariableNode {
   type: "variable";
   name: string;
}

interface BinaryNode {
   type: "binary";
   op: "+" | "-" | "*" | "/";
   left: ASTNode;
   right: ASTNode;
}

type ASTNode = NumberNode | VariableNode | BinaryNode;

// ──────────────────────────────────────────────
// Tokenizer
// ──────────────────────────────────────────────

function tokenize(formula: string): Token[] {
   const tokens: Token[] = [];
   const chars = [...formula];
   let i = 0;

   while (i < chars.length) {
      const ch = chars[i] as string;

      // Skip whitespace
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
         i++;
         continue;
      }

      // Number (integer or decimal)
      if (ch >= "0" && ch <= "9") {
         let numStr = "";
         while (i < chars.length) {
            const c = chars[i] as string;
            if ((c >= "0" && c <= "9") || c === ".") {
               numStr += c;
               i++;
            } else {
               break;
            }
         }
         const value = Number.parseFloat(numStr);
         if (Number.isNaN(value)) {
            throw new Error(`Invalid number: ${numStr}`);
         }
         tokens.push({ type: "number", value });
         continue;
      }

      // Variable (single uppercase letter A-Z)
      if (ch >= "A" && ch <= "Z") {
         tokens.push({ type: "variable", name: ch });
         i++;
         continue;
      }

      // Operators
      if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
         tokens.push({ type: "operator", value: ch });
         i++;
         continue;
      }

      // Parentheses
      if (ch === "(") {
         tokens.push({ type: "lparen" });
         i++;
         continue;
      }

      if (ch === ")") {
         tokens.push({ type: "rparen" });
         i++;
         continue;
      }

      throw new Error(`Unexpected character: '${ch}' at position ${i}`);
   }

   return tokens;
}

// ──────────────────────────────────────────────
// Parser (Recursive Descent)
// ──────────────────────────────────────────────

class Parser {
   private tokens: Token[];
   private pos: number;

   constructor(tokens: Token[]) {
      this.tokens = tokens;
      this.pos = 0;
   }

   private peek(): Token | undefined {
      return this.tokens[this.pos];
   }

   parse(): ASTNode {
      const node = this.parseExpression();
      const remaining = this.peek();
      if (remaining !== undefined) {
         throw new Error(
            `Unexpected token at position ${this.pos}: ${JSON.stringify(remaining)}`,
         );
      }
      return node;
   }

   /** Handles + and - (low precedence) */
   private parseExpression(): ASTNode {
      let left = this.parseTerm();

      while (this.pos < this.tokens.length) {
         const token = this.peek();
         if (
            token !== undefined &&
            token.type === "operator" &&
            (token.value === "+" || token.value === "-")
         ) {
            const op = token.value;
            this.pos++;
            const right = this.parseTerm();
            left = { type: "binary", op, left, right };
         } else {
            break;
         }
      }

      return left;
   }

   /** Handles * and / (high precedence) */
   private parseTerm(): ASTNode {
      let left = this.parseFactor();

      while (this.pos < this.tokens.length) {
         const token = this.peek();
         if (
            token !== undefined &&
            token.type === "operator" &&
            (token.value === "*" || token.value === "/")
         ) {
            const op = token.value;
            this.pos++;
            const right = this.parseFactor();
            left = { type: "binary", op, left, right };
         } else {
            break;
         }
      }

      return left;
   }

   /** Handles numbers, variables, and parenthesized sub-expressions */
   private parseFactor(): ASTNode {
      const token = this.peek();

      if (token === undefined) {
         throw new Error("Unexpected end of expression");
      }

      if (token.type === "number") {
         this.pos++;
         return { type: "number", value: token.value };
      }

      if (token.type === "variable") {
         this.pos++;
         return { type: "variable", name: token.name };
      }

      if (token.type === "lparen") {
         this.pos++; // consume '('
         const node = this.parseExpression();
         const closing = this.peek();
         if (closing === undefined || closing.type !== "rparen") {
            throw new Error("Expected closing parenthesis");
         }
         this.pos++; // consume ')'
         return node;
      }

      throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
   }
}

// ──────────────────────────────────────────────
// Evaluator
// ──────────────────────────────────────────────

function evaluate(
   node: ASTNode,
   values: Record<string, number>,
): number | null {
   switch (node.type) {
      case "number":
         return node.value;

      case "variable": {
         const val = values[node.name];
         if (val === undefined) {
            throw new Error(`Variable ${node.name} is not defined`);
         }
         return val;
      }

      case "binary": {
         const left = evaluate(node.left, values);
         const right = evaluate(node.right, values);

         if (left === null || right === null) {
            return null;
         }

         switch (node.op) {
            case "+":
               return left + right;
            case "-":
               return left - right;
            case "*":
               return left * right;
            case "/":
               return right === 0 ? null : left / right;
         }
      }
   }
}

// ──────────────────────────────────────────────
// Exported Functions
// ──────────────────────────────────────────────

/**
 * Evaluates a formula string with the given variable values.
 * Returns the numeric result, or null on division by zero.
 *
 * @example
 * evaluateFormula("A/B*100", { A: 150, B: 30 }) // 500
 * evaluateFormula("(A-B)/A", { A: 100, B: 75 }) // 0.25
 * evaluateFormula("A/B", { A: 10, B: 0 }) // null
 */
export function evaluateFormula(
   formula: string,
   values: Record<string, number>,
): number | null {
   const tokens = tokenize(formula);
   const parser = new Parser(tokens);
   const ast = parser.parse();
   return evaluate(ast, values);
}

/**
 * Validates a formula string against the available series count.
 * Returns null if valid, or an error message string if invalid.
 *
 * @example
 * validateFormula("A/B*100", 3) // null (valid)
 * validateFormula("A/C", 2)     // "Variable C references series 3, but only 2 series are available"
 * validateFormula("A/", 2)      // "Unexpected end of expression"
 */
export function validateFormula(
   formula: string,
   seriesCount: number,
): string | null {
   try {
      const tokens = tokenize(formula);

      if (tokens.length === 0) {
         return "Formula is empty";
      }

      const parser = new Parser(tokens);
      parser.parse();

      // Check that all variable references are within the series count
      for (const token of tokens) {
         if (token.type === "variable") {
            const index = token.name.charCodeAt(0) - "A".charCodeAt(0);
            if (index >= seriesCount) {
               return `Variable ${token.name} references series ${index + 1}, but only ${seriesCount} series are available`;
            }
         }
      }

      return null;
   } catch (error) {
      if (error instanceof Error) {
         return error.message;
      }
      return "Invalid formula";
   }
}
