import { s as shimExports } from "../../../_libs/use-sync-external-store.mjs";
function useIsHydrated() {
  return shimExports.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
function subscribe() {
  return () => {
  };
}
export {
  useIsHydrated as u
};
