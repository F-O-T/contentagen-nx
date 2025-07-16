import OTPEmail from "./emails/otp";
import brandConfig from "@packages/brand/index.json";
import { Resend } from "resend";

export interface SendEmailOTPOptions {
   email: string;
   otp: string;
   type: "sign-in" | "email-verification" | "forget-password";
}
export type ResendClient = ReturnType<typeof getResendClient>;
export const getResendClient = (RESEND_API_KEY: string) => {
   if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not defined");
   }
   const internalClient = new Resend(RESEND_API_KEY);
   return internalClient;
};

export const sendEmailOTP = async (
   client: Resend,
   { email, otp, type }: SendEmailOTPOptions,
) => {
   const getSubject = () => {
      switch (type) {
         case "sign-in":
            return "Faça login na sua conta";
         case "email-verification":
            return "Verifique seu e-mail";
         case "forget-password":
            return "Redefina sua senha";
         default:
            return "Verifique seu e-mail";
      }
   };
   await client.emails.send({
      from: `${brandConfig.name} <support@app.contentagen.com>`,
      react: <OTPEmail otp={otp} type={type} />,
      subject: getSubject(),
      to: email,
   });
};
