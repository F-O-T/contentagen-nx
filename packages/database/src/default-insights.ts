// Default insights for new organizations
// Moved here to avoid circular dependency (database -> analytics -> database)

interface DefaultInsightDef {
   name: string;
   description: string;
   type: "trends" | "funnels" | "retention";
   config: Record<string, unknown>;
   defaultSize: "sm" | "md" | "lg" | "full";
}

export const DEFAULT_INSIGHTS: DefaultInsightDef[] = [
   {
      name: "Visualizações de Página",
      description: "Visualizações diárias de página nos últimos 30 dias",
      type: "trends",
      config: {
         type: "trends",
         series: [
            {
               event: "content.page.view",
               math: "count",
               label: "Visualizações",
            },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "line",
         compare: true,
         filters: [],
      },
      defaultSize: "lg",
   },
   {
      name: "Visitantes Únicos",
      description: "Visitantes únicos diários nos últimos 30 dias",
      type: "trends",
      config: {
         type: "trends",
         series: [
            {
               event: "content.page.view",
               math: "unique_users",
               label: "Visitantes Únicos",
            },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "line",
         compare: true,
         filters: [],
      },
      defaultSize: "sm",
   },
   {
      name: "Conteúdo Criado",
      description: "Conteúdo criado este mês",
      type: "trends",
      config: {
         type: "trends",
         series: [
            {
               event: "content.created",
               math: "count",
               label: "Conteúdo Criado",
            },
         ],
         dateRange: { type: "relative", value: "this_month" },
         interval: "day",
         chartType: "bar",
         compare: false,
         filters: [],
      },
      defaultSize: "sm",
   },
   {
      name: "Top Conteúdo",
      description: "Conteúdo mais visualizado nos últimos 30 dias",
      type: "trends",
      config: {
         type: "trends",
         series: [
            {
               event: "content.page.view",
               math: "count",
               label: "Visualizações",
            },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "bar",
         breakdown: { property: "contentId", type: "event" },
         compare: false,
         filters: [],
      },
      defaultSize: "lg",
   },
   {
      name: "Uso de IA",
      description: "Uso de recursos de IA nos últimos 30 dias",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "ai.completion", math: "count", label: "Conclusões" },
            {
               event: "ai.chat_message",
               math: "count",
               label: "Mensagens de Chat",
            },
            {
               event: "ai.agent_action",
               math: "count",
               label: "Ações de Agente",
            },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "line",
         compare: true,
         filters: [],
      },
      defaultSize: "full",
   },
   {
      name: "Requisições SDK",
      description: "Requisições da API SDK nos últimos 30 dias",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "sdk.author.fetched", math: "count", label: "Autor" },
            { event: "sdk.content.listed", math: "count", label: "Lista" },
            { event: "sdk.content.fetched", math: "count", label: "Conteúdo" },
            { event: "sdk.image.fetched", math: "count", label: "Imagem" },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "area",
         compare: false,
         filters: [],
      },
      defaultSize: "full",
   },
   {
      name: "Taxa de Conversão",
      description: "Taxa de cliques em CTA de visualizações de página",
      type: "trends",
      config: {
         type: "trends",
         series: [
            {
               event: "content.page.view",
               math: "count",
               label: "Visualizações",
            },
            { event: "content.cta.click", math: "count", label: "Cliques" },
         ],
         dateRange: { type: "relative", value: "30d" },
         interval: "day",
         chartType: "number",
         formula: "B/A*100",
         compare: true,
         filters: [],
      },
      defaultSize: "sm",
   },
   {
      name: "Uso de Créditos",
      description: "Custos de eventos faturáveis este mês",
      type: "trends",
      config: {
         type: "trends",
         series: [
            { event: "content.page.view", math: "count", label: "Conteúdo" },
            { event: "ai.completion", math: "count", label: "IA" },
            { event: "form.submitted", math: "count", label: "Formulários" },
         ],
         dateRange: { type: "relative", value: "this_month" },
         interval: "day",
         chartType: "area",
         compare: false,
         filters: [],
      },
      defaultSize: "lg",
   },
];
