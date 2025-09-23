export function getCurrentDate(timezone?: string): { date: string } {
   const now = new Date();

   if (timezone) {
      return {
         date: now
            .toLocaleDateString("en-CA", {
               timeZone: timezone,
               year: "numeric",
               month: "2-digit",
               day: "2-digit",
            })
            .replace(/\//g, "-"),
      };
   }

   const year = now.getFullYear();
   const month = String(now.getMonth() + 1).padStart(2, "0");
   const day = String(now.getDate()).padStart(2, "0");

   return { date: `${year}-${month}-${day}` };
}

export function formatDate(date: Date, timezone?: string): string {
   if (timezone) {
      return date
         .toLocaleDateString("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
         })
         .replace(/\//g, "-");
   }

   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const day = String(date.getDate()).padStart(2, "0");

   return `${year}-${month}-${day}`;
}
