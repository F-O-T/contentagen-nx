/**
 * Static task definitions for the Quick Start checklist.
 *
 * Each task belongs to a product (content, forms, analytics) and has a type
 * that determines its lifecycle:
 *   - setup: core configuration tasks (must be done to "complete" onboarding)
 *   - onboarding: first-use tasks (must be done to "complete" onboarding)
 *   - explore: optional exploration tasks (shown in "continue exploring" state)
 *
 * Tasks with `autoDetect: true` are automatically completed by the backend
 * when the corresponding resource exists. Manual tasks use a clickable
 * checkbox.
 */

export type TaskType = "setup" | "onboarding" | "explore";
export type ProductId = "content" | "forms" | "analytics";

export interface TaskDefinition {
   id: string;
   title: string;
   description: string;
   type: TaskType;
   product: ProductId;
   dependsOn?: string;
   autoDetect: boolean;
   route: string;
}

export const TASK_DEFINITIONS: TaskDefinition[] = [
   // ── Content tasks ──────────────────────────────────────────────────
   {
      id: "create_content",
      title: "Crie seu primeiro conteudo",
      description: "Crie um rascunho de blog post ou artigo com ajuda da IA.",
      type: "onboarding",
      product: "content",
      autoDetect: true,
      route: "/$slug/$teamSlug/content",
   },
   {
      id: "publish_content",
      title: "Publique um conteudo",
      description:
         "Publique um conteudo para que ele fique visivel no seu site.",
      type: "onboarding",
      product: "content",
      dependsOn: "create_content",
      autoDetect: true,
      route: "/$slug/$teamSlug/content",
   },
   {
      id: "setup_brand",
      title: "Configure sua marca",
      description:
         "Defina as diretrizes de marca para a IA seguir ao criar conteudo.",
      type: "setup",
      product: "content",
      autoDetect: false,
      route: "/$slug/$teamSlug/brand",
   },
   {
      id: "configure_writer",
      title: "Configure um escritor IA",
      description:
         "Personalize o tom de voz e estilo do seu escritor de conteudo.",
      type: "setup",
      product: "content",
      autoDetect: false,
      route: "/$slug/$teamSlug/writers",
   },

   // ── Forms tasks ────────────────────────────────────────────────────
   {
      id: "install_sdk",
      title: "Instale o SDK",
      description:
         "Adicione o SDK ao seu site para coletar dados e exibir formularios.",
      type: "setup",
      product: "forms",
      autoDetect: false,
      route: "/$slug/$teamSlug/settings",
   },
   {
      id: "create_form",
      title: "Crie seu primeiro formulario",
      description:
         "Crie um formulario de captura de leads ou feedback para seu site.",
      type: "onboarding",
      product: "forms",
      dependsOn: "install_sdk",
      autoDetect: true,
      route: "/$slug/$teamSlug/forms",
   },
   {
      id: "embed_form",
      title: "Incorpore o formulario",
      description: "Adicione o formulario ao seu site usando o SDK ou iframe.",
      type: "onboarding",
      product: "forms",
      dependsOn: "create_form",
      autoDetect: false,
      route: "/$slug/$teamSlug/forms",
   },
   {
      id: "view_submission",
      title: "Visualize uma resposta",
      description: "Receba e visualize a primeira resposta de um formulario.",
      type: "explore",
      product: "forms",
      dependsOn: "embed_form",
      autoDetect: false,
      route: "/$slug/$teamSlug/forms",
   },

   // ── Analytics tasks ────────────────────────────────────────────────
   {
      id: "install_sdk_analytics",
      title: "Instale o SDK",
      description: "Adicione o SDK ao seu site para comecar a coletar eventos.",
      type: "setup",
      product: "analytics",
      autoDetect: false,
      route: "/$slug/$teamSlug/settings",
   },
   {
      id: "verify_event",
      title: "Verifique um evento",
      description:
         "Confirme que os eventos estao chegando apos instalar o SDK.",
      type: "onboarding",
      product: "analytics",
      dependsOn: "install_sdk_analytics",
      autoDetect: false,
      route: "/$slug/$teamSlug/analytics",
   },
   {
      id: "create_insight",
      title: "Crie um insight",
      description: "Crie sua primeira consulta para analisar dados do site.",
      type: "explore",
      product: "analytics",
      dependsOn: "verify_event",
      autoDetect: true,
      route: "/$slug/$teamSlug/analytics/insights",
   },
   {
      id: "create_dashboard",
      title: "Crie um dashboard",
      description: "Monte um painel com metricas importantes do seu conteudo.",
      type: "explore",
      product: "analytics",
      dependsOn: "create_insight",
      autoDetect: true,
      route: "/$slug/$teamSlug/analytics/dashboards",
   },
];

/**
 * The "install SDK" task is conceptually the same for forms and analytics.
 * If both products are selected, we de-duplicate so it shows only once.
 * We keep the `install_sdk` (forms variant) and hide `install_sdk_analytics`.
 */
export const SDK_INSTALL_TASK_IDS = [
   "install_sdk",
   "install_sdk_analytics",
] as const;

/**
 * Returns the task definitions filtered and de-duplicated for the given
 * selected products. Content tasks always show.
 */
export function getTasksForProducts(
   selectedProducts: string[] | null,
): TaskDefinition[] {
   const products = selectedProducts ?? [];
   const hasContent = true; // Content is always included
   const hasForms = products.includes("forms");
   const hasAnalytics = products.includes("analytics");

   const bothSdkProducts = hasForms && hasAnalytics;

   return TASK_DEFINITIONS.filter((task) => {
      // Filter by product
      if (task.product === "content" && !hasContent) return false;
      if (task.product === "forms" && !hasForms) return false;
      if (task.product === "analytics" && !hasAnalytics) return false;

      // De-duplicate SDK install: if both products need SDK, keep only one
      if (bothSdkProducts && task.id === "install_sdk_analytics") {
         return false;
      }

      return true;
   });
}

/**
 * Returns a display label (in Portuguese) for each product.
 */
export function getProductLabel(product: ProductId): string {
   switch (product) {
      case "content":
         return "Conteudo";
      case "forms":
         return "Formularios";
      case "analytics":
         return "Analytics";
   }
}
