import { Badge } from "@packages/ui/components/badge";
import type { FormField } from "./form-canvas";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FormTemplate {
   id: string;
   name: string;
   description: string;
   type: "capture" | "intent" | "engagement" | "gate" | "blank";
   icon: string;
   title: string;
   subtitle: string;
   buttonText: string;
   fields: Omit<FormField, "id">[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES: FormTemplate[] = [
   {
      id: "blank",
      name: "Em branco",
      description: "Comece com um formulário vazio",
      type: "blank",
      icon: "📝",
      title: "",
      subtitle: "",
      buttonText: "Enviar",
      fields: [],
   },
   {
      id: "newsletter",
      name: "Newsletter",
      description: "Captura simples de e-mail",
      type: "capture",
      icon: "📧",
      title: "Receba nossos conteúdos exclusivos",
      subtitle:
         "Junte-se a milhares de leitores. Sem spam, cancele quando quiser.",
      buttonText: "Quero receber",
      fields: [
         {
            type: "email",
            label: "E-mail",
            placeholder: "seu@email.com",
            required: true,
         },
      ],
   },
   {
      id: "lead-magnet",
      name: "Lead magnet",
      description: "Nome + e-mail para material grátis",
      type: "capture",
      icon: "🎁",
      title: "Baixe gratuitamente",
      subtitle: "Preencha para receber o material no seu e-mail.",
      buttonText: "Quero o material",
      fields: [
         {
            type: "text",
            label: "Nome",
            placeholder: "Seu nome",
            required: true,
         },
         {
            type: "email",
            label: "E-mail",
            placeholder: "seu@email.com",
            required: true,
         },
      ],
   },
   {
      id: "demo-request",
      name: "Demo request",
      description: "Nome + e-mail + empresa + mensagem",
      type: "intent",
      icon: "🎯",
      title: "Agende uma demonstração",
      subtitle: "Veja como nossa solução pode ajudar sua empresa.",
      buttonText: "Agendar demo",
      fields: [
         {
            type: "text",
            label: "Nome",
            placeholder: "Seu nome",
            required: true,
         },
         {
            type: "email",
            label: "E-mail",
            placeholder: "seu@email.com",
            required: true,
         },
         {
            type: "text",
            label: "Empresa",
            placeholder: "Nome da empresa",
            required: true,
         },
         {
            type: "textarea",
            label: "Mensagem",
            placeholder: "Como podemos ajudar?",
            required: false,
         },
      ],
   },
   {
      id: "free-consultation",
      name: "Consulta gratuita",
      description: "Nome + e-mail + telefone",
      type: "intent",
      icon: "📞",
      title: "Agende uma consulta gratuita",
      subtitle: "Fale com um especialista sem compromisso.",
      buttonText: "Agendar consulta",
      fields: [
         {
            type: "text",
            label: "Nome",
            placeholder: "Seu nome",
            required: true,
         },
         {
            type: "email",
            label: "E-mail",
            placeholder: "seu@email.com",
            required: true,
         },
         {
            type: "text",
            label: "Telefone",
            placeholder: "(00) 00000-0000",
            required: false,
         },
      ],
   },
   {
      id: "quote-request",
      name: "Orçamento",
      description: "Nome + e-mail + empresa + budget + mensagem",
      type: "intent",
      icon: "💰",
      title: "Solicite um orçamento",
      subtitle: "Receba uma proposta personalizada para seu projeto.",
      buttonText: "Solicitar orçamento",
      fields: [
         {
            type: "text",
            label: "Nome",
            placeholder: "Seu nome",
            required: true,
         },
         {
            type: "email",
            label: "E-mail",
            placeholder: "seu@email.com",
            required: true,
         },
         {
            type: "text",
            label: "Empresa",
            placeholder: "Nome da empresa",
            required: false,
         },
         {
            type: "select",
            label: "Budget",
            options: [
               "Até R$ 5k",
               "R$ 5k - 20k",
               "R$ 20k - 50k",
               "Acima de R$ 50k",
            ],
            required: false,
         },
         {
            type: "textarea",
            label: "Descreva seu projeto",
            placeholder: "Conte-nos sobre o projeto...",
            required: false,
         },
      ],
   },
   {
      id: "waitlist",
      name: "Waitlist",
      description: "Nome + e-mail para lista de espera",
      type: "capture",
      icon: "⏳",
      title: "Entre na lista de espera",
      subtitle: "Seja o primeiro a saber quando lançarmos.",
      buttonText: "Quero entrar na fila",
      fields: [
         {
            type: "text",
            label: "Nome",
            placeholder: "Seu nome",
            required: true,
         },
         {
            type: "email",
            label: "E-mail",
            placeholder: "seu@email.com",
            required: true,
         },
      ],
   },
   {
      id: "webinar",
      name: "Webinar / Evento",
      description: "Nome + e-mail + empresa (opcional)",
      type: "capture",
      icon: "🎙️",
      title: "Reserve sua vaga",
      subtitle: "Participe ao vivo e tire suas dúvidas em tempo real.",
      buttonText: "Quero participar",
      fields: [
         {
            type: "text",
            label: "Nome",
            placeholder: "Seu nome",
            required: true,
         },
         {
            type: "email",
            label: "E-mail",
            placeholder: "seu@email.com",
            required: true,
         },
         {
            type: "text",
            label: "Empresa",
            placeholder: "Nome da empresa (opcional)",
            required: false,
         },
      ],
   },
   {
      id: "article-feedback",
      name: "Feedback do artigo",
      description: "Avaliação + comentário opcional",
      type: "engagement",
      icon: "⭐",
      title: "Este artigo foi útil?",
      subtitle: "Sua opinião nos ajuda a criar conteúdo melhor.",
      buttonText: "Enviar feedback",
      fields: [
         {
            type: "rating",
            label: "Como você avalia este artigo?",
            required: true,
         },
         {
            type: "textarea",
            label: "Comentário (opcional)",
            placeholder: "O que poderíamos melhorar?",
            required: false,
         },
      ],
   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Template Selector UI
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<FormTemplate["type"], string> = {
   capture: "Captura",
   intent: "Intenção",
   engagement: "Engajamento",
   gate: "Gate",
   blank: "Em branco",
};

interface FormTemplateSelectorProps {
   onSelect: (template: FormTemplate) => void;
}

export function FormTemplateSelector({ onSelect }: FormTemplateSelectorProps) {
   return (
      <div className="space-y-6">
         <div>
            <h2 className="text-xl font-semibold">Escolha um template</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Comece com um template pronto ou em branco
            </p>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FORM_TEMPLATES.map((template) => (
               <button
                  className="group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-accent"
                  key={template.id}
                  onClick={() => onSelect(template)}
                  type="button"
               >
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                     <p className="font-medium text-sm">{template.name}</p>
                     <p className="text-xs text-muted-foreground mt-0.5">
                        {template.description}
                     </p>
                  </div>
                  <Badge className="text-xs" variant="secondary">
                     {TYPE_LABELS[template.type]}
                  </Badge>
               </button>
            ))}
         </div>
      </div>
   );
}
