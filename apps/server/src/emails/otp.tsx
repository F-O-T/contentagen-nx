import { Section, Text } from "@react-email/components";

import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface OTPEmailProps {
   otp: string;
   type: "sign-in" | "email-verification" | "forget-password";
}

// Inline SVG logo from packages/brand/logo.svg

const content = {
   "email-verification": {
      description: "Use o código abaixo para confirmar seu endereço de e-mail.",
      footer: "Este código é válido por 10 minutos.",
      title: "Confirme seu endereço de e-mail",
   },
   "forget-password": {
      description: "Use o código abaixo para redefinir sua senha.",
      footer:
         "Se você não solicitou a redefinição de senha, ignore este e-mail.",
      title: "Redefina sua senha",
   },
   "sign-in": {
      description: "Use o código abaixo para fazer login na sua conta.",
      footer: "Se você não solicitou o login, ignore este e-mail.",
      title: "Faça login na sua conta",
   },
};

export default function OTPEmail({ otp, type }: OTPEmailProps) {
   const { title, description, footer } = content[type];
   return (
      <DefaultEmailLayout>
         <DefaultHeading />
         <Section className="bg-white p-2 space-y-2 rounded-t-lg">
            <Text className="text-xl font-semibold text-foreground text-center">
               {title}
            </Text>
            <Text className="text-muted-foreground text-base text-center ">
               {description}
            </Text>
            <Text className="text-3xl font-bold text-foregorund text-center ">
               {otp.toString().replace(/(\d{2})(?=(\d{2})+(?!\d))/g, "$1-")}
            </Text>
            <Text className="text-muted-foreground text-base text-center ">
               {footer}
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

OTPEmail.PreviewProps = {
   otp: 123456,
   type: "verify",
};
