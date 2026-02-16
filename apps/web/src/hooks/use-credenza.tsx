import { Credenza, CredenzaContent } from "@packages/ui/components/credenza";
import { Store, useStore } from "@tanstack/react-store";

const credenzaStore = new Store({
   children: null as React.ReactNode | null,
   isOpen: false,
   className: undefined as string | undefined,
});

export const openCredenza = ({
   children,
   className,
}: {
   children: React.ReactNode;
   className?: string;
}) =>
   credenzaStore.setState((state) => ({
      ...state,
      children,
      className,
      isOpen: true,
   }));

export const closeCredenza = () =>
   credenzaStore.setState((state) => ({
      ...state,
      children: null,
      isOpen: false,
   }));

export const useCredenza = () => {
   return {
      closeCredenza,
      openCredenza,
   };
};

export function GlobalCredenza() {
   const { children, isOpen, className } = useStore(credenzaStore);

   return (
      <Credenza
         onOpenChange={(open) => {
            credenzaStore.setState((state) => ({ ...state, isOpen: open }));
         }}
         open={isOpen}
      >
         <CredenzaContent className={className}>{children}</CredenzaContent>
      </Credenza>
   );
}
