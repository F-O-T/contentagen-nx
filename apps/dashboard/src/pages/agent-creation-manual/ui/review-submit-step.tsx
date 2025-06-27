import { useAgentForm } from "../lib/use-agent-form";

export function ReviewSubmitStep({form}:{form:AgentForm}) {

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="font-bold">Name:</span> {form.getFieldValue("name")}
      </div>
      <div>
        <span className="font-bold">Project ID:</span> {form.getFieldValue("projectId")}
      </div>
      <div>
        <span className="font-bold">Description:</span> {form.getFieldValue("description")}
      </div>
      <div>
        <span className="font-bold">Content Type:</span> {form.getFieldValue("contentType")}
      </div>
      <div>
        <span className="font-bold">Voice Tone:</span> {form.getFieldValue("voiceTone")}
      </div>
      <div>
        <span className="font-bold">Target Audience:</span> {form.getFieldValue("targetAudience")}
      </div>
      <div>
        <span className="font-bold">Formatting Style:</span> {form.getFieldValue("formattingStyle")}
      </div>
      <div>
        <span className="font-bold">Topics:</span> {form.getFieldValue("topics")?.join(", ")}
      </div>
      <div>
        <span className="font-bold">SEO Keywords:</span> {form.getFieldValue("seoKeywords")?.join(", ")}
      </div>
    </div>
  );
}
