import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import TurndownService from "turndown";

// Initialize turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
   headingStyle: "atx",
   codeBlockStyle: "fenced",
   bulletListMarker: "-",
});

// Helper function to detect if content is HTML
const isHtmlContent = (content: string): boolean => {
   // Simple check for HTML tags
   return /<[^>]+>/.test(content);
};

// Helper function to convert HTML to Markdown
const convertHtmlToMarkdown = (htmlContent: string): string => {
   return turndownService.turndown(htmlContent);
};

// Helper function to process content with internal linking
const processInternalLinks = (
   content: string,
   format: "html" | "markdown" | "mdx",
) => {
   // Convert [[link]] or [[link|display text]] syntax to appropriate format
   const internalLinkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;

   return content.replace(internalLinkRegex, (_, link, displayText) => {
      const text = displayText || link;
      const slug = link
         .toLowerCase()
         .replace(/\s+/g, "-")
         .replace(/[^\w-]/g, "");

      if (format === "html") {
         return `<a href="#${slug}" class="internal-link">${text}</a>`;
      } else {
         // For markdown/mdx
         return `[${text}](#${slug})`;
      }
   });
};

export function useContentExport() {
   const exportContent = useMutation({
      mutationFn: async ({
         content,
         format,
         filename,
      }: {
         content: string;
         format: "html" | "markdown" | "mdx";
         filename: string;
      }) => {
         let processedContent = content;

         // If exporting as markdown/mdx and content is HTML, convert it first
         if (
            (format === "markdown" || format === "mdx") &&
            isHtmlContent(content)
         ) {
            processedContent = convertHtmlToMarkdown(content);
         }

         // Process internal links
         processedContent = processInternalLinks(processedContent, format);

         if (format === "markdown") {
            // Create markdown file
            const blob = new Blob([processedContent], {
               type: "text/markdown",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
         } else if (format === "mdx") {
            // Create MDX file
            const blob = new Blob([processedContent], { type: "text/mdx" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.mdx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
         } else if (format === "html") {
            // For HTML export, use the content as-is if it's already HTML, or wrap it if it's markdown
            const htmlContent = isHtmlContent(processedContent)
               ? processedContent
               : `<div>${processedContent.replace(/\n/g, "<br>")}</div>`;

            // Create HTML file with proper styling and internal link support
            const fullHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
            background: #fff;
        }
        .content {
            white-space: pre-wrap;
        }
        pre { 
            background: #f5f5f5;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        code {
            background: #f0f0f0;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .internal-link {
            color: #0066cc;
            text-decoration: none;
            border-bottom: 1px dotted #0066cc;
            transition: all 0.2s ease;
        }
        .internal-link:hover {
            text-decoration: underline;
            border-bottom-style: solid;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2em;
            margin-bottom: 0.5em;
            color: #2c3e50;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            margin: 16px 0;
            font-style: italic;
            color: #666;
        }
        ul, ol {
            padding-left: 20px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="content">${htmlContent}</div>
    <script>
        // Smooth scroll for internal links
        document.querySelectorAll('.internal-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    </script>
</body>
</html>`;
            const blob = new Blob([fullHtmlContent], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
         }
      },
      onError: () => {
         toast.error("Failed to export content");
      },
      onSuccess: (_, variables) => {
         toast.success(`Content exported as ${variables.format.toUpperCase()}`);
      },
   });

   return {
      exportContent: exportContent.mutate,
      isExporting: exportContent.isPending,
   };
}
