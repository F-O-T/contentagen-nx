import type { FeedbackAdapter, FeedbackPayload } from "../schemas";

const EMOJI_RATINGS = ["😡", "😕", "😐", "🙂", "🤩"];

type DiscordAdapterConfig = {
   webhookUrl: string;
};

type DiscordEmbed = {
   title: string;
   color: number;
   fields: { name: string; value: string; inline?: boolean }[];
   threadName: string;
};

function buildEmbed(payload: FeedbackPayload): DiscordEmbed {
   switch (payload.type) {
      case "bug_report":
         return {
            title: "🐛 Bug Report",
            color: 0xef4444,
            threadName: `Bug: ${payload.description.slice(0, 80)}`,
            fields: [
               { name: "Descrição", value: payload.description },
               ...(payload.severity
                  ? [
                       {
                          name: "Gravidade",
                          value: payload.severity,
                          inline: true,
                       },
                    ]
                  : []),
            ],
         };
      case "feature_request": {
         const stars = "⭐".repeat(payload.priority);
         return {
            title: "💡 Feature Request",
            color: 0xf59e0b,
            threadName: `Feature: ${payload.feature.slice(0, 80)}`,
            fields: [
               { name: "Feature", value: payload.feature },
               ...(payload.problem
                  ? [{ name: "Problema", value: payload.problem }]
                  : []),
               {
                  name: "Prioridade",
                  value: stars || "Não informada",
                  inline: true,
               },
            ],
         };
      }
      case "feature_feedback": {
         const emoji = EMOJI_RATINGS[payload.rating - 1] ?? "😐";
         return {
            title: "💬 Feature Feedback",
            color: 0x3b82f6,
            threadName: `Feedback: ${payload.featureName}`,
            fields: [
               { name: "Feature", value: payload.featureName, inline: true },
               {
                  name: "Rating",
                  value: `${emoji} (${payload.rating}/5)`,
                  inline: true,
               },
               ...(payload.improvement
                  ? [{ name: "Melhoria", value: payload.improvement }]
                  : []),
            ],
         };
      }
   }
}

export function discordAdapter(config: DiscordAdapterConfig): FeedbackAdapter {
   return {
      name: "discord",
      async send(payload) {
         const embed = buildEmbed(payload);

         try {
            const response = await fetch(`${config.webhookUrl}?wait=true`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  thread_name: embed.threadName,
                  embeds: [
                     {
                        title: embed.title,
                        color: embed.color,
                        fields: embed.fields,
                        timestamp: new Date().toISOString(),
                     },
                  ],
               }),
            });
            if (!response.ok) {
               console.error("[discord-adapter] webhook delivery failed", {
                  status: response.status,
                  statusText: response.statusText,
               });
            }
         } catch (err) {
            console.error("[discord-adapter] webhook request failed", err);
         }
      },
   };
}
