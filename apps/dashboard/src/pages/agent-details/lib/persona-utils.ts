/**
 * Utility functions to extract persona data from the new PersonaConfig structure
 */

export function extractPersonaDisplayData(personaConfig: any) {
  return {
    name: personaConfig.metadata?.name || "",
    description: personaConfig.metadata?.description || "",
    contentType: personaConfig.purpose || "",
    voiceTone: personaConfig.voice?.communication || "",
    targetAudience: personaConfig.audience?.base || "",
    formattingStyle: personaConfig.formatting?.style || "",
    language: personaConfig.language?.primary || "",
    languageVariant: personaConfig.language?.variant || "",
    brandIntegration: personaConfig.brand?.integrationStyle || "",
  };
}

export function formatPersonaValue(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getPersonaDisplayValue(value: string | undefined): string {
  if (!value) return "Not specified";
  return formatPersonaValue(value);
}