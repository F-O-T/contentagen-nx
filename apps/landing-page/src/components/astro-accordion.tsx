import {
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
   Accordion as BaseAccordion,
} from "@packages/ui/components/accordion";

interface Props {
   data: {
      id: string;
      question: string;
      answer: string;
   }[];
}

export function AstroAccordion({ data }: Props) {
   return (
      <BaseAccordion collapsible type="single">
         {data.map((item) => {
            return (
               <AccordionItem
                  className="border-b last:border-b-0"
                  key={item.id}
                  value={item.id}
               >
                  <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                     {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                     <p className="text-base">{item.answer}</p>
                  </AccordionContent>
               </AccordionItem>
            );
         })}
      </BaseAccordion>
   );
}
