export function formatWindow(ms: number): string {
   if (typeof ms !== "number" || Number.isNaN(ms) || ms <= 0) return "period";

   const timeUnits = [
      { unitMs: 86400000, label: "day" },
      { unitMs: 3600000, label: "hour" },
      { unitMs: 60000, label: "minute" },
      { unitMs: 1000, label: "second" },
   ];

   for (const { unitMs, label } of timeUnits) {
      if (ms % unitMs === 0) {
         const value = ms / unitMs;
         return `${value} ${label}${value === 1 ? "" : "s"}`;
      }
   }

   return `${ms} ms`;
}
