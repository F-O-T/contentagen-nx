import type * as React from "react";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
   CardAction,
} from "./card";
import {
   Credenza,
   CredenzaTrigger,
   CredenzaContent,
   CredenzaBody,
   CredenzaHeader,
   CredenzaDescription,
   CredenzaTitle,
} from "./credenza";
import { Info as InfoIcon } from "lucide-react";
import { Button } from "./button";

type Values = {
   title: string;
   description: string;
   value: number | string;
};
interface DetailsProps {
   className?: string;
   title: Values["title"];
   description: Values["description"];
   value: Values["value"];
   details?: Values[];
}

function StatsContent({
   className,
   title,
   description,
   value,
   showAction,
}: {
   className?: string;
   title: Values["title"];
   description: Values["description"];
   value: Values["value"];
   showAction?: React.ReactNode;
}) {
   return (
      <Card className={className ?? "col-span-1 h-full w-full"}>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            {showAction ? <CardAction>{showAction}</CardAction> : null}
         </CardHeader>
         <CardContent className="font-bold text-4xl">{value}</CardContent>
      </Card>
   );
}

export function StatsCard({ className, details, ...props }: DetailsProps) {
   const content = (
      <StatsContent
         className={className}
         title={props.title}
         description={props.description}
         value={props.value}
      />
   );

   // If no details prop provided, render the card as-is
   if (!details) return content;

   // When details are provided, render a card with a CardAction that opens a Credenza
   return (
      <Credenza>
         <div className="col-span-1">
            <StatsContent
               className={className}
               title={props.title}
               description={props.description}
               value={props.value}
               showAction={
                  <CredenzaTrigger>
                     <Button variant="ghost" size="icon">
                        <InfoIcon />
                     </Button>
                  </CredenzaTrigger>
               }
            />
         </div>

         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Details</CredenzaTitle>
               <CredenzaDescription>
                  More information about {props.title.toLowerCase()}
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {details.map((detail) => (
                  <StatsContent
                     key={detail.title}
                     className="w-full"
                     title={detail.title}
                     description={detail.description}
                     value={detail.value}
                  />
               ))}
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
