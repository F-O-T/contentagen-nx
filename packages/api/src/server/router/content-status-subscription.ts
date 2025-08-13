import { publicProcedure } from "../trpc";
import {
   contentEvent,
   CONTENT_EVENTS,
   type ContentStatusChangedPayload,
} from "@packages/server-events";
import { on } from "node:events";
import { z } from "zod";

export const contentStatusSubscription = publicProcedure
   .input(z.object({ contentId: z.string().optional() }).optional())
   .subscription(async function* (opts) {
      for await (const [payload] of on(
         contentEvent,
         CONTENT_EVENTS.statusChanged,
         {
            signal: opts.signal,
         },
      )) {
         const event = payload as ContentStatusChangedPayload;
         // If a contentId is provided, filter events
         if (
            !opts.input?.contentId ||
            opts.input.contentId === event.contentId
         ) {
            yield event;
         }
      }
   });
