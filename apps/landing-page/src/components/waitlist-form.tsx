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
import { useCallback } from "react";

export const WaitlistForm = () => {
  const form = useAppForm({
    defaultState: {
      isValid: false,
    },
    defaultValues: {
      email: "",
      role: "user",
    },
    onSubmit: (data) => {
      console.log("Form submitted with data:", data);
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
        <form.AppField name="role">
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
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
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
