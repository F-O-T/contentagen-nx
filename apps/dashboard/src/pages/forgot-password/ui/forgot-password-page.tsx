import { translate } from "@packages/localization";
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
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSeparator,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { Link } from "@tanstack/react-router";
import { useForgotPassword } from "../lib/use-forgot-password";

const steps = [
   { id: "enter-email", title: "enter-email" },
   { id: "enter-otp-password", title: "enter-otp-password" },
] as const;

const { Stepper } = defineStepper(...steps);

export function ForgotPasswordPage() {
   const { form, sendOtp, handleSubmit, sendingOtp } = useForgotPassword();

   return (
      <Stepper.Provider>
         {({ methods }) => (
            <Card>
               <CardHeader>
                  <CardTitle className="text-3xl font-bold tracking-tight text-center">
                     {translate("pages.forgot-password.title")}
                  </CardTitle>
                  <CardDescription className="text-base text-center text-muted-foreground/60">
                     {methods.current.id === "enter-email"
                        ? translate(
                             "pages.forgot-password.descriptions.enter-email",
                          )
                        : translate(
                             "pages.forgot-password.descriptions.enter-otp-password",
                          )}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id} />
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "enter-email": () => (
                           <form.AppField name="email">
                              {(field) => (
                                 <field.FieldContainer>
                                    <field.FieldLabel>
                                       {translate(
                                          "pages.forgot-password.form.email.label",
                                       )}
                                    </field.FieldLabel>
                                    <Input
                                       value={field.state.value}
                                       id={field.name}
                                       name={field.name}
                                       type="email"
                                       placeholder={translate(
                                          "pages.forgot-password.form.email.placeholder",
                                       )}
                                       autoComplete="email"
                                       onBlur={field.handleBlur}
                                       onChange={(e) =>
                                          field.handleChange(e.target.value)
                                       }
                                    />
                                    <field.FieldMessage />
                                 </field.FieldContainer>
                              )}
                           </form.AppField>
                        ),
                        "enter-otp-password": () => (
                           <>
                              <form.AppField name="otp">
                                 {(field) => (
                                    <field.FieldContainer className="flex flex-col items-center">
                                       <field.FieldLabel>
                                          {translate(
                                             "pages.forgot-password.form.otp.label",
                                          )}
                                       </field.FieldLabel>
                                       <InputOTP
                                          value={field.state.value}
                                          onBlur={field.handleBlur}
                                          onChange={field.handleChange}
                                          maxLength={6}
                                          autoComplete="one-time-code"
                                          className="gap-2 "
                                       >
                                          <InputOTPGroup>
                                             <InputOTPSlot index={0} />
                                             <InputOTPSlot index={1} />
                                          </InputOTPGroup>
                                          <InputOTPSeparator />
                                          <InputOTPGroup>
                                             <InputOTPSlot index={2} />
                                             <InputOTPSlot index={3} />
                                          </InputOTPGroup>
                                          <InputOTPSeparator />
                                          <InputOTPGroup>
                                             <InputOTPSlot index={4} />
                                             <InputOTPSlot index={5} />
                                          </InputOTPGroup>
                                       </InputOTP>
                                       <field.FieldMessage />
                                    </field.FieldContainer>
                                 )}
                              </form.AppField>
                              <form.AppField name="password">
                                 {(field) => (
                                    <field.FieldContainer>
                                       <field.FieldLabel>
                                          {translate(
                                             "pages.forgot-password.labels.new-password",
                                          )}
                                       </field.FieldLabel>
                                       <PasswordInput
                                          value={field.state.value}
                                          id={field.name}
                                          name={field.name}
                                          placeholder={translate(
                                             "pages.forgot-password.placeholders.enter-new-password",
                                          )}
                                          autoComplete="new-password"
                                          onBlur={field.handleBlur}
                                          onChange={(e) =>
                                             field.handleChange(e.target.value)
                                          }
                                       />
                                       <field.FieldMessage />
                                    </field.FieldContainer>
                                 )}
                              </form.AppField>
                              <form.AppField name="confirmPassword">
                                 {(field) => (
                                    <field.FieldContainer>
                                       <field.FieldLabel>
                                          {translate(
                                             "pages.forgot-password.labels.confirm-new-password",
                                          )}
                                       </field.FieldLabel>
                                       <PasswordInput
                                          value={field.state.value}
                                          id={field.name}
                                          name={field.name}
                                          placeholder={translate(
                                             "pages.forgot-password.placeholders.confirm-new-password",
                                          )}
                                          autoComplete="new-password"
                                          onBlur={field.handleBlur}
                                          onChange={(e) =>
                                             field.handleChange(e.target.value)
                                          }
                                       />
                                       <field.FieldMessage />
                                    </field.FieldContainer>
                                 )}
                              </form.AppField>
                           </>
                        ),
                     })}
                     <Stepper.Controls className="flex w-full justify-between">
                        <Button
                           variant="outline"
                           onClick={methods.prev}
                           disabled={methods.isFirst}
                           type="button"
                        >
                           {translate("pages.forgot-password.actions.previous")}
                        </Button>
                        {methods.isLast ? (
                           <form.Subscribe>
                              {(formState) => (
                                 <Button
                                    disabled={
                                       !formState.canSubmit ||
                                       formState.isSubmitting
                                    }
                                    variant="default"
                                    className="shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                                    type="submit"
                                 >
                                    {translate(
                                       "pages.forgot-password.actions.reset-password",
                                    )}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <form.Subscribe
                              selector={(state) => ({
                                 emailValue: state.values.email,
                                 fieldMeta: state.fieldMeta,
                              })}
                           >
                              {({ emailValue, fieldMeta }) => {
                                 const emailErrors = fieldMeta?.email?.errors;
                                 const isEmailValid =
                                    emailValue?.trim() !== "" &&
                                    (!emailErrors || emailErrors.length === 0);
                                 return (
                                    <Button
                                       onClick={async () => {
                                          await sendOtp(emailValue);
                                          methods.next();
                                       }}
                                       type="button"
                                       disabled={!isEmailValid || sendingOtp}
                                    >
                                       {translate(
                                          "pages.forgot-password.actions.next",
                                       )}
                                    </Button>
                                 );
                              }}
                           </form.Subscribe>
                        )}
                     </Stepper.Controls>
                  </form>
               </CardContent>
               <CardFooter className="flex items-center justify-center">
                  <p className="text-sm text-center">
                     {translate(
                        "pages.forgot-password.actions.remembered-password",
                     )}
                     <Link
                        to="/auth/sign-in"
                        className="ml-1 underline text-muted-foreground"
                     >
                        {translate("pages.forgot-password.actions.sign-in")}
                     </Link>
                  </p>
               </CardFooter>
            </Card>
         )}
      </Stepper.Provider>
   );
}
