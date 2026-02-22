import type { RefObject } from "react";
import { useEffect, useRef } from "react";

export function useEventListener<K extends keyof WindowEventMap>(
   eventName: K,
   handler: (event: WindowEventMap[K]) => void,
   target:
      | Document
      | Window
      | HTMLElement
      | RefObject<HTMLElement | null>
      | null = null,
   options?: boolean | AddEventListenerOptions,
): void {
   const handlerRef = useRef(handler);
   handlerRef.current = handler;

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
      const stableHandler = (e: Event) =>
         handlerRef.current(e as WindowEventMap[K]);
      el.addEventListener(eventName, stableHandler, options);
      return () => el.removeEventListener(eventName, stableHandler, options);
   }, [eventName, defaultTarget, options]);
}
