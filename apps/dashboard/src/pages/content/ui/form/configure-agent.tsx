import type { FormApi } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/ui/components/select";
import { Switch } from "@packages/ui/components/switch";
import { Settings } from "lucide-react";
import type { ConfigureAgentFormData } from ".";

interface ConfigureAgentFormProps {
  form: FormApi<ConfigureAgentFormData>;
}

export function ConfigureAgent({ form }: ConfigureAgentFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary" />
          Configure Your Agent
        </CardTitle>
        <CardDescription>
          Set up the basic parameters for your AI agent's writing style and
          approach.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <form.AppField name="targetAudience">
            {(field) => (
              <field.FieldContainer>
                <field.FieldLabel>Target Audience</field.FieldLabel>
                <Select
                  value={field.state.value as string}
                  onValueChange={(value) => field.handleChange(value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_public">
                      General Public
                    </SelectItem>
                    <SelectItem value="professionals">Professionals</SelectItem>
                    <SelectItem value="beginners">Beginners</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                  </SelectContent>
                </Select>
                <field.FieldMessage />
              </field.FieldContainer>
            )}
          </form.AppField>
          <p className="text-sm text-gray-600 mt-1">
            Who will be reading the content this agent creates?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <form.AppField name="tone">
              {(field) => (
                <field.FieldContainer>
                  <field.FieldLabel>Writing Tone</field.FieldLabel>
                  <Select
                    value={field.state.value as string}
                    onValueChange={(value) => field.handleChange(value)}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">
                        Conversational
                      </SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                  <field.FieldMessage />
                </field.FieldContainer>
              )}
            </form.AppField>
          </div>

          <div>
            <form.AppField name="wordCount">
              {(field) => (
                <field.FieldContainer>
                  <field.FieldLabel>Default Word Count</field.FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(Number(e.target.value))
                    }
                    placeholder="e.g., 1000"
                    type="number"
                    value={field.state.value as number}
                  />
                  <field.FieldMessage />
                </field.FieldContainer>
              )}
            </form.AppField>
          </div>
        </div>

        <div>
          <form.AppField name="seoFocus">
            {(field) => (
              <field.FieldContainer>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="seoFocus"
                    checked={field.state.value as boolean}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                  <field.FieldLabel>Enable SEO optimization</field.FieldLabel>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically optimize content for search engines
                </p>
                <field.FieldMessage />
              </field.FieldContainer>
            )}
          </form.AppField>
        </div>
      </CardContent>
    </Card>
  );
}
