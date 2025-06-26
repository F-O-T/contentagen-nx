import type { FormApi } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { FileText, Lightbulb } from "lucide-react";
import type { WriteInstructionsFormData } from ".";

interface WriteInstructionsFormProps {
  form: FormApi<WriteInstructionsFormData>;
}

export function WriteInstructions({ form }: WriteInstructionsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          Writing Instructions
        </CardTitle>
        <CardDescription>
          Provide detailed instructions for how your agent should write content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <form.AppField name="basePrompt">
            {(field) => (
              <field.FieldContainer>
                <field.FieldLabel>
                  Instructions for your AI agent
                </field.FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
                  placeholder="You are an expert content writer specializing in..."
                  type="text"
                  value={String(field.state.value)}
                />
                <field.FieldMessage />
              </field.FieldContainer>
            )}
          </form.AppField>
          <div className="mt-3 p-3 bg-primary/10 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm text-primary">
                <p className="font-medium mb-1">Tips for great instructions:</p>
                <ul className="list-disc list-inside space-y-1 text-primary">
                  <li>Be specific about writing style and structure</li>
                  <li>Mention what to include (examples, statistics, etc.)</li>
                  <li>Specify the desired outcome or goal</li>
                  <li>Include any formatting preferences</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
