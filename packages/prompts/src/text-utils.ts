export function chunkText(
   text: string = "",
   maxLength = 2000,
   overlap = 200,
): string[] {
   if (text.length <= maxLength) return [text];
   const paragraphs = text.split(/\n{2,}/);
   const chunks: string[] = [];
   let current = "";
   for (const para of paragraphs) {
      if ((current + para).length > maxLength) {
         if (current) chunks.push(current.trim());
         current = para;
      } else {
         current += (current ? "\n\n" : "") + para;
      }
   }
   if (current) chunks.push(current.trim());
   // Add overlap
   const overlapped: string[] = [];
   for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      if (i > 0 && overlap > 0) {
         const prev = chunks[i - 1] ?? "";
         if (prev && typeof prev === "string") {
            chunk = `${prev.slice(-overlap)}\n${chunk}`;
         }
      }
      overlapped.push(chunk || "");
   }
   return overlapped;
}
