import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { PasswordInput } from "@packages/ui/components/password-input";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useSignIn } from "../lib/use-sign-in";
import { Separator } from "@packages/ui/components/separator";
export function SignInPage() {
   const { handleSubmit, form, handleGoogleSignIn } = useSignIn();
   return (
      <Card className="border shadow-xl transition-all duration-300 border-muted/50 bg-card backdrop-blur-xl animate-in fade-in-50 slide-in-from-bottom-6">
         <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight text-center ">
               Sign In
            </CardTitle>
            <CardDescription className="text-base text-center text-muted-foreground/60">
               Enter your details to access your account.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <Button
               className="w-full bg-muted/50"
               variant="outline"
               onClick={handleGoogleSignIn}
            >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>Google</title>
                  <path
                     d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                     fill="currentColor"
                  />
               </svg>{" "}
               Sign in with Google
            </Button>
            <Separator />
            <form className="space-y-4 " onSubmit={(e) => handleSubmit(e)}>
               <form.AppField name="email">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>Email</field.FieldLabel>
                        <Input
                           autoComplete="email"
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Enter your email"
                           type="email"
                           value={field.state.value}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>
               <form.AppField name="password">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>Password</field.FieldLabel>
                        <PasswordInput
                           autoComplete="current-password"
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Enter your password"
                           value={field.state.value}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>
               <form.Subscribe>
                  {(formState) => (
                     <Button
                        className=" w-full shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                        disabled={
                           !formState.canSubmit || formState.isSubmitting
                        }
                        type="submit"
                        variant="default"
                     >
                        Sign In
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                     </Button>
                  )}
               </form.Subscribe>
            </form>
         </CardContent>
         <CardFooter className="space-y-4 flex flex-col justify-center items-center">
            <Link
               className="text-sm block underline text-muted-foreground text-center"
               to="/auth/forgot-password"
            >
               Forgot your password
            </Link>
            <p className="text-sm text-center">
               Don't have an account?
               <Link
                  className="ml-1 underline text-muted-foreground"
                  to="/auth/sign-up"
               >
                  Create account
               </Link>
            </p>
         </CardFooter>
      </Card>
   );
}
