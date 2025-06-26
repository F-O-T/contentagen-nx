import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@packages/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Info, Settings, HelpCircle } from "lucide-react";
import mascot from "@packages/brand/logo.svg";

export function AgentCreationFlowPage() {
  // Move DriverJS step definition directly into startTutorial
  const startTutorial = () => {
    const driverObj = driver({
      allowClose: true,
      doneBtnText: "Let's start! 🚀",
      nextBtnText: "Next →",
      popoverClass: "driverjs-theme-custom",
      prevBtnText: "← Previous",
      showButtons: ["next", "previous", "close"],
      showProgress: true,
      steps: [
        {
          element: "#mascot-speech",
          popover: {
            align: "start" as const,
            description: `<div style="display:flex;align-items:center;margin-bottom:8px;"><img src="${mascot}" alt="Mascot" style="height:24px;margin-right:6px;border-radius:50%;"/>Welcome!</div>I'm here to help you choose the best way to create your content agent. Let me show you around!`,
            side: "bottom" as const,
            title: "🤖 Your Personal Assistant",
          },
        },
        {
          element: "#manual-card",
          popover: {
            description:
              "Choose this option for full control: define tone of voice, audience persona, preferred topics, SEO keywords, and formatting style. Ideal for advanced users or those with specific requirements.",
            title: "Custom Agent Builder",
          },
        },
      ],
    });
    driverObj.drive();
  };

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-center">
            Choose Your Agent Setup Path
          </CardTitle>
          <CardAction>
            <Button
              onClick={startTutorial}
              size="icon"
              variant="ghost"
              className="text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </CardAction>
          <CardDescription className="text-center">
            Create your AI agent with full manual control and customization.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-start gap-6 w-full" id="mascot-speech">
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
                Welcome! Let's create your perfect content agent. Choose how
                you'd like to set it up below.
              </p>
              <Button
                className="mt-2 h-auto text-xs text-slate-600 hover:bg-slate-50 px-2 py-1 transition-colors duration-200 rounded-full"
                onClick={startTutorial}
                size="sm"
                type="button"
                variant="ghost"
              >
                💡 Get help choosing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Creation Options Card */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Custom Agent Builder (Manual Setup)
          </CardTitle>
          <CardDescription className="text-slate-600">
            Define your agent's tone, audience, topics, SEO keywords, and
            formatting style. Ideal for advanced users or those with specific
            requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 items-center justify-center">
          <Link className="w-full" to="/agents/manual">
            <div
              className="group w-full rounded-2xl border-2 border-slate-200 bg-white p-8 text-center transition-all duration-300 hover:border-slate-800 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
              id="manual-card"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 transition-all duration-300 group-hover:bg-slate-800 group-hover:scale-110">
                    <Settings className="h-10 w-10 text-slate-600 transition-all duration-300 group-hover:text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="h-3 w-3 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-800 transition-colors duration-300 group-hover:text-slate-900">
                    Custom Agent Builder
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Full control over your agent's personality, content style,
                    and SEO optimization
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-300 group-hover:bg-slate-800 group-hover:text-white">
                    Voice & Tone
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-300 group-hover:bg-slate-800 group-hover:text-white">
                    Target Audience
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-300 group-hover:bg-slate-800 group-hover:text-white">
                    SEO Keywords
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-300 group-hover:bg-slate-800 group-hover:text-white">
                    Content Types
                  </span>
                </div>

                <Button
                  className="mt-4 gap-2 bg-slate-800 hover:bg-slate-900 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl px-8 py-3 text-base font-medium"
                  asChild
                >
                  <span>
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
