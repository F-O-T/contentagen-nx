import { Body, Container, Head, Html, Tailwind } from "@react-email/components";
import type { ReactNode } from "react";

export const DefaultEmailLayout = ({ children }: { children: ReactNode }) => {
   return (
      <Html>
         <Head />
         <Tailwind>
            <Body className="p-8">
               <Container className="bg-neutral-200 p-2 rounded-lg">
                  {children}
               </Container>
            </Body>
         </Tailwind>
      </Html>
   );
};
