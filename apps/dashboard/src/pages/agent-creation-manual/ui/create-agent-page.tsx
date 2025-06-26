import type {
  ContentType,
  FormattingStyle,
  TargetAudience,
  VoiceTone,
} from "@api/schemas/content-schema";
import mascot from "@packages/brand/logo.svg";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { Progress } from "@packages/ui/components/progress";
import { defineStepper } from "@packages/ui/components/stepper";
import { Textarea } from "@packages/ui/components/textarea";
import { ChevronLeft, ChevronRight, HelpCircle, X } from "lucide-react";
import { useState } from "react";
import {
  CONTENT_TYPES,
  FORMATTING_STYLES,
  TARGET_AUDIENCES,
  VOICE_TONES,
} from "../lib/agent-form-constants";
import { useAgentForm } from "../lib/use-agent-form";

const steps = [
  { id: "step-basic-info", title: "Basic Information" },
  { id: "step-content-type", title: "Content Type" },
  { id: "step-audience-style", title: "Audience & Style" },
  { id: "step-topics-seo", title: "Topics & SEO" },
  { id: "step-review-submit", title: "Review & Submit" },
] as const;

const { Stepper } = defineStepper(...steps);

export function CreateAgentPage() {
  const { handleSubmit, form, isLoading } = useAgentForm();
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

  const getMascotMessage = (step: string) => {
    switch (step) {
      case "step-basic-info":
        return "Let's give your content agent a special name!";
      case "step-content-type":
        return "Now let's choose what type of content to create!";
      case "step-audience-style":
        return "Who will be reading your content and how should it look?";
      case "step-topics-seo":
        return "Let's add topics and keywords for SEO!";
      case "step-review-submit":
        return "Almost there! Let's review everything before creating your agent!";
      default:
        return "Let's create your content agent!";
    }
  };

  return (
    <div className="space-y-4">
      <Stepper.Provider>
        {({ methods }) => (
          <>
            {/* Progress Card */}
            <Card className="border-0 shadow-none" id="progress-stepper">
              <CardHeader className="p-0">
                <CardTitle>
                  <div className="flex items-center justify-center gap-4">
                    {steps.map((step, index) => {
                      const isCompleted =
                        index <
                        methods.all.findIndex(
                          (s) => s.id === methods.current.id,
                        );
                      const isCurrent =
                        index ===
                        methods.all.findIndex(
                          (s) => s.id === methods.current.id,
                        );

                      return (
                        <div
                          className="flex flex-col items-center"
                          key={step.id}
                        >
                          <Stepper.Step
                            className="cursor-pointer group"
                            of={step.id}
                            onClick={() => methods.goTo(step.id)}
                          >
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 hover:scale-110 transform ${isCompleted || isCurrent
                                  ? "bg-slate-800 text-white shadow-lg ring-4 ring-slate-200"
                                  : "bg-slate-300 text-slate-600 hover:bg-slate-400 hover:shadow-md"
                                }`}
                            >
                              {index + 1}
                            </div>
                          </Stepper.Step>
                        </div>
                      );
                    })}
                  </div>
                </CardTitle>
                <CardDescription>
                  <div className="flex-1">
                    <Progress
                      className="w-full h-2"
                      value={
                        ((methods.all.findIndex(
                          (s) => s.id === methods.current.id,
                        ) +
                          1) /
                          steps.length) *
                        100
                      }
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-600">
                      <span>
                        Step{" "}
                        {methods.all.findIndex(
                          (s) => s.id === methods.current.id,
                        ) + 1}
                      </span>
                      <span>{steps.length} steps</span>
                    </div>
                  </div>
                </CardDescription>
                <CardAction>
                  <Button
                    className=" text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                    size="icon"
                    title="Help - How to use"
                    type="button"
                    variant="ghost"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </CardAction>
              </CardHeader>

              <CardContent>
                <div
                  className="flex items-start gap-6 w-full"
                  id="mascot-speech"
                >
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        alt="Content Agent Mascot"
                        className="w-12 h-12 rounded-full shadow-lg border-4 border-white"
                        src={mascot}
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl px-6 py-4 relative flex-1 shadow-lg border border-slate-200 transition-all duration-300 ease-in-out">
                    <div className="absolute left-[-8px] top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-white"></div>
                    <p className="text-slate-800 font-medium leading-relaxed transition-all duration-300">
                      {getMascotMessage(methods.current.id)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Card */}
            <Card className="border-0 shadow-none">
              <CardContent className="px-0">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {methods.switch({
                    "step-audience-style": () => (
                      <>
                        <form.AppField name="targetAudience">
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
                                    onClick={() =>
                                      field.handleChange(
                                        audience.value as TargetAudience,
                                      )
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
                                    onClick={() =>
                                      field.handleChange(
                                        style.value as FormattingStyle,
                                      )
                                    }
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
                    "step-basic-info": () => (
                      <>
                        <form.AppField name="name">
                          {(field) => (
                            <field.FieldContainer>
                              <field.FieldLabel>Agent Name *</field.FieldLabel>
                              <Input
                                autoComplete="off"
                                id={field.name}
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
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
                              <field.FieldLabel>Project ID</field.FieldLabel>
                              <Input
                                autoComplete="off"
                                id={field.name}
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder="e.g., Tech Blog"
                                value={field.state.value}
                              />
                              <field.FieldMessage />
                            </field.FieldContainer>
                          )}
                        </form.AppField>
                        <form.AppField name="description">
                          {(field) => (
                            <field.FieldContainer>
                              <field.FieldLabel>Description *</field.FieldLabel>
                              <Textarea
                                id={field.name}
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
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
                    "step-content-type": () => (
                      <>
                        <form.AppField name="contentType">
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
                                    onClick={() =>
                                      field.handleChange(
                                        type.value as ContentType,
                                      )
                                    }
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
                        <form.AppField name="voiceTone">
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
                                    onClick={() =>
                                      field.handleChange(
                                        tone.value as VoiceTone,
                                      )
                                    }
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
                      </>
                    ),
                    "step-review-submit": () => (
                      <div className="space-y-4">
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
                      </div>
                    ),
                    "step-topics-seo": () => (
                      <>
                        <form.AppField name="topics">
                          {(field) => (
                            <field.FieldContainer>
                              <field.FieldLabel className="text-sm font-medium text-foreground">
                                Preferred Topics
                              </field.FieldLabel>
                              <div className="mt-3 flex gap-3">
                                <Input
                                  className="flex-1"
                                  onChange={(e) =>
                                    setCurrentTopic(e.target.value)
                                  }
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
                          {(field) => (
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
                                          removeKeyword(
                                            keyword,
                                            field.state.value,
                                          )
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
                </form>
              </CardContent>

              <CardFooter className="px-0 pb-0" id="navigation-controls">
                <div className="flex-1">
                  {!methods.isFirst && (
                    <Button
                      className="gap-3 bg-white hover:bg-slate-50 transition-all duration-200 hover:scale-105 border-slate-300 hover:border-slate-400 px-6 py-3 text-base font-medium"
                      onClick={methods.prev}
                      type="button"
                      variant="outline"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex gap-4">
                  {methods.isLast ? (
                    <form.Subscribe>
                      {(formState) => (
                        <Button
                          className="min-w-[160px] gap-3 bg-slate-800 hover:bg-slate-900 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl px-8 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          disabled={
                            !formState.canSubmit ||
                            formState.isSubmitting ||
                            isLoading
                          }
                          type="submit"
                        >
                          {isLoading || formState.isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </>
                          ) : (
                            <>🚀 Create Agent</>
                          )}
                        </Button>
                      )}
                    </form.Subscribe>
                  ) : (
                    methods.switch({
                      "step-audience-style": () => (
                        <form.Subscribe
                          selector={(state) => ({
                            fieldMeta: state.fieldMeta,
                            targetAudienceValue: state.values.targetAudience,
                          })}
                        >
                          {({ targetAudienceValue, fieldMeta }) => {
                            const targetAudienceErrors =
                              fieldMeta?.targetAudience?.errors;

                            const isTargetAudienceValid =
                              targetAudienceValue &&
                              (!targetAudienceErrors ||
                                targetAudienceErrors.length === 0);
                            const canGoNext = isTargetAudienceValid;

                            return (
                              <Button
                                className="gap-3 bg-slate-800 hover:bg-slate-900 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl px-8 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                disabled={!canGoNext}
                                onClick={methods.next}
                                type="button"
                              >
                                Next
                                <ChevronRight className="w-5 h-5" />
                              </Button>
                            );
                          }}
                        </form.Subscribe>
                      ),
                      "step-basic-info": () => (
                        <form.Subscribe
                          selector={(state) => ({
                            descriptionValue: state.values.description,
                            fieldMeta: state.fieldMeta,
                            nameValue: state.values.name,
                          })}
                        >
                          {({ nameValue, descriptionValue, fieldMeta }) => {
                            const nameErrors = fieldMeta?.name?.errors;
                            const descriptionErrors =
                              fieldMeta?.description?.errors;

                            const isNameValid =
                              nameValue?.trim() !== "" &&
                              (!nameErrors || nameErrors.length === 0);
                            const isDescriptionValid =
                              descriptionValue?.trim() !== "" &&
                              (!descriptionErrors ||
                                descriptionErrors.length === 0);
                            const canGoNext = isNameValid && isDescriptionValid;

                            return (
                              <Button
                                className="gap-3 bg-slate-800 hover:bg-slate-900 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl px-8 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                disabled={!canGoNext}
                                onClick={methods.next}
                                type="button"
                              >
                                Next
                                <ChevronRight className="w-5 h-5" />
                              </Button>
                            );
                          }}
                        </form.Subscribe>
                      ),
                      "step-content-type": () => (
                        <form.Subscribe
                          selector={(state) => ({
                            contentTypeValue: state.values.contentType,
                            fieldMeta: state.fieldMeta,
                            voiceToneValue: state.values.voiceTone,
                          })}
                        >
                          {({
                            contentTypeValue,
                            voiceToneValue,
                            fieldMeta,
                          }) => {
                            const contentTypeErrors =
                              fieldMeta?.contentType?.errors;
                            const voiceToneErrors =
                              fieldMeta?.voiceTone?.errors;

                            const isContentTypeValid =
                              contentTypeValue &&
                              (!contentTypeErrors ||
                                contentTypeErrors.length === 0);
                            const isVoiceToneValid =
                              voiceToneValue &&
                              (!voiceToneErrors ||
                                voiceToneErrors.length === 0);
                            const canGoNext =
                              isContentTypeValid && isVoiceToneValid;

                            return (
                              <Button
                                className="gap-3 bg-slate-800 hover:bg-slate-900 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl px-8 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                disabled={!canGoNext}
                                onClick={methods.next}
                                type="button"
                              >
                                Next
                                <ChevronRight className="w-5 h-5" />
                              </Button>
                            );
                          }}
                        </form.Subscribe>
                      ),
                      "step-topics-seo": () => (
                        <Button
                          className="gap-3 bg-slate-800 hover:bg-slate-900 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl px-8 py-3 text-base font-medium"
                          onClick={methods.next}
                          type="button"
                        >
                          Next
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      ),
                    })
                  )}
                </div>
              </CardFooter>
            </Card>
          </>
        )}
      </Stepper.Provider>
    </div>
  );
}
