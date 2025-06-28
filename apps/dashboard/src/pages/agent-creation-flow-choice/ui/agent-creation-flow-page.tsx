import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@packages/ui/components/button";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";

export function AgentCreationFlowPage() {
   const startTutorial = () => {
      const driverObj = driver({
         allowClose: true,
         doneBtnText: "Let's start!",
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
                  description: `Welcome! I'm here to help you choose the best way to create your content agent. Let me show you around!`,
                  side: "bottom" as const,
                  title: "Your Personal Assistant",
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
      <div className="h-full w-full flex flex-col space-y-8">
         <TalkingMascot message="Welcome! Let's create your perfect content agent. Choose how you'd like to set it up below.">
            <Button
               className="mt-2 rounded-full border-1 border-primary bg-none  h-auto text-xs text-foreground  px-2 py-1 "
               onClick={startTutorial}
               size="sm"
               type="button"
               variant="outline"
            >
               Get help choosing {">"}
            </Button>
         </TalkingMascot>

         <Link to="/agents/manual">
            <SquaredIconButton id="manual-card">
               <Settings className="h-10 w-10 text-slate-600 transition-all duration-300 group-hover:text-white" />
               Custom Agent Builder
            </SquaredIconButton>
         </Link>
      </div>
   );
}
