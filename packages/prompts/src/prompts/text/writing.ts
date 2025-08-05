export function writingInputPrompt(
   brandDocument: string,
   webSearchContent: string,
   input: string,
): string {
   return `

You are an expert content writer tasked with creating high-quality, engaging content. Your writing should reflect the brand's identity and values, while also being tailored to the target audience.

---BRAND_DOCUMENT_START---

${brandDocument}

---BRAND_DOCUMENT_END---

---WEB_SEARCH_CONTENT_START---

${webSearchContent}

---WEB_SEARCH_CONTENT_END---

---REQUEST_START---

${input}

---REQUEST_END---
`;
}
