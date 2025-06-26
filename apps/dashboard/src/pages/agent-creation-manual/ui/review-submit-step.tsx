// ReviewSubmitStep.tsx
import { useAgentForm } from "../lib/use-agent-form";

export function ReviewSubmitStep() {
  const { form } = useAgentForm();

  return (
    <>
      <div>
        <strong>Name:</strong> {form.getFieldValue("name")}
      </div>
      <div>
        <strong>Project ID:</strong> {form.getFieldValue("projectId")}
      </div>
      <div>
        <strong>Description:</strong> {form.getFieldValue("description")}
      </div>
      <div>
        <strong>Content Type:</strong> {form.getFieldValue("contentType")}
      </div>
      <div>
        <strong>Voice Tone:</strong> {form.getFieldValue("voiceTone")}
      </div>
      <div>
        <strong>Target Audience:</strong> {form.getFieldValue("targetAudience")}
      </div>
      <div>
        <strong>Formatting Style:</strong> {form.getFieldValue("formattingStyle")}
      </div>
      <div>
        <strong>Topics:</strong> {form.getFieldValue("topics")?.join(", ")}
      </div>
      <div>
        <strong>SEO Keywords:</strong> {form.getFieldValue("seoKeywords")?.join(", ")}
      </div>
    </>
  );
}