export const isClientProduction = import.meta.env.PROD;
export const isProduction = process.env.NODE_ENV === "production";

export const getDomain = () => {
   if (process.env.APP_URL) {
      return process.env.APP_URL;
   }
   if (isProduction) {
      return "https://app.contentta.co";
   }

   return "http://localhost:3000";
};
