// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProductSelectionStep } from "@/features/onboarding/ui/product-selection-step";

// Mock useEarlyAccess hook
vi.mock("@/hooks/use-early-access", () => ({
	useEarlyAccess: vi.fn(),
}));

// Mock orpc client
vi.mock("@/integrations/orpc/client", () => ({
	orpc: {
		onboarding: {
			selectProducts: {
				mutationOptions: () => ({
					mutationKey: ["onboarding.selectProducts"],
					mutationFn: async () => ({ success: true }),
				}),
			},
		},
	},
}));

import { useEarlyAccess } from "@/hooks/use-early-access";

function renderWithClient(component: React.ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<Suspense fallback={null}>{component}</Suspense>
		</QueryClientProvider>,
	);
}

describe("ProductSelectionStep", () => {
	it("should hide forms product when user is not enrolled in forms-beta", () => {
		// Mock useEarlyAccess to return not enrolled for forms-beta
		vi.mocked(useEarlyAccess).mockReturnValue({
			loaded: true,
			enrolledFeatures: new Set(),
			features: [],
			isEnrolled: (flagKey: string) => false,
			updateEnrollment: vi.fn(),
			isBannerVisible: false,
			dismissBanner: vi.fn(),
		});

		const onNext = vi.fn();
		const onSkipToEnd = vi.fn();

		renderWithClient(
			<ProductSelectionStep onNext={onNext} onSkipToEnd={onSkipToEnd} />,
		);

		// Content and Analytics should be visible
		expect(
			screen.getByText("Criar e publicar conteudo"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Acompanhar performance do conteudo"),
		).toBeInTheDocument();

		// Forms should NOT be visible
		expect(
			screen.queryByText("Coletar leads com formularios"),
		).not.toBeInTheDocument();
	});

	it("should show forms product when user is enrolled in forms-beta", () => {
		// Mock useEarlyAccess to return enrolled for forms-beta
		vi.mocked(useEarlyAccess).mockReturnValue({
			loaded: true,
			enrolledFeatures: new Set(["forms-beta"]),
			features: [],
			isEnrolled: (flagKey: string) => flagKey === "forms-beta",
			updateEnrollment: vi.fn(),
			isBannerVisible: false,
			dismissBanner: vi.fn(),
		});

		const onNext = vi.fn();
		const onSkipToEnd = vi.fn();

		renderWithClient(
			<ProductSelectionStep onNext={onNext} onSkipToEnd={onSkipToEnd} />,
		);

		// All three products should be visible
		expect(
			screen.getByText("Criar e publicar conteudo"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Coletar leads com formularios"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Acompanhar performance do conteudo"),
		).toBeInTheDocument();
	});
});
