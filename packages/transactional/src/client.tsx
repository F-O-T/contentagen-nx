import type { Resend } from "resend";
import MagicLinkEmail from "./emails/magic-link";
import OrganizationInvitationEmail from "./emails/organization-invitation";
import OTPEmail from "./emails/otp";

export { getResendClient, type ResendClient } from "./utils";

export interface SendEmailOTPOptions {
   email: string;
   otp: string;
   type: "sign-in" | "email-verification" | "forget-password";
}

export interface SendOrganizationInvitationOptions {
   email: string;
   invitedByUsername: string;
   invitedByEmail: string;
   teamName: string;
   inviteLink: string;
}
const name = "Contentta";
export const sendOrganizationInvitation = async (
   client: Resend,
   {
      email,
      invitedByUsername,
      invitedByEmail,
      teamName,
      inviteLink,
   }: SendOrganizationInvitationOptions,
) => {
   const subject = `Convite para se juntar à equipe ${teamName} no Contentta`;
   await client.emails.send({
      from: `${name} <suporte@mail.contentta.co>`,
      react: (
         <OrganizationInvitationEmail
            invitedByEmail={invitedByEmail}
            invitedByUsername={invitedByUsername}
            inviteLink={inviteLink}
            teamName={teamName}
         />
      ),
      subject,
      to: email,
   });
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
      from: `${name} <suporte@mail.contentta.co>`,
      react: <OTPEmail otp={otp} type={type} />,
      subject: getSubject(),
      to: email,
   });
};

export interface SendMagicLinkEmailOptions {
   email: string;
   magicLinkUrl: string;
}

export const sendMagicLinkEmail = async (
   client: Resend,
   { email, magicLinkUrl }: SendMagicLinkEmailOptions,
) => {
   const subject = "Acesse sua conta Contentta";
   await client.emails.send({
      from: `${name} <suporte@mail.contentta.co>`,
      react: <MagicLinkEmail magicLinkUrl={magicLinkUrl} />,
      subject,
      to: email,
   });
};
