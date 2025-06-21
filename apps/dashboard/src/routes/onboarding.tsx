import { Button } from "@packages/ui/components/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const steps = [
  {
    content: "WelcomeStep",
    description:
      "Let's set up your first AI content agent in just a few steps.",
    id: 1,
    title: "Welcome to BlogAI",
  },
  {
    content: "FocusStep",
    description: "What type of content will your agent create?",
    id: 2,
    title: "Choose Your Focus",
  },
  {
    content: "VoiceStep",
    description: "Set the tone and style for your content.",
    id: 3,
    title: "Define Your Voice",
  },
  {
    content: "AudienceStep",
    description: "Who are you writing for?",
    id: 4,
    title: "Target Audience",
  },
  {
    content: "CompletionStep",
    description: "Your AI agent is configured and ready to create content.",
    id: 5,
    title: "Ready to Go!",
  },
];

function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    audience: "",
    contentType: "",
    tone: "",
  });
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate({ to: "/agents/create" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-2xl mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BlogAI Setup</h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>

          <div className="space-y-6">
            {currentStep === 1 && <WelcomeStep />}
            {currentStep === 2 && (
              <FocusStep formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 3 && (
              <VoiceStep formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 4 && (
              <AudienceStep formData={formData} setFormData={setFormData} />
            )}
            {currentStep === 5 && <CompletionStep />}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <div>
            {currentStep > 1 ? (
              <Button onClick={handlePrevious} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            ) : (
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
          </div>
          <Button onClick={handleNext}>
            {currentStep === steps.length ? "Create Agent" : "Next"}
            {currentStep < steps.length && (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
        <Sparkles className="w-12 h-12 text-indigo-600" />
      </div>
      <div className="space-y-2">
        <p className="text-lg text-gray-700">
          Welcome to the future of content creation!
        </p>
        <p className="text-gray-600">
          BlogAI helps you create consistent, high-quality content with
          AI-powered agents. Each agent can be customized to match your brand
          voice and target audience.
        </p>
      </div>
      <div className="bg-indigo-50 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-indigo-900 mb-2">What you'll get:</h4>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>• AI-powered content generation</li>
          <li>• Consistent brand voice</li>
          <li>• SEO-optimized articles</li>
          <li>• Multiple export formats</li>
        </ul>
      </div>
    </div>
  );
}

function FocusStep({ formData, setFormData }: any) {
  const contentTypes = [
    {
      description: "Articles, tutorials, and guides",
      id: "blog",
      label: "Blog Posts",
    },
    {
      description: "Posts for Twitter, LinkedIn, etc.",
      id: "social",
      label: "Social Media",
    },
    {
      description: "Product descriptions, ads",
      id: "marketing",
      label: "Marketing Copy",
    },
    {
      description: "API docs, guides",
      id: "technical",
      label: "Technical Documentation",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 mb-6">
        Select the primary type of content your agent will create:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contentTypes.map((type) => (
          <button
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              formData.contentType === type.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            key={type.id}
            onClick={() => setFormData({ ...formData, contentType: type.id })}
            type="button"
          >
            <h4 className="font-semibold text-gray-900 mb-1">{type.label}</h4>
            <p className="text-sm text-gray-600">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceStep({ formData, setFormData }: any) {
  const tones = [
    {
      description: "Formal, authoritative",
      id: "professional",
      label: "Professional",
    },
    {
      description: "Friendly, approachable",
      id: "conversational",
      label: "Conversational",
    },
    {
      description: "Informative, clear",
      id: "educational",
      label: "Educational",
    },
    {
      description: "Engaging, storytelling",
      id: "creative",
      label: "Creative",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 mb-6">
        Choose the tone and style for your content:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tones.map((tone) => (
          <button
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              formData.tone === tone.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            key={tone.id}
            onClick={() => setFormData({ ...formData, tone: tone.id })}
            type="button"
          >
            <h4 className="font-semibold text-gray-900 mb-1">{tone.label}</h4>
            <p className="text-sm text-gray-600">{tone.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function AudienceStep({ formData, setFormData }: any) {
  const audiences = [
    {
      description: "Broad, accessible content",
      id: "general",
      label: "General Public",
    },
    {
      description: "Expert-level content",
      id: "professionals",
      label: "Industry Professionals",
    },
    {
      description: "Introductory, educational",
      id: "beginners",
      label: "Beginners",
    },
    {
      description: "Product-focused content",
      id: "customers",
      label: "Customers",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 mb-6">
        Who is your primary audience?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {audiences.map((audience) => (
          <button
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              formData.audience === audience.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            key={audience.id}
            onClick={() => setFormData({ ...formData, audience: audience.id })}
            type="button"
          >
            <h4 className="font-semibold text-gray-900 mb-1">
              {audience.label}
            </h4>
            <p className="text-sm text-gray-600">{audience.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompletionStep() {
  return (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-12 h-12 text-green-600" />
      </div>
      <div className="space-y-2">
        <p className="text-lg text-gray-700">
          Perfect! Your AI agent is ready to go.
        </p>
        <p className="text-gray-600">
          You can now start generating content, customize settings further, or
          create additional agents.
        </p>
      </div>
      <div className="bg-green-50 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-green-900 mb-2">Next steps:</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Fine-tune your agent settings</li>
          <li>• Generate your first piece of content</li>
          <li>• Set up publishing workflows</li>
        </ul>
      </div>
    </div>
  );
}
