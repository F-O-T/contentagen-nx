import { Hr, Link, Section, Text } from "@react-email/components";

export const DefaultFooter = () => {
   return (
      <Section
         style={{
            backgroundColor: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            padding: "24px",
            textAlign: "center",
         }}
      >
         <Text
            style={{
               color: "#6b7280",
               fontSize: "13px",
               lineHeight: "20px",
               margin: "0 0 12px 0",
            }}
         >
            Enviado por{" "}
            <Link
               href="https://contentta.co"
               style={{ color: "#C4704A", textDecoration: "none" }}
            >
               Contentta
            </Link>{" "}
            - Gestão de Conteúdo com IA
         </Text>
         <Hr
            style={{
               borderColor: "#e5e7eb",
               borderWidth: "1px",
               margin: "16px 0",
            }}
         />
         <Text
            style={{
               color: "#9ca3af",
               fontSize: "12px",
               lineHeight: "18px",
               margin: 0,
            }}
         >
            {new Date().getFullYear()} Contentta. Todos os direitos reservados.
         </Text>
      </Section>
   );
};
