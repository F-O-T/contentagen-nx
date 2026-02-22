import { describe, expect, test } from "bun:test";
import {
   AUTOCOMPLETE_MODELS,
   CONTENT_MODELS,
   DEFAULT_AUTOCOMPLETE_MODEL_ID,
   DEFAULT_CONTENT_MODEL_ID,
   DEFAULT_EDIT_MODEL_ID,
   EDIT_MODELS,
   getModelPreset,
   type ModelPreset,
} from "../models";

describe("getModelPreset", () => {
   test("returns the model preset for a known content model id", () => {
      const preset = getModelPreset(
         CONTENT_MODELS,
         DEFAULT_CONTENT_MODEL_ID,
         DEFAULT_CONTENT_MODEL_ID,
      );
      expect(preset).toBeDefined();
      expect(typeof preset.temperature).toBe("number");
      expect(typeof preset.topP).toBe("number");
      expect(typeof preset.maxTokens).toBe("number");
   });

   test("falls back to defaultId when id is undefined", () => {
      const defaultPreset = CONTENT_MODELS[DEFAULT_CONTENT_MODEL_ID];
      const preset = getModelPreset(
         CONTENT_MODELS,
         undefined,
         DEFAULT_CONTENT_MODEL_ID,
      );
      expect(preset).toEqual(defaultPreset);
   });

   test("falls back to defaultId when id is not in the catalog", () => {
      const defaultPreset = CONTENT_MODELS[DEFAULT_CONTENT_MODEL_ID];
      const preset = getModelPreset(
         CONTENT_MODELS,
         "nonexistent/model",
         DEFAULT_CONTENT_MODEL_ID,
      );
      expect(preset).toEqual(defaultPreset);
   });

   test("returns the specific model preset when id exists", () => {
      const knownId = Object.keys(
         CONTENT_MODELS,
      )[1] as keyof typeof CONTENT_MODELS;
      const preset = getModelPreset(
         CONTENT_MODELS,
         knownId,
         DEFAULT_CONTENT_MODEL_ID,
      );
      expect(preset).toEqual(CONTENT_MODELS[knownId]);
   });

   test("works for AUTOCOMPLETE_MODELS catalog", () => {
      const preset = getModelPreset(
         AUTOCOMPLETE_MODELS,
         DEFAULT_AUTOCOMPLETE_MODEL_ID,
         DEFAULT_AUTOCOMPLETE_MODEL_ID,
      );
      expect(preset).toBeDefined();
      expect(preset.maxTokens).toBeLessThanOrEqual(200);
   });

   test("works for EDIT_MODELS catalog", () => {
      const preset = getModelPreset(
         EDIT_MODELS,
         DEFAULT_EDIT_MODEL_ID,
         DEFAULT_EDIT_MODEL_ID,
      );
      expect(preset).toBeDefined();
      expect(typeof preset.temperature).toBe("number");
   });

   test("all content model presets have required fields", () => {
      for (const [id, preset] of Object.entries(CONTENT_MODELS)) {
         const p = preset as ModelPreset;
         expect(p.label, `${id} missing label`).toBeTruthy();
         expect(typeof p.temperature, `${id} temperature`).toBe("number");
         expect(typeof p.topP, `${id} topP`).toBe("number");
         expect(typeof p.maxTokens, `${id} maxTokens`).toBe("number");
      }
   });

   test("all autocomplete model presets have required fields", () => {
      for (const [id, preset] of Object.entries(AUTOCOMPLETE_MODELS)) {
         const p = preset as ModelPreset;
         expect(p.label, `${id} missing label`).toBeTruthy();
         expect(typeof p.temperature, `${id} temperature`).toBe("number");
         expect(typeof p.maxTokens, `${id} maxTokens`).toBe("number");
      }
   });

   test("DEFAULT_CONTENT_MODEL_ID points to a model marked as default", () => {
      const preset = CONTENT_MODELS[DEFAULT_CONTENT_MODEL_ID] as ModelPreset;
      expect(preset.default).toBe(true);
   });

   test("DEFAULT_AUTOCOMPLETE_MODEL_ID points to a model marked as default", () => {
      const preset = AUTOCOMPLETE_MODELS[
         DEFAULT_AUTOCOMPLETE_MODEL_ID
      ] as ModelPreset;
      expect(preset.default).toBe(true);
   });

   test("DEFAULT_EDIT_MODEL_ID points to a model marked as default", () => {
      const preset = EDIT_MODELS[DEFAULT_EDIT_MODEL_ID] as ModelPreset;
      expect(preset.default).toBe(true);
   });
});
