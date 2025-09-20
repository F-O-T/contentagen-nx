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
import { PasswordInput } from "@packages/ui/components/password-input";
import { defineStepper } from "@packages/ui/components/stepper";
import { Link } from "@tanstack/react-router";
import { useSignUp } from "../lib/use-sign-up";

const steps = [
   { id: "basic-info", title: "basic-info" },
   { id: "password", title: "password" },
] as const;

const { Stepper } = defineStepper(...steps);

export function SignUpPage() {
   const { handleSubmit, form } = useSignUp();

   return (
      <Stepper.Provider>
         {({ methods }) => (
            <Card>
               <CardHeader>
                  <CardTitle className="text-3xl font-bold tracking-tight text-center ">
                     {translate("pages.sign-up.title")}
                  </CardTitle>
                  <CardDescription className="text-base text-center text-muted-foreground/60">
                     {translate("pages.sign-up.description")}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Stepper.Navigation>
                     {steps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id}></Stepper.Step>
                     ))}
                  </Stepper.Navigation>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                     {methods.switch({
                        "basic-info": () => (
                           <>
                              <form.AppField name="name">
                                 {(field) => (
                                    <field.FieldContainer>
                                       <field.FieldLabel>
                                          {translate(
                                             "pages.sign-up.form.name.label",
                                          )}
                                       </field.FieldLabel>
                                       <Input
                                          value={field.state.value}
                                          id={field.name}
                                          name={field.name}
                                          placeholder={translate(
                                             "pages.sign-up.form.name.placeholder",
                                          )}
                                          autoComplete="name"
                                          onBlur={field.handleBlur}
                                          onChange={(e) =>
                                             field.handleChange(e.target.value)
                                          }
                                       />
                                       <field.FieldMessage />
                                    </field.FieldContainer>
                                 )}
                              </form.AppField>
                              <form.AppField name="email">
                                 {(field) => (
                                    <field.FieldContainer>
                                       <field.FieldLabel>
                                          {translate(
                                             "pages.sign-up.form.email.label",
                                          )}
                                       </field.FieldLabel>
                                       <Input
                                          value={field.state.value}
                                          id={field.name}
                                          name={field.name}
                                          type="email"
                                          placeholder={translate(
                                             "pages.sign-up.form.email.placeholder",
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
                           </>
                        ),
                        password: () => (
                           <>
                              <form.AppField name="password">
                                 {(field) => (
                                    <field.FieldContainer>
                                       <field.FieldLabel>
                                          {translate(
                                             "pages.sign-up.form.password.label",
                                          )}
                                       </field.FieldLabel>
                                       <PasswordInput
                                          value={field.state.value}
                                          id={field.name}
                                          name={field.name}
                                          placeholder={translate(
                                             "pages.sign-up.form.password.placeholder",
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
                                             "pages.sign-up.form.confirm-password.label",
                                          )}
                                       </field.FieldLabel>
                                       <PasswordInput
                                          value={field.state.value}
                                          id={field.name}
                                          name={field.name}
                                          placeholder={translate(
                                             "pages.sign-up.form.confirm-password.placeholder",
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
                           {translate("pages.sign-up.form.previous")}
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
                                    {translate("pages.sign-up.form.submit")}
                                 </Button>
                              )}
                           </form.Subscribe>
                        ) : (
                           <form.Subscribe
                              selector={(state) => ({
                                 nameValue: state.values.name,
                                 emailValue: state.values.email,
                                 fieldMeta: state.fieldMeta,
                              })}
                           >
                              {({ nameValue, emailValue, fieldMeta }) => {
                                 const nameErrors = fieldMeta?.name?.errors;
                                 const emailErrors = fieldMeta?.email?.errors;

                                 const isNameValid =
                                    nameValue?.trim() !== "" &&
                                    (!nameErrors || nameErrors.length === 0);
                                 const isEmailValid =
                                    emailValue?.trim() !== "" &&
                                    (!emailErrors || emailErrors.length === 0);
                                 const canGoNext = isNameValid && isEmailValid;

                                 return (
                                    <Button
                                       onClick={methods.next}
                                       type="button"
                                       disabled={!canGoNext}
                                    >
                                       {translate("pages.sign-up.form.next")}
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
                     {translate("pages.sign-up.footer.have-account")}
                     <Link
                        to="/auth/sign-in"
                        className="ml-1 underline text-muted-foreground"
                     >
                        {translate("pages.sign-up.footer.sign-in-link")}
                     </Link>
                  </p>
               </CardFooter>
            </Card>
         )}
      </Stepper.Provider>
   );
}
