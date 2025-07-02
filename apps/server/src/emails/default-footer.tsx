import brand from "@packages/brand/index.json";
import { Container, Text } from "@react-email/components";

export const DefaultFooter = () => {
   return (
      <Container className="bg-neutral-100 rounded-b-lg">
         <Text className="text-center text-foreground text-base font-semibold">
            {new Date().getFullYear()} - {brand.name}
         </Text>
      </Container>
   );
};
