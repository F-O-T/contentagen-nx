import type {
  ContentType,
  FormattingStyle,
  TargetAudience,
  VoiceTone,
} from "@api/schemas/content-schema";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Save, X } from "lucide-react";
import { useState } from "react";
import { useAgentForm } from "./lib/use-agent-form";

export const Route = createFileRoute("/agents/create")({
  component: CreateAgent,
});

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

function CreateAgent() {
  const { form, handleSubmit, isLoading } = useAgentForm();
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    "Basic Information",
    "Content Configuration",
    "Topics & SEO",
    "Review & Submit",
  ];

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

  // Helper to get current form values for review step
  // Helper to get current form values for review step

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Stepper Navigation */}
          <nav className="flex space-x-4 mb-6">
            {steps.map((label, i) => (
              <button
                className={`px-3 py-1 rounded ${i + 1 === currentStep
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-muted text-muted-foreground"
                  }`}
                disabled={isLoading}
                key={`step-${i + 1}`}
                onClick={() => setCurrentStep(i + 1)}
                type="button"
              >
                {i + 1}. {label}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Create AI Agent
                  </h1>
                  <p className="text-muted-foreground">
                    Configure your AI agent with specific voice, audience, and
                    content preferences.
                  </p>
                </div>
              </div>
            </div>
            <Link to="/agents">
              <Button className="gap-2" variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Back to Agents
              </Button>
            </Link>
          </div>
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Basic Information
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Set up the basic details for your AI agent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <form.AppField
                      name="name"
                      validators={{
                        onChange: ({ value }) =>
                          !value ? "Agent name is required" : undefined,
                      }}
                    >
                      {(field) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            Agent Name *
                          </field.FieldLabel>
                          <Input
                            className="mt-1.5"
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
                      {(field) => (
                        <field.FieldContainer>
                          <field.FieldLabel className="text-sm font-medium text-foreground">
                            Project ID
                          </field.FieldLabel>
                          <Input
                            className="mt-1.5"
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
                  </div>
                  <form.AppField name="description">
                    {(field) => (
                      <field.FieldContainer>
                        <field.FieldLabel className="text-sm font-medium text-foreground">
                          Description
                        </field.FieldLabel>
                        <Textarea
                          className="mt-1.5 resize-none"
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
                </CardContent>
              </Card>
            )}
            {/* Step 2: Content Configuration */}
            {currentStep === 2 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Content Configuration
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Define how your agent should write and format content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <form.AppField
                    name="contentType"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? "Content type is required" : undefined,
                    }}
                  >
                    {(field) => (
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
                      onChange: ({ value }) =>
                        !value ? "Voice tone is required" : undefined,
                    }}
                  >
                    {(field) => (
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
                      onChange: ({ value }) =>
                        !value ? "Target audience is required" : undefined,
                    }}
                  >
                    {(field) => (
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
                              onClick={() => field.handleChange(audience.value)}
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
                    {(field) => (
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
                </CardContent>
              </Card>
            )}
            {/* Step 3: Topics & SEO */}
            {currentStep === 3 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Topics & SEO
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Define preferred topics and SEO keywords for your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <form.AppField name="topics">
                    {(field) => (
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
                            {field.state.value.map((topic) => (
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
                    {(field) => (
                      <field.FieldContainer>
                        <field.FieldLabel className="text-sm font-medium text-foreground">
                          SEO Keywords
                        </field.FieldLabel>
                        <div className="mt-3 flex gap-3">
                          <Input
                            className="flex-1"
                            onChange={(e) => setCurrentKeyword(e.target.value)}
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
                            {field.state.value.map((keyword) => (
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
                </CardContent>
              </Card>
            )}
            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    Review & Submit
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Please review your agent details before submitting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    return (
                      <>
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
                    );
                  })()}
                </CardContent>
              </Card>
            )}
            {/* Stepper Controls */}
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
              <Button
                disabled={currentStep === 1 || isLoading}
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                type="button"
                variant="outline"
              >
                Previous
              </Button>
              {currentStep < 4 ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                  onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
                  type="button"
                >
                  Next
                </Button>
              ) : (
                <form.Subscribe>
                  {(formState) => (
                    <Button
                      className="w-full gap-2 sm:order-2 sm:w-auto"
                      disabled={
                        !formState.canSubmit ||
                        formState.isSubmitting ||
                        isLoading
                      }
                      type="submit"
                    >
                      <Save className="h-4 w-4" />
                      {isLoading ? "Creating..." : "Create Agent"}
                    </Button>
                  )}
                </form.Subscribe>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
