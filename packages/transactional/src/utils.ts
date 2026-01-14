import { AppError } from "@packages/utils/errors";
import { Resend } from "resend";

export type ResendClient = Resend;

export const getResendClient = (RESEND_API_KEY: string): ResendClient => {
   if (!RESEND_API_KEY) {
      throw AppError.validation("RESEND_API_KEY is required");
   }
   return new Resend(RESEND_API_KEY);
};
