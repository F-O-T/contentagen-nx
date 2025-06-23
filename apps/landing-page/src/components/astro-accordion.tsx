import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Accordion as BaseAccordion,
} from "@packages/ui/components/accordion";

interface Props {
  data: {
    title: string;
    description: string;
  }[];
}

export function AstroAccordion({ data }: Props) {
  return (
    <BaseAccordion className=" space-y-4" collapsible type="single">
      {data.map((item, i) => {
        return (
          <AccordionItem
            className="bg-accent/30  border border-primary/20 rounded-xl p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
            key={`item-${i.toFixed()}`}
            value={`item-${i.toFixed()}`}
          >
            <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
              {item.title}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2">
              {item.description}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </BaseAccordion>
  );
}
