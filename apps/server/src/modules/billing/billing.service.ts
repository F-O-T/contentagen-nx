// billing.service.ts
// Centralized billing logic for plan management and usage ingestion

import { env } from "@api/config/env";
import { auth } from "@api/integrations/auth";

export interface BillingPlan {
   id: string;
   name: string;
   description?: string;
   price: number;
   features: string[];
}

export interface UsageEvent {
   event: string;
   amount: number;
   productId?: string;
   metadata?: Record<string, unknown>;
}

// Example static plans config (replace with your actual plans)
const PLANS: BillingPlan[] = [
   {
      id: env.POLAR_PREMIUM_PLAN,
      name: "Premium",
      description: "Premium plan",
      price: 100,
      features: ["Feature A", "Feature B"],
   },
   {
      id: env.POLAR_PRO_PLAN,
      name: "Pro",
      description: "Pro plan",
      price: 200,
      features: ["Feature C", "Feature D"],
   },
];

export class BillingService {
   // Fetch all plans (static config for now)
   async getPlans(): Promise<BillingPlan[]> {
      return PLANS;
   }

   // Fetch a specific plan by ID
   async getPlanById(planId: string): Promise<BillingPlan | null> {
      return PLANS.find((p) => p.id === planId) ?? null;
   }

   // Ingest usage event for a user
   async ingestUsage(headers: Headers, usage: UsageEvent): Promise<void> {
      await auth.api.ingestion({
         headers,
         body: {
            event: usage.event,
            metadata: {
               productId: usage.productId ?? "",
               amount: usage.amount,
               ...usage.metadata,
            },
         },
      });
   }

   // Check if user is premium
   async isPremiumUser(headers: Headers): Promise<boolean> {
      const subscriptions = await auth.api.subscriptions({
         headers,
         query: { active: true },
      });
      const product = subscriptions?.result?.items[0]?.product;
      return product?.id === env.POLAR_PREMIUM_PLAN || false;
   }

   // Check if user has exceeded their usage limit
   async hasExceededUsageLimit(headers: Headers): Promise<boolean> {
      const meters = await auth.api.meters({
         headers,
         query: {
            page: 1,
            limit: 1,
         },
      });
      const usage = meters?.result?.items[0]?.consumedUnits ?? 0;
      const limit = meters?.result?.items[0]?.creditedUnits ?? 0;
      return usage >= limit;
   }
}
