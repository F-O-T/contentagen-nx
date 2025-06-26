import { driver } from "driver.js";
import { useRef } from "react";
import "driver.js/dist/driver.css";
import mascot from "@packages/brand/logo.svg";
import type { AgentFormStep } from "./agent-form-context";

const STEP_TOUR_CONFIGS = {
  "step-basic-info": {
    element: "#agent-name-field",
    popover: {
      align: "start" as const,
      description: `<div style="display:flex;align-items:center;margin-bottom:8px;"><img src="${mascot}" alt="Mascot" style="height:24px;margin-right:6px;border-radius:50%;"/>Let's get started!</div>Enter your agent's name and a brief description.`,
      side: "bottom" as const,
      title: "🎯 Basic Information",
    },
  },
  "step-content-type": {
    element: "#content-type-field",
    popover: {
      align: "start" as const,
      description: `<div style="display:flex;align-items:center;margin-bottom:8px;"><img src="${mascot}" alt="Mascot" style="height:24px;margin-right:6px;border-radius:50%;"/>Choose content type!</div>Select what type of content your agent will create and how it should sound.`,
      side: "bottom" as const,
      title: "📝 Content Type & Voice",
    },
  },
  "step-audience-style": {
    element: "#target-audience-field",
    popover: {
      align: "start" as const,
      description: `<div style="display:flex;align-items:center;margin-bottom:8px;"><img src="${mascot}" alt="Mascot" style="height:24px;margin-right:6px;border-radius:50%;"/>Define your audience!</div>Choose who your content is for and how it should be formatted.`,
      side: "bottom" as const,
      title: "👥 Audience & Style",
    },
  },
  "step-topics-seo": {
    element: "#topics-field",
    popover: {
      align: "start" as const,
      description: `<div style="display:flex;align-items:center;margin-bottom:8px;"><img src="${mascot}" alt="Mascot" style="height:24px;margin-right:6px;border-radius:50%;"/>Add topics!</div>Define topics and keywords for SEO.`,
      side: "bottom" as const,
      title: "🔍 Topics & SEO",
    },
  },
  "step-review-submit": {
    element: "#review-content",
    popover: {
      align: "start" as const,
      description: `<div style="display:flex;align-items:center;margin-bottom:8px;"><img src="${mascot}" alt="Mascot" style="height:24px;margin-right:6px;border-radius:50%;"/>Almost there!</div>Review all settings before creating your agent.`,
      side: "bottom" as const,
      title: "✅ Review & Create",
    },
  },
};

export function useDriverTour() {
  const mainDriverRef = useRef<any>(null);
  const driverInstances = useRef<Record<string, any>>({});

  // Initialize main tour
  if (!mainDriverRef.current) {
    mainDriverRef.current = driver({
      allowClose: true,
      doneBtnText: "Let's start! 🚀",
      nextBtnText: "Next →",
      popoverClass: "driverjs-theme-custom",
      prevBtnText: "← Previous",
      showButtons: ["next", "previous", "close"],
      showProgress: true,
      steps: [
        {
          element: "#progress-stepper",
          popover: {
            align: "center" as const,
            description: `<div style="display:flex;align-items:center;margin-bottom:8px;"><img src="${mascot}" alt="Mascot" style="height:24px;margin-right:6px;border-radius:50%;"/>Welcome!</div>This bar shows your progress. There are 5 simple steps to create your agent!`,
            side: "bottom" as const,
            title: "🎯 Setup Progress",
          },
        },
        {
          element: "#mascot-speech",
          popover: {
            align: "start" as const,
            description:
              "I'm your assistant! I'll guide you through the entire process and give you useful tips at each step. Keep an eye on my messages! 😊",
            side: "bottom" as const,
            title: "🤖 Your Personal Assistant",
          },
        },
        {
          element: "#navigation-controls",
          popover: {
            align: "center" as const,
            description:
              "Use these buttons to navigate between steps. You can go back and forward as many times as you want to review your settings.",
            side: "top" as const,
            title: "🧭 Navigation",
          },
        },
      ],
    });
  }

  // Initialize driver instances for each step
  Object.keys(STEP_TOUR_CONFIGS).forEach((stepId) => {
    if (!driverInstances.current[stepId]) {
      driverInstances.current[stepId] = driver({
        allowClose: true,
        doneBtnText: "Got it! 👍",
        nextBtnText: "Next →",
        popoverClass: "driverjs-theme-custom",
        prevBtnText: "← Previous",
        showButtons: ["next", "previous", "close"],
        showProgress: false,
        steps: [STEP_TOUR_CONFIGS[stepId as keyof typeof STEP_TOUR_CONFIGS]],
      });
    }
  });

  const startMainTour = () => {
    if (mainDriverRef.current) {
      mainDriverRef.current.drive();
    }
  };

  const startStepTour = (stepId: AgentFormStep) => {
    if (driverInstances.current[stepId]) {
      driverInstances.current[stepId].drive();
    }
  };

  const getMascotMessage = (step: AgentFormStep) => {
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

  return {
    startMainTour,
    startStepTour,
    getMascotMessage,
  };
}
