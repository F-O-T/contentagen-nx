import { createEdenAdapter, type EdenClientType } from "@packages/eden";
import { Button } from "@packages/ui/components/button";
import { useAppForm } from "@packages/ui/components/form";
import { Input } from "@packages/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/ui/components/select";
import type React from "react";
import { useCallback, useState } from "react";
import { VITE_SERVER_URL } from "astro:env/client";
type LeadType = Parameters<EdenClientType["waitlist"]["post"]>["0"]["leadType"];
export const WaitlistForm = () => {
  const eden = createEdenAdapter(VITE_SERVER_URL);

  const [leadTypes] = useState([
    "individual blogger",
    "marketing team",
    "freelance writer",
    "business owner",
    "other",
  ]);

  const form = useAppForm({
    defaultState: {
      canSubmit: false,
    },
    defaultValues: {
      email: "",
      leadType: "",
    },
    onSubmit: async (data) => {
      await eden.waitlist.post({
        email: data.value.email,
        leadType: data.value.leadType as LeadType,
      });
    },
  });
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  }, []);
  return (
    <form className="" onSubmit={(e) => handleSubmit(e)}>
      <div className="w-full">
        <div className="flex gap-4">
          <form.AppField name="email">
            {(field) => (
              <field.FieldContainer>
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
          <form.Subscribe>
            {(formState) => (
              <Button
                className="  shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                disabled={!formState.canSubmit || formState.isSubmitting}
                type="submit"
                variant="default"
              >
                Send
              </Button>
            )}
          </form.Subscribe>
        </div>
        <form.AppField name="leadType">
          {(field) => (
            <field.FieldContainer className="w-full">
              <Select
                onValueChange={(value) => field.handleChange(value)}
                value={field.state.value}
              >
                <SelectTrigger
                  className="w-full mt-2"
                  id={field.name}
                  name={field.name}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {leadTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/\b\w/g, (char) => char.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <field.FieldMessage />
            </field.FieldContainer>
          )}
        </form.AppField>
      </div>
    </form>
  );
};
