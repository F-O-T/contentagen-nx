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
import { ArrowLeft, Save, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useCreateAgent } from "./lib/use-create-agent";
import type { ContentType, FormattingStyle, TargetAudience, VoiceTone } from "@api/schemas/content-schema";

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
  const { form, handleSubmit, isLoading } = useCreateAgent();
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/">
                <h1 className="text-xl font-bold text-gray-900">BlogAI</h1>
              </Link>
              <div className="ml-6">
                <span className="text-gray-500">/ Create Agent</span>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/agents">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Agents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Sparkles className="h-8 w-8 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Create AI Agent
              </h2>
            </div>
            <p className="text-gray-600">
              Configure your AI agent with specific voice, audience, and content
              preferences.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
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
                        <field.FieldLabel>Agent Name *</field.FieldLabel>
                        <Input
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

                  <form.AppField name="project">
                    {(field) => (
                      <field.FieldContainer>
                        <field.FieldLabel>Project</field.FieldLabel>
                        <Input
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
                      <field.FieldLabel>Description</field.FieldLabel>
                      <Textarea
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

            {/* Content Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Content Configuration</CardTitle>
                <CardDescription>
                  Define how your agent should write and format content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form.AppField
                  name="contentType"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Content type is required" : undefined,
                  }}
                >
                  {(field) => (
                    <field.FieldContainer>
                      <field.FieldLabel>Content Type *</field.FieldLabel>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {CONTENT_TYPES.map((type) => (
                          <button
                            className={`p-3 text-sm rounded-lg border-2 transition-all ${
                              field.state.value === type.value
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 hover:border-gray-300"
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
                      <field.FieldLabel>Voice Tone *</field.FieldLabel>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {VOICE_TONES.map((tone) => (
                          <button
                            className={`p-3 text-sm rounded-lg border-2 transition-all ${
                              field.state.value === tone.value
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 hover:border-gray-300"
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
                      <field.FieldLabel>Target Audience *</field.FieldLabel>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {TARGET_AUDIENCES.map((audience) => (
                          <button
                            className={`p-3 text-sm rounded-lg border-2 transition-all ${
                              field.state.value === audience.value
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 hover:border-gray-300"
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
                      <field.FieldLabel>Formatting Style</field.FieldLabel>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {FORMATTING_STYLES.map((style) => (
                          <button
                            className={`p-3 text-sm rounded-lg border-2 transition-all text-left ${
                              field.state.value === style.value
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 hover:border-gray-300"
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

            {/* Topics & SEO */}
            <Card>
              <CardHeader>
                <CardTitle>Topics & SEO</CardTitle>
                <CardDescription>
                  Define preferred topics and SEO keywords for your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form.AppField name="topics">
                  {(field) => (
                    <field.FieldContainer>
                      <field.FieldLabel>Preferred Topics</field.FieldLabel>
                      <div className="flex space-x-2 mb-3">
                        <Input
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
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.state.value.map((topic) => (
                          <Badge
                            className="flex items-center gap-1"
                            key={topic}
                            variant="secondary"
                          >
                            {topic}
                            <button
                              className="ml-1 hover:text-destructive"
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
                      <field.FieldMessage />
                    </field.FieldContainer>
                  )}
                </form.AppField>

                <form.AppField name="seoKeywords">
                  {(field) => (
                    <field.FieldContainer>
                      <field.FieldLabel>SEO Keywords</field.FieldLabel>
                      <div className="flex space-x-2 mb-3">
                        <Input
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
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.state.value.map((keyword) => (
                          <Badge
                            className="flex items-center gap-1"
                            key={keyword}
                            variant="outline"
                          >
                            {keyword}
                            <button
                              className="ml-1 hover:text-destructive"
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
                      <field.FieldMessage />
                    </field.FieldContainer>
                  )}
                </form.AppField>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-3">
              <Link to="/agents">
                <Button variant="outline">Cancel</Button>
              </Link>
              <form.Subscribe>
                {(formState) => (
                  <Button
                    disabled={
                      !formState.canSubmit ||
                      formState.isSubmitting ||
                      isLoading
                    }
                    type="submit"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Creating..." : "Create Agent"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
