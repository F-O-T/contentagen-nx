import { CheckIcon, CheckCheck } from "lucide-react";

import { cn } from "@packages/ui/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type LoadingState = {
   text: string;
};

const LoaderCore = ({
   loadingStates,
   value = 0,
}: {
   loadingStates: LoadingState[];
   value?: number;
}) => {
   return (
      <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40">
         {loadingStates.map((loadingState, index) => {
            const distance = Math.abs(index - value);
            const opacity = Math.max(1 - distance * 0.2, 0); // Minimum opacity is 0, keep it 0.2 if you're sane.

            return (
               <motion.div
                  key={`#card-loader-${index + 1}`}
                  className={cn("text-left flex gap-2 mb-4")}
                  initial={{ opacity: 0, y: -(value * 40) }}
                  animate={{ opacity: opacity, y: -(value * 40) }}
                  transition={{ duration: 0.5 }}
               >
                  <div>
                     {index > value && (
                        <CheckIcon className="text-black dark:text-white" />
                     )}
                     {index <= value && (
                        <CheckCheck
                           className={cn(
                              "text-black dark:text-white",
                              value === index &&
                                 "text-black dark:text-lime-500 opacity-100",
                           )}
                        />
                     )}
                  </div>
                  <span
                     className={cn(
                        "text-black dark:text-white",
                        value === index &&
                           "text-black dark:text-lime-500 opacity-100",
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

export const MultiStepLoader = ({
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
   }, [loading, loop, loadingStates.length, duration]);
   return (
      <AnimatePresence mode="wait">
         {loading && (
            <motion.div
               initial={{
                  opacity: 0,
               }}
               animate={{
                  opacity: 1,
               }}
               exit={{
                  opacity: 0,
               }}
               className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl"
            >
               <div className="h-96  relative">
                  <LoaderCore
                     value={currentState}
                     loadingStates={loadingStates}
                  />
               </div>

               <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white dark:bg-black h-full absolute [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]" />
            </motion.div>
         )}
      </AnimatePresence>
   );
};
