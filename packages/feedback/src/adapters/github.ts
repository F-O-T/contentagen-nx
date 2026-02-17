import type { Octokit } from "@octokit/rest";
import type { FeedbackAdapter, FeedbackPayload } from "../schemas";

const EMOJI_RATINGS = ["😡", "😕", "😐", "🙂", "🤩"];

type GitHubAdapterConfig = {
   octokit: Octokit;
   owner: string;
   repo: string;
};

type IssueData = {
   title: string;
   body: string;
   labels: string[];
};

function buildIssue(payload: FeedbackPayload): IssueData {
   switch (payload.type) {
      case "bug_report":
         return {
            title: `[Bug] ${payload.description.slice(0, 80)}`,
            labels: ["bug", "triage"],
            body: [
               "## Bug Report",
               "",
               "### Descrição",
               payload.description,
               ...(payload.severity
                  ? ["", "### Gravidade", payload.severity]
                  : []),
            ].join("\n"),
         };
      case "feature_request": {
         const stars = "⭐".repeat(payload.priority);
         return {
            title: `[Feature] ${payload.feature.slice(0, 80)}`,
            labels: ["feature-request", "triage"],
            body: [
               "## Feature Request",
               "",
               "### Funcionalidade",
               payload.feature,
               ...(payload.problem
                  ? ["", "### Problema que resolve", payload.problem]
                  : []),
               "",
               `### Prioridade: ${stars || "Não informada"}`,
            ].join("\n"),
         };
      }
      case "feature_feedback": {
         const emoji = EMOJI_RATINGS[payload.rating - 1] ?? "😐";
         return {
            title: `[Feedback] ${payload.featureName}`,
            labels: ["feedback", "triage"],
            body: [
               "## Feature Feedback",
               "",
               `### Feature: ${payload.featureName}`,
               `### Rating: ${emoji} (${payload.rating}/5)`,
               ...(payload.improvement
                  ? ["", "### Sugestão de melhoria", payload.improvement]
                  : []),
            ].join("\n"),
         };
      }
   }
}

export function githubAdapter(config: GitHubAdapterConfig): FeedbackAdapter {
   return {
      name: "github",
      async send(payload) {
         const issue = buildIssue(payload);

         try {
            await config.octokit.issues.create({
               owner: config.owner,
               repo: config.repo,
               title: issue.title,
               body: issue.body,
               labels: issue.labels,
            });
         } catch (err) {
            console.error("[github-adapter] issue creation failed", err);
            throw err;
         }
      },
   };
}
