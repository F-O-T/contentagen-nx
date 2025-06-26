import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@packages/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Settings } from "lucide-react";

export function AgentCreationFlowPage() {
  // Updated DriverJS steps for tutorial
  const tutorialSteps = [
    {
      element: "#manual-card",
      popover: {
        description:
          "Choose this option for full control: define tone of voice, audience persona, preferred topics, SEO keywords, and formatting style. Ideal for advanced users or those with specific requirements.",
        title: "Custom Agent Builder",
      },
    },
    {
      element: "#ai-card",
      popover: {
        description:
          "Let AI suggest the best configuration for your agent based on your needs. Fast and easy, but with less customization. (Launching soon!)",
        title: "AI-Powered Quick Start",
      },
    },
  ];

  const startTutorial = () => {
    const driverObj = driver({
      steps: tutorialSteps,
    });
    driverObj.drive();
  };

  // Card data for mapping
  const cardOptions = [
    {
      ariaLabel: "Custom Agent Builder",
      cardClass:
        "w-full cursor-pointer transition-all border-2 p-4 sm:p-6 hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-primary border-border hover:border-primary",
      description:
        "Define voice, audience persona, topics, SEO keywords & formatting.",
      disabled: false,
      extra: null,
      icon: <Settings aria-hidden="true" className="w-10 h-10 mb-3" />,
      id: "manual-card",
      key: "manual",
      title: "Custom Agent Builder",
      to: "/agents/manual",
    },
    {
      ariaLabel: "AI-Powered Quick Start (Coming Soon)",
      cardClass:
        "transition-all border-2 p-4 sm:p-6 opacity-60 cursor-not-allowed border-border",
      description: (
        <>
          Auto-configure agent settings with AI suggestions.
          <br />
          <span className="font-semibold">Coming soon.</span>
        </>
      ),
      disabled: true,
      extra: (
        <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center rounded-md pointer-events-none">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Launching soon
          </span>
        </div>
      ),
      icon: <MessageCircle aria-hidden="true" className="w-10 h-10 mb-3" />,
      id: "ai-card",
      key: "ai",
      title: "AI-Powered Quick Start",
      to: undefined,
    },
  ];

  return (
    <div>
      <div className="flex flex-col items-center w-full min-h-screen py-6 px-2">
        <div className="w-full max-w-xl space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold text-center mt-2">
            Set Up Your AI Agent
          </h1>
          <p className="text-muted-foreground text-center text-base sm:text-lg">
            Select a setup path: full control or assisted by AI
          </p>
          <div className="flex justify-center mt-2 mb-2">
            <Button
              className="w-full sm:w-auto text-base sm:text-lg py-3 sm:py-2"
              onClick={startTutorial}
              type="button"
            >
              Show Me How
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-2">
            {cardOptions.map((card) =>
              card.disabled ? (
                <div className="relative w-full" key={card.key}>
                  <Card
                    aria-disabled={true}
                    aria-label={card.ariaLabel}
                    className={card.cardClass}
                    id={card.id}
                    role="button"
                    tabIndex={-1}
                    title="Launching soon"
                  >
                    <CardHeader
                      className="flex flex-col items-center justify-center aspect-square"
                      style={{ minHeight: 140 }}
                    >
                      {card.icon}
                      <CardTitle className="font-semibold text-base sm:text-lg text-center">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="text-center mt-2 text-sm sm:text-base">
                        {card.description}
                      </CardDescription>
                    </CardHeader>
                    {card.extra}
                  </Card>
                </div>
              ) : (
                <Link
                  aria-label={card.ariaLabel}
                  className="w-full block focus:outline-none"
                  key={card.key}
                  tabIndex={0}
                  to={card.to}
                >
                  <Card className={card.cardClass} id={card.id} role="link">
                    <CardHeader
                      className="flex flex-col items-center justify-center aspect-square"
                      style={{ minHeight: 140 }}
                    >
                      {card.icon}
                      <CardTitle className="font-semibold text-base sm:text-lg text-center">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="text-center mt-2 text-sm sm:text-base">
                        {card.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
