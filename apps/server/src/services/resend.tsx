import { env } from "@api/config/env";
import OTPEmail from "@api/emails/otp";
import brandConfig from "@packages/brand/index.json";
// biome-ignore lint/correctness/noUnusedImports: <sim>
import React from "react";
import { Resend } from "resend";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendEmailOTP = async (
   email: string,
   otp: string,
   type: "sign-in" | "email-verification" | "forget-password",
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
   await resendClient.emails.send({
      from: `${brandConfig.name} <support@app.contentagen.com>`,
      react: <OTPEmail otp={otp} type={type} />,
      subject: getSubject(),
      to: email,
   });
};
