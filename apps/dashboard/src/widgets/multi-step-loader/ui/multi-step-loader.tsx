import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type LoadingState = {
   text: string;
};

const TypewriterText = ({
   text,
   isActive,
   onComplete,
}: {
   text: string;
   isActive: boolean;
   onComplete?: () => void;
}) => {
   const [displayText, setDisplayText] = useState("");
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isCompleted, setIsCompleted] = useState(false);

   useEffect(() => {
      setDisplayText("");
      setCurrentIndex(0);
      setIsCompleted(false);
   }, [text]);

   useEffect(() => {
      if (!isActive) {
         setDisplayText("");
         setCurrentIndex(0);
         setIsCompleted(false);
         return;
      }

      if (currentIndex < text.length) {
         const timeout = setTimeout(() => {
            setDisplayText(text.substring(0, currentIndex + 1));
            setCurrentIndex(currentIndex + 1);
         }, 50);

         return () => clearTimeout(timeout);
      } else if (!isCompleted) {
         setIsCompleted(true);
         const timeout = setTimeout(() => {
            onComplete?.();
         }, 1000);

         return () => clearTimeout(timeout);
      }
   }, [isActive, currentIndex, text, isCompleted, onComplete]);

   return (
      <motion.div
         className="text-center absolute inset-0 flex items-center justify-center"
         initial={{ opacity: 0, x: 100 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: -100 }}
         transition={{
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
         }}
      >
         <span className="text-2xl font-medium text-black dark:text-lime-500">
            {displayText}
            {isActive && !isCompleted && (
               <span className="inline-block w-1 h-8 bg-current ml-1 animate-pulse" />
            )}
         </span>
      </motion.div>
   );
};

const LoaderCore = ({
   loadingStates,
   value = 0,
   onTextComplete,
}: {
   loadingStates: LoadingState[];
   value?: number;
   onTextComplete?: () => void;
}) => {
   return (
      <div className="flex relative justify-center max-w-2xl mx-auto">
         <div className="relative min-h-[4rem] w-full">
            <AnimatePresence mode="wait">
               {value < loadingStates.length && loadingStates[value] && (
                  <TypewriterText
                     key={`text-${value}-${loadingStates[value].text}`}
                     text={loadingStates[value].text}
                     isActive={true}
                     onComplete={onTextComplete}
                  />
               )}
            </AnimatePresence>
         </div>
      </div>
   );
};

export const MultiStepLoader = ({
   loadingStates,
   loading,
   loop = true,
}: {
   loadingStates: LoadingState[];
   loading?: boolean;
   loop?: boolean;
}) => {
   const [currentState, setCurrentState] = useState(0);
   const [textCompleted, setTextCompleted] = useState(false);

   useEffect(() => {
      if (!loading) {
         setCurrentState(0);
         setTextCompleted(false);
         return;
      }

      if (loadingStates.length === 0) {
         return;
      }

      if (textCompleted) {
         const timeout = setTimeout(() => {
            setTextCompleted(false);
            setCurrentState((prevState) => {
               const nextState = prevState + 1;
               if (loop && nextState >= loadingStates.length) {
                  return 0;
               }
               return Math.min(nextState, loadingStates.length - 1);
            });
         }, 50);

         return () => clearTimeout(timeout);
      }
   }, [loading, textCompleted, loop, loadingStates.length]);

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
               className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl backdrop-muted"
            >
               <div className="h-96 relative flex flex-col items-center space-y-8">
                  <motion.div
                     className="w-24 h-24 flex items-center justify-center"
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{
                        scale: 1,
                        opacity: 1,
                     }}
                     transition={{
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                     }}
                  >
                     <motion.img
                        src="/favicon.svg"
                        alt="Content Writer Logo"
                        className="w-full h-full object-contain drop-shadow-lg"
                        animate={{
                           y: [0, -8, 0],
                           rotate: [0, 2, -2, 0],
                        }}
                        transition={{
                           duration: 4,
                           repeat: Infinity,
                           ease: "easeInOut",
                           repeatType: "reverse",
                        }}
                     />
                  </motion.div>
                  <LoaderCore
                     value={currentState}
                     loadingStates={loadingStates}
                     onTextComplete={() => setTextCompleted(true)}
                  />
               </div>

               <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white dark:bg-black h-full absolute [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]" />
            </motion.div>
         )}
      </AnimatePresence>
   );
};
