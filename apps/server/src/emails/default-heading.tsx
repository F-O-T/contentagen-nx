import brand from "@packages/brand/index.json";
import { Heading, Img, Section } from "@react-email/components";
// biome-ignore lint/correctness/noUnusedImports: <this is a React component>
import React from "react";
export const DefaultHeading = () => {
   return (
      <Section>
         <Img
            alt={brand.name}
            className="w-20 h-20 rounded-full border-2 border-[var(--color-border)] shadow-sm mx-auto"
         />
         <Heading className="text-center">{brand.name}</Heading>
      </Section>
   );
};
