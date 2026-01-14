import { describe, expect, it } from "bun:test";
import { parse, renderToHtml } from "../src/index";
import type { TableNode } from "../src/schemas";

// =============================================================================
// Table Parsing Test Suite
// =============================================================================

describe("Table Parsing", () => {
   // =========================================================================
   // Basic Tables
   // =========================================================================

   describe("Basic Tables", () => {
      it("should parse a simple 3-column table", () => {
         const markdown = `| Nome | Idade | Cidade |
| --- | --- | --- |
| João | 25 | São Paulo |
| Maria | 30 | Rio de Janeiro |
| Pedro | 22 | Curitiba |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.type).toBe("table");
         expect(table.children).toHaveLength(4); // 1 header + 3 data rows
         expect(table.children[0].isHeader).toBe(true);
         expect(table.children[0].children).toHaveLength(3);
      });

      it("should parse a 2-column table", () => {
         const markdown = `| Key | Value |
| --- | --- |
| name | test |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.type).toBe("table");
         expect(table.children).toHaveLength(2);
      });
   });

   // =========================================================================
   // Alignment Tests
   // =========================================================================

   describe("Alignment", () => {
      it("should parse left-aligned columns", () => {
         const markdown = `| Produto | Preço |
| :--- | :--- |
| Arroz | R$ 25,00 |
| Feijão | R$ 12,00 |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual(["left", "left"]);
      });

      it("should parse right-aligned columns", () => {
         const markdown = `| Item | Valor |
| ---: | ---: |
| Total | 100,00 |
| Desconto | 10,00 |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual(["right", "right"]);
      });

      it("should parse center-aligned columns", () => {
         const markdown = `| Status | Resultado |
| :---: | :---: |
| OK | Sucesso |
| ERRO | Falha |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual(["center", "center"]);
      });

      it("should parse mixed alignment", () => {
         const markdown = `| Nome | Quantidade | Preço | Observação |
| :--- | :---: | ---: | --- |
| Produto A | 10 | R$ 50,00 | Disponível |
| Produto B | 5 | R$ 30,00 | Em falta |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual(["left", "center", "right", null]);
      });
   });

   // =========================================================================
   // Many Columns
   // =========================================================================

   describe("Many Columns", () => {
      it("should parse table with 7+ columns", () => {
         const markdown = `| Seg | Ter | Qua | Qui | Sex | Sáb | Dom |
| --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 09:00 | 09:00 | 09:00 | 09:00 | 10:00 | Folga |
| 18:00 | 18:00 | 18:00 | 18:00 | 17:00 | 14:00 | Folga |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children[0].children).toHaveLength(7);
      });
   });

   // =========================================================================
   // Long Text Content
   // =========================================================================

   describe("Long Text Content", () => {
      it("should parse cells with long text", () => {
         const markdown = `| Título | Descrição |
| --- | --- |
| Introdução ao JavaScript | Este curso aborda os fundamentos da linguagem JavaScript, incluindo variáveis, funções, loops e estruturas de dados básicas para iniciantes em programação. |
| Programação Avançada | Tópicos avançados como closures, prototypes, async/await, generators e metaprogramação para desenvolvedores experientes. |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.type).toBe("table");
         expect(table.children).toHaveLength(3);
      });
   });

   // =========================================================================
   // Special Characters
   // =========================================================================

   describe("Special Characters", () => {
      it("should parse cells with special characters", () => {
         const markdown = `| Símbolo | Nome | Uso |
| --- | --- | --- |
| @ | Arroba | E-mail |
| # | Hashtag | Tags |
| $ | Cifrão | Dólar |
| € | Euro | Moeda EU |
| ¥ | Yen | Moeda JP |
| & | E comercial | Concatenação |
| % | Percentual | Porcentagem |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(8); // 1 header + 7 data rows
      });
   });

   // =========================================================================
   // Empty Cells
   // =========================================================================

   describe("Empty Cells", () => {
      it("should parse table with empty cells", () => {
         const markdown = `| Nome | Telefone | Email |
| --- | --- | --- |
| João | (11) 99999-9999 | joao@email.com |
| Maria | | maria@email.com |
| Pedro | (21) 88888-8888 | |
| | (31) 77777-7777 | ana@email.com |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(5);
      });
   });

   // =========================================================================
   // Numbers and Monetary Values
   // =========================================================================

   describe("Numbers and Monetary Values", () => {
      it("should parse table with monetary values", () => {
         const markdown = `| Mês | Receita | Despesa | Saldo |
| --- | ---: | ---: | ---: |
| Janeiro | R$ 15.000,00 | R$ 12.500,00 | R$ 2.500,00 |
| Fevereiro | R$ 18.250,50 | R$ 14.100,25 | R$ 4.150,25 |
| Março | R$ 22.100,75 | R$ 16.800,00 | R$ 5.300,75 |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual([null, "right", "right", "right"]);
      });
   });

   // =========================================================================
   // URLs in Cells
   // =========================================================================

   describe("URLs in Cells", () => {
      it("should parse table with URLs", () => {
         const markdown = `| Site | URL | Status |
| --- | --- | --- |
| Google | https://www.google.com | Ativo |
| GitHub | https://github.com | Ativo |
| Exemplo | http://exemplo.com.br | Inativo |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(4);
      });
   });

   // =========================================================================
   // Inline Code in Cells
   // =========================================================================

   describe("Inline Code", () => {
      it("should parse table with inline code", () => {
         const markdown = `| Função | Sintaxe | Retorno |
| --- | --- | --- |
| Print | \`console.log()\` | void |
| Map | \`array.map(fn)\` | Array |
| Filter | \`array.filter(fn)\` | Array |
| Reduce | \`array.reduce(fn, init)\` | any |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(5);
      });
   });

   // =========================================================================
   // Single Column Tables
   // =========================================================================

   describe("Single Column Tables", () => {
      it("should parse single column table", () => {
         const markdown = `| Lista de Compras |
| --- |
| Arroz |
| Feijão |
| Macarrão |
| Óleo |
| Sal |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children[0].children).toHaveLength(1);
         expect(table.children).toHaveLength(6);
      });
   });

   // =========================================================================
   // Tables with Many Rows
   // =========================================================================

   describe("Many Rows", () => {
      it("should parse table with many rows", () => {
         const markdown = `| ID | Nome |
| --- | --- |
| 1 | Item Um |
| 2 | Item Dois |
| 3 | Item Três |
| 4 | Item Quatro |
| 5 | Item Cinco |
| 6 | Item Seis |
| 7 | Item Sete |
| 8 | Item Oito |
| 9 | Item Nove |
| 10 | Item Dez |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(11); // 1 header + 10 data rows
      });
   });

   // =========================================================================
   // Dates
   // =========================================================================

   describe("Dates", () => {
      it("should parse table with dates", () => {
         const markdown = `| Evento | Data | Hora |
| --- | --- | --- |
| Reunião | 15/01/2024 | 14:00 |
| Entrega | 2024-02-28 | 18:00 |
| Lançamento | 01 de Março de 2024 | 09:00 |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(4);
      });
   });

   // =========================================================================
   // Boolean Values
   // =========================================================================

   describe("Boolean Values", () => {
      it("should parse table with boolean values", () => {
         const markdown = `| Recurso | Gratuito | Premium |
| --- | :---: | :---: |
| Armazenamento básico | Sim | Sim |
| Backup automático | Não | Sim |
| Suporte 24h | Não | Sim |
| API acesso | Não | Sim |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual([null, "center", "center"]);
      });
   });

   // =========================================================================
   // Text Emphasis
   // =========================================================================

   describe("Text Emphasis", () => {
      it("should parse table with bold, italic, and bold-italic text", () => {
         const markdown = `| Estilo | Exemplo | Uso |
| --- | --- | --- |
| Normal | Texto normal | Padrão |
| **Negrito** | **Texto importante** | Destaque |
| *Itálico* | *Texto enfatizado* | Ênfase |
| ***Ambos*** | ***Texto muito importante*** | Máxima ênfase |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(5);
      });
   });

   // =========================================================================
   // Escaped Characters
   // =========================================================================

   describe("Escaped Characters", () => {
      it("should parse table with escaped pipes and other characters", () => {
         const markdown = `| Expressão | Significado |
| --- | --- |
| A \\| B | A ou B |
| C \\| D \\| E | C ou D ou E |
| \\-\\-\\- | Três hífens |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(4);
      });
   });

   // =========================================================================
   // Version Tables
   // =========================================================================

   describe("Version Tables", () => {
      it("should parse version comparison table", () => {
         const markdown = `| Versão | Data | Status | Notas |
| --- | --- | --- | --- |
| v1.0.0 | 01/01/2023 | Obsoleta | Lançamento inicial |
| v1.1.0 | 15/03/2023 | Obsoleta | Correções de bugs |
| v2.0.0 | 01/06/2023 | Atual | Grandes mudanças |
| v2.1.0 | 01/09/2023 | Beta | Em teste |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(5);
      });
   });

   // =========================================================================
   // Compatibility Matrices
   // =========================================================================

   describe("Compatibility Matrices", () => {
      it("should parse compatibility matrix with checkmarks", () => {
         const markdown = `| Navegador | Windows | macOS | Linux |
| --- | :---: | :---: | :---: |
| Chrome | ✓ | ✓ | ✓ |
| Firefox | ✓ | ✓ | ✓ |
| Safari | ✗ | ✓ | ✗ |
| Edge | ✓ | ✓ | ✓ |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual([null, "center", "center", "center"]);
      });
   });

   // =========================================================================
   // Minimal Spacing
   // =========================================================================

   describe("Minimal Spacing", () => {
      it("should parse table with minimal spacing", () => {
         const markdown = `|A|B|C|
|-|-|-|
|1|2|3|
|4|5|6|`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(3);
         expect(table.children[0].children).toHaveLength(3);
      });
   });

   // =========================================================================
   // Extra Spacing
   // =========================================================================

   describe("Extra Spacing", () => {
      it("should parse table with extra spacing", () => {
         const markdown = `|    Coluna A    |    Coluna B    |    Coluna C    |
|    ---    |    ---    |    ---    |
|    Valor 1    |    Valor 2    |    Valor 3    |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(2);
      });
   });

   // =========================================================================
   // Comparison Tables
   // =========================================================================

   describe("Comparison Tables", () => {
      it("should parse comparison table", () => {
         const markdown = `| Característica | Plano A | Plano B | Plano C |
| :--- | :---: | :---: | :---: |
| Preço mensal | R$ 29,90 | R$ 59,90 | R$ 99,90 |
| Usuários | 1 | 5 | Ilimitado |
| Armazenamento | 10 GB | 50 GB | 200 GB |
| Suporte | Email | Chat | Telefone 24h |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.align).toEqual(["left", "center", "center", "center"]);
      });
   });

   // =========================================================================
   // Parentheses and Brackets
   // =========================================================================

   describe("Parentheses and Brackets", () => {
      it("should parse table with parentheses and brackets", () => {
         const markdown = `| Função | Parâmetros | Exemplo |
| --- | --- | --- |
| soma(a, b) | (número, número) | soma(1, 2) |
| lista[i] | [índice] | lista[0] |
| obj{key} | {chave} | obj{"nome"} |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(4);
      });
   });

   // =========================================================================
   // Quotes
   // =========================================================================

   describe("Quotes", () => {
      it("should parse table with quotes", () => {
         const markdown = `| Tipo | Exemplo | Uso |
| --- | --- | --- |
| Aspas simples | 'texto' | Strings simples |
| Aspas duplas | "texto" | Strings com escape |
| Aspas escapadas | \\"texto\\" | Strings literais |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.children).toHaveLength(4);
      });
   });

   // =========================================================================
   // HTML Rendering Tests
   // =========================================================================

   describe("HTML Rendering", () => {
      it("should render basic table to HTML", () => {
         const markdown = `| Name | Age |
| --- | --- |
| John | 25 |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const html = renderToHtml(result.data);
         expect(html).toContain("<table>");
         expect(html).toContain("<thead>");
         expect(html).toContain("<tbody>");
         expect(html).toContain("<th>");
         expect(html).toContain("<td>");
         expect(html).toContain("Name");
         expect(html).toContain("John");
      });

      it("should render alignment as inline styles", () => {
         const markdown = `| Left | Center | Right |
| :--- | :---: | ---: |
| L | C | R |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const html = renderToHtml(result.data);
         expect(html).toContain('style="text-align: left"');
         expect(html).toContain('style="text-align: center"');
         expect(html).toContain('style="text-align: right"');
      });

      it("should render inline formatting within cells", () => {
         const markdown = `| Format | Example |
| --- | --- |
| Bold | **text** |
| Code | \`code\` |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const html = renderToHtml(result.data);
         expect(html).toContain("<strong>text</strong>");
         expect(html).toContain("<code>code</code>");
      });
   });

   // =========================================================================
   // Edge Cases
   // =========================================================================

   describe("Edge Cases", () => {
      it("should not parse table without delimiter row", () => {
         const markdown = `| A | B |
| C | D |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         // Should parse as paragraphs, not a table
         const firstChild = result.data.root.children[0];
         expect(firstChild.type).not.toBe("table");
      });

      it("should handle table followed by other content", () => {
         const markdown = `| A | B |
| --- | --- |
| 1 | 2 |

Regular paragraph after table.`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         expect(result.data.root.children).toHaveLength(2);
         expect(result.data.root.children[0].type).toBe("table");
         expect(result.data.root.children[1].type).toBe("paragraph");
      });

      it("should handle table with mismatched column counts", () => {
         const markdown = `| A | B | C |
| --- | --- | --- |
| 1 | 2 |
| 3 | 4 | 5 | 6 |`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.type).toBe("table");
         // Parser should handle mismatched columns gracefully
      });

      it("should handle table without leading pipe", () => {
         const markdown = `A | B | C
--- | --- | ---
1 | 2 | 3`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.type).toBe("table");
      });

      it("should handle table without trailing pipe", () => {
         const markdown = `| A | B | C
| --- | --- | ---
| 1 | 2 | 3`;

         const result = parse(markdown);
         expect(result.success).toBe(true);
         if (!result.success) return;

         const table = result.data.root.children[0] as TableNode;
         expect(table.type).toBe("table");
      });
   });
});
