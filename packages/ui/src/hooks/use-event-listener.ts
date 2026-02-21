import type { RefObject } from "react";
import { useEffect } from "react";

export function useEventListener<K extends keyof WindowEventMap>(
   eventName: K,
   handler: (event: WindowEventMap[K]) => void,
   target: Document | Window | HTMLElement | RefObject<HTMLElement | null> | null = null,
   options?: boolean | AddEventListenerOptions,
): void {
   const resolved =
      typeof document !== "undefined" ? document : (null as Document | null);
   const defaultTarget = target ?? resolved;

   useEffect(() => {
      const el =
         defaultTarget === null
            ? null
            : "current" in defaultTarget
               ? defaultTarget.current
               : defaultTarget;
      if (!el) return;
      el.addEventListener(eventName, handler as EventListener, options);
      return () =>
         el.removeEventListener(eventName, handler as EventListener, options);
   }, [eventName, handler, defaultTarget, options]);
}
