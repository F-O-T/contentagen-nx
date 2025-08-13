import { contentEvent } from "@packages/server-events";

export async function runEmitServerEvent(payload: {
   event: string;
   data: any;
}) {
   const { event, data } = payload;
   try {
      contentEvent.emit(event, data);
      return { success: true };
   } catch (error) {
      console.error(
         `[runEmitServerEvent] Error emitting event '${event}':`,
         error,
      );
      throw error;
   }
}
