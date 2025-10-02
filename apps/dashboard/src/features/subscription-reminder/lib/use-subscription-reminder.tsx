import { useState, useEffect } from "react";
import { SubscriptionReminderCredenza } from "../ui/subscription-reminder-credenza";

export function useSubscriptionReminder() {
   const [showReminder, setShowReminder] = useState(false);

   useEffect(() => {
      // Check if user has seen the reminder before
      const hasSeenReminder = localStorage.getItem("subscription-reminder-seen");

      // Only show reminder if they haven't seen it before
      if (!hasSeenReminder) {
         // Show reminder after a short delay to allow page to load
         const timer = setTimeout(() => {
            setShowReminder(true);
         }, 1000);

         return () => clearTimeout(timer);
      }
   }, []);

   const handleClose = () => {
      setShowReminder(false);
      // Mark that user has seen the reminder
      localStorage.setItem("subscription-reminder-seen", "true");
   };

   const SubscriptionReminderComponent = () => (
      <SubscriptionReminderCredenza
         open={showReminder}
         onOpenChange={handleClose}
      />
   );

   return {
      showReminder,
      setShowReminder,
      SubscriptionReminderComponent,
   };
}