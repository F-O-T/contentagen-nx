import type {
  ContentType,
  FormattingStyle,
  TargetAudience,
  VoiceTone,
} from "@api/schemas/content-schema";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { defineStepper } from "@packages/ui/components/stepper";
import { Textarea } from "@packages/ui/components/textarea";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { useAgentForm } from "../lib/use-agent-form";

type LabeledValue<T> = { label: string; value: T };

const CONTENT_TYPES: readonly LabeledValue<ContentType>[] = [
  { label: "Blog Posts", value: "blog_posts" },
  { label: "Social Media", value: "social_media" },
  { label: "Marketing Copy", value: "marketing_copy" },
  { label: "Technical Docs", value: "technical_docs" },
];

const VOICE_TONES: readonly LabeledValue<VoiceTone>[] = [
  { label: "Professional", value: "professional" },
  { label: "Conversational", value: "conversational" },
  { label: "Educational", value: "educational" },
  { label: "Creative", value: "creative" },
];

const TARGET_AUDIENCES: readonly LabeledValue<TargetAudience>[] = [
  { label: "General Public", value: "general_public" },
  { label: "Professionals", value: "professionals" },
  { label: "Beginners", value: "beginners" },
  { label: "Customers", value: "customers" },
];

const FORMATTING_STYLES: readonly LabeledValue<FormattingStyle>[] = [
  { label: "Structured (H1, H2, bullets)", value: "structured" },
  { label: "Narrative (flowing text)", value: "narrative" },
  { label: "List-based (numbered/bulleted)", value: "list_based" },
];

const steps = [
  { id: "basic-info", title: "Basic Information" },
  { id: "content-config", title: "Content Configuration" },
  { id: "topics-seo", title: "Topics & SEO" },
  { id: "review-submit", title: "Review & Submit" },
] as const;

const { Stepper } = defineStepper(...steps);

export function CreateAgentPage() {
  const { form, handleSubmit, isLoading } = useAgentForm();
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentKeyword, setCurrentKeyword] = useState("");

  const addTopic = (topics: string[]) => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      form.setFieldValue("topics", [...topics, currentTopic.trim()]);
      setCurrentTopic("");
    }
  };

  const removeTopic = (topicToRemove: string, topics: string[]) => {
    form.setFieldValue(
      "topics",
      topics.filter((topic) => topic !== topicToRemove),
    );
  };

  const addKeyword = (keywords: string[]) => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      form.setFieldValue("seoKeywords", [...keywords, currentKeyword.trim()]);
      setCurrentKeyword("");
    }
  };

  const removeKeyword = (keywordToRemove: string, keywords: string[]) => {
    form.setFieldValue(
      "seoKeywords",
      keywords.filter((keyword) => keyword !== keywordToRemove),
    );
  };

  return (
    <Stepper.Provider>
      {({ methods }) => (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Stepper.Navigation>
            {steps.map((step) => (
              <Stepper.Step key={step.id} of={step.id}>
                <Stepper.Title>{step.title}</Stepper.Title>
              </Stepper.Step>
            ))}
          </Stepper.Navigation>
          <Card>
            <CardContent className="space-y-4">
              {methods.switch({
                "basic-info": () => (
                  <>
                    <form.AppField name="name">
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel>Agent Name</field.FieldLabel>
                          <Input
                            autoComplete="off"
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g., Tech News Agent"
                            value={field.state.value}
                          />
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                    <form.AppField name="projectId">
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel>Project ID</field.FieldLabel>
                          <Input
                            autoComplete="off"
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g., Tech Blog"
                            value={field.state.value}
                          />
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                    <form.AppField name="description">
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel>Description</field.FieldLabel>
                          <Textarea
                            autoComplete="off"
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Describe what this agent will do..."
                            rows={3}
                            value={field.state.value}
                          />
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                  </>
                ),
                "content-config": () => (
                  <>
                    {/* Content Configuration Step */}
                    <form.AppField
                      name="contentType"
                      validators={{
                        onChange: ({ value }: { value: string }) =>
                          !value ? "Content type is required" : undefined,
                      }}
                    >
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            Content Type *
                          </field.FieldLabel>
                          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {CONTENT_TYPES.map((type) => (
                              <button
                                className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${field.state.value === type.value
                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                  }`}
                                key={type.value}
                                onClick={() => field.handleChange(type.value)}
                                type="button"
                              >
                                {type.label}
                              </button>
                            ))}
                          </div>
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                    <form.AppField
                      name="voiceTone"
                      validators={{
                        onChange: ({ value }: { value: string }) =>
                          !value ? "Voice tone is required" : undefined,
                      }}
                    >
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            Voice Tone *
                          </field.FieldLabel>
                          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {VOICE_TONES.map((tone) => (
                              <button
                                className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${field.state.value === tone.value
                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                  }`}
                                key={tone.value}
                                onClick={() => field.handleChange(tone.value)}
                                type="button"
                              >
                                {tone.label}
                              </button>
                            ))}
                          </div>
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                    <form.AppField
                      name="targetAudience"
                      validators={{
                        onChange: ({ value }: { value: string }) =>
                          !value ? "Target audience is required" : undefined,
                      }}
                    >
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            Target Audience *
                          </field.FieldLabel>
                          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {TARGET_AUDIENCES.map((audience) => (
                              <button
                                className={`group relative rounded-lg border-2 p-4 text-sm font-medium transition-all hover:shadow-sm ${field.state.value === audience.value
                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                  }`}
                                key={audience.value}
                                onClick={() =>
                                  field.handleChange(audience.value)
                                }
                                type="button"
                              >
                                {audience.label}
                              </button>
                            ))}
                          </div>
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                    <form.AppField name="formattingStyle">
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            Formatting Style
                          </field.FieldLabel>
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {FORMATTING_STYLES.map((style) => (
                              <button
                                className={`group relative rounded-lg border-2 p-4 text-left text-sm font-medium transition-all hover:shadow-sm ${field.state.value === style.value
                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                  }`}
                                key={style.value}
                                onClick={() => field.handleChange(style.value)}
                                type="button"
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                  </>
                ),
                "review-submit": () => (
                  <>
                    {/* Review & Submit Step */}
                    <div>
                      <strong>Name:</strong> {form.getFieldValue("name")}
                    </div>
                    <div>
                      <strong>Project ID:</strong>{" "}
                      {form.getFieldValue("projectId")}
                    </div>
                    <div>
                      <strong>Description:</strong>{" "}
                      {form.getFieldValue("description")}
                    </div>
                    <div>
                      <strong>Content Type:</strong>{" "}
                      {form.getFieldValue("contentType")}
                    </div>
                    <div>
                      <strong>Voice Tone:</strong>{" "}
                      {form.getFieldValue("voiceTone")}
                    </div>
                    <div>
                      <strong>Target Audience:</strong>{" "}
                      {form.getFieldValue("targetAudience")}
                    </div>
                    <div>
                      <strong>Formatting Style:</strong>{" "}
                      {form.getFieldValue("formattingStyle")}
                    </div>
                    <div>
                      <strong>Topics:</strong>{" "}
                      {form.getFieldValue("topics")?.join(", ")}
                    </div>
                    <div>
                      <strong>SEO Keywords:</strong>{" "}
                      {form.getFieldValue("seoKeywords")?.join(", ")}
                    </div>
                  </>
                ),
                "topics-seo": () => (
                  <>
                    {/* Topics & SEO Step */}
                    <form.AppField name="topics">
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            Preferred Topics
                          </field.FieldLabel>
                          <div className="mt-3 flex gap-3">
                            <Input
                              className="flex-1"
                              onChange={(e) => setCurrentTopic(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addTopic(field.state.value);
                                }
                              }}
                              placeholder="Add a topic..."
                              value={currentTopic}
                            />
                            <Button
                              onClick={() => addTopic(field.state.value)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Add
                            </Button>
                          </div>
                          {field.state.value.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {field.state.value.map((topic: string) => (
                                <Badge
                                  className="flex items-center gap-1.5 bg-secondary/50 text-secondary-foreground hover:bg-secondary/70"
                                  key={topic}
                                  variant="secondary"
                                >
                                  {topic}
                                  <button
                                    className="ml-0.5 rounded-sm hover:text-destructive"
                                    onClick={() =>
                                      removeTopic(topic, field.state.value)
                                    }
                                    type="button"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                    <form.AppField name="seoKeywords">
                      {(field: any) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            SEO Keywords
                          </field.FieldLabel>
                          <div className="mt-3 flex gap-3">
                            <Input
                              className="flex-1"
                              onChange={(e) =>
                                setCurrentKeyword(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addKeyword(field.state.value);
                                }
                              }}
                              placeholder="Add a keyword..."
                              value={currentKeyword}
                            />
                            <Button
                              onClick={() => addKeyword(field.state.value)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Add
                            </Button>
                          </div>
                          {field.state.value.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {field.state.value.map((keyword: string) => (
                                <Badge
                                  className="flex items-center gap-1.5 border-border bg-background text-foreground hover:bg-accent/50"
                                  key={keyword}
                                  variant="outline"
                                >
                                  {keyword}
                                  <button
                                    className="ml-0.5 rounded-sm hover:text-destructive"
                                    onClick={() =>
                                      removeKeyword(keyword, field.state.value)
                                    }
                                    type="button"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                          <field.FieldMessage />
                        </field.FieldContainer>
                      )}
                    </form.AppField>
                  </>
                ),
              })}
              <Stepper.Controls className="flex w-full justify-between">
                <Button
                  disabled={methods.isFirst || isLoading}
                  onClick={methods.prev}
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                {methods.isLast ? (
                  <form.Subscribe>
                    {(formState: any) => (
                      <Button
                        className="shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                        disabled={
                          !formState.canSubmit ||
                          formState.isSubmitting ||
                          isLoading
                        }
                        type="submit"
                        variant="default"
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? "Creating..." : "Create Agent"}
                      </Button>
                    )}
                  </form.Subscribe>
                ) : (
                  <Button
                    disabled={isLoading}
                    onClick={methods.next}
                    type="button"
                  >
                    Next
                  </Button>
                )}
              </Stepper.Controls>
            </CardContent>
          </Card>
        </form>
      )}
    </Stepper.Provider>
  );
}
