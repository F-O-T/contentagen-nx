// @vitest-environment jsdom

import { useSurveys } from "@packages/posthog/client";
import { cleanup, render, screen } from "@testing-library/react";
import type { Survey } from "posthog-js";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EarlyAccessBanner } from "@/features/billing/ui/early-access-banner";

vi.mock("@packages/posthog/client", () => ({
   useSurveys: vi.fn(),
}));

const createSurveysState = (
   overrides: Partial<ReturnType<typeof useSurveys>> = {},
): ReturnType<typeof useSurveys> => ({
   activeSurveys: [],
   captureSurveyDismissed: vi.fn(),
   captureSurveySent: vi.fn(),
   captureSurveyShown: vi.fn(),
   loaded: false,
   surveys: [],
   ...overrides,
});

const baseTemplate = {
   badgeLabel: "Acesso antecipado",
   message:
      "Estamos aprimorando estes dashboards — tem perguntas, ideias ou bugs?",
   ctaLabel: "Fale com a gente",
   bullets: [
      "Dados de uso atualizados diariamente (UTC) — os numeros de hoje aparecem amanha",
      "Gastos historicos e periodos de cobranca sao baseados no plano atual",
      "Para mais detalhes por evento, expanda os cards de produto na aba Overview",
   ],
};

type TemplateWithSurvey = typeof baseTemplate & { surveyId?: string };
const EarlyAccessBannerComponent =
   EarlyAccessBanner as unknown as ComponentType<{
      template: TemplateWithSurvey;
   }>;

describe("EarlyAccessBanner", () => {
   afterEach(() => {
      cleanup();
   });

   it("disables the CTA when no survey is available", () => {
      vi.mocked(useSurveys).mockReturnValue(createSurveysState());

      render(<EarlyAccessBannerComponent template={baseTemplate} />);

      const cta = screen.getByRole("button", { name: baseTemplate.ctaLabel });
      expect((cta as HTMLButtonElement).disabled).toBe(true);
   });

   it("enables the CTA when a survey is available", () => {
      vi.mocked(useSurveys).mockReturnValue(
         createSurveysState({
            activeSurveys: [{ id: "survey-1" } as Survey],
            loaded: true,
         }),
      );

      render(<EarlyAccessBannerComponent template={baseTemplate} />);

      const cta = screen.getByRole("button", { name: baseTemplate.ctaLabel });
      expect((cta as HTMLButtonElement).disabled).toBe(false);
   });

   it("enables the CTA when template surveyId is provided", () => {
      vi.mocked(useSurveys).mockReturnValue(
         createSurveysState({ loaded: true }),
      );

      render(
         <EarlyAccessBannerComponent
            template={{ ...baseTemplate, surveyId: "survey-42" }}
         />,
      );

      const cta = screen.getByRole("button", { name: baseTemplate.ctaLabel });
      expect((cta as HTMLButtonElement).disabled).toBe(false);
   });
});
