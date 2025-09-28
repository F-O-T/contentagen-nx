import { CheckIcon, CheckCheck } from "lucide-react";
import { cn } from "@packages/ui/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type LoadingState = {
   text: string;
};

const CardLoaderCore = ({
   loadingStates,
   value = 0,
}: {
   loadingStates: LoadingState[];
   value?: number;
}) => {
   return (
      <div className="flex relative justify-start flex-col">
         {loadingStates.map((loadingState, index) => {
            const distance = Math.abs(index - value);
            const opacity = Math.max(1 - distance * 0.2, 0);

            return (
               <motion.div
                  key={`#card-loader-${index + 1}`}
                  className={cn("text-left flex gap-2 mb-2 text-sm")}
                  initial={{ opacity: 0, y: -(value * 20) }}
                  animate={{ opacity: opacity, y: -(value * 20) }}
                  transition={{ duration: 0.3 }}
               >
                  <div className="flex-shrink-0">
                     {index > value && (
                        <CheckIcon className="w-4 h-4 text-muted-foreground" />
                     )}
                     {index <= value && (
                        <CheckCheck
                           className={cn(
                              "w-4 h-4",
                              value === index && "text-green-500",
                              index < value && "text-muted-foreground",
                           )}
                        />
                     )}
                  </div>
                  <span
                     className={cn(
                        "text-muted-foreground",
                        value === index && "text-foreground font-medium",
                     )}
                  >
                     {loadingState.text}
                  </span>
               </motion.div>
            );
         })}
      </div>
   );
};

export const CardMultiStepLoader = ({
   loadingStates,
   loading,
   duration = 2000,
   loop = true,
}: {
   loadingStates: LoadingState[];
   loading?: boolean;
   duration?: number;
   loop?: boolean;
}) => {
   const [currentState, setCurrentState] = useState(0);

   useEffect(() => {
      if (!loading) {
         setCurrentState(0);
         return;
      }
      const timeout = setTimeout(() => {
         setCurrentState((prevState) =>
            loop
               ? prevState === loadingStates.length - 1
                  ? 0
                  : prevState + 1
               : Math.min(prevState + 1, loadingStates.length - 1),
         );
      }, duration);

      return () => clearTimeout(timeout);
   }, [currentloading, loop, loadingStates.length, duration]);

   return (
      <AnimatePresence mode="wait">
         {loading && (
            <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               transition={{ duration: 0.2 }}
               className="overflow-hidden"
            >
               <div className="py-4">
                  <CardLoaderCore
                     value={currentState}
                     loadingStates={loadingStates}
                  />
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};
