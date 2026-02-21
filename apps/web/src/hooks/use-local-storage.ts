import { useIsomorphicLayoutEffect } from "@dnd-kit/utilities";
import { useCallback, useState } from "react";

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * SSR-safe replacement for useLocalStorage.
 * Returns initialValue on the server and during the first client render,
 * then syncs with localStorage synchronously on client mount via
 * useIsomorphicLayoutEffect (prevents flash between server and real value).
 */
export function useSafeLocalStorage<T>(
   key: string,
   initialValue: T,
): [T, SetValue<T>] {
   const [storedValue, setStoredValue] = useState<T>(initialValue);

   useIsomorphicLayoutEffect(() => {
      try {
         const item = window.localStorage.getItem(key);
         if (item !== null) {
            setStoredValue(JSON.parse(item) as T);
         }
      } catch {
         // localStorage unavailable or corrupt — keep initialValue
      }
   }, [key]);

   const setValue: SetValue<T> = useCallback(
      (value) => {
         setStoredValue((prev) => {
            const next =
               typeof value === "function"
                  ? (value as (p: T) => T)(prev)
                  : value;
            try {
               window.localStorage.setItem(key, JSON.stringify(next));
            } catch {
               // localStorage unavailable — state still updates in memory
            }
            return next;
         });
      },
      [key],
   );

   return [storedValue, setValue];
}
