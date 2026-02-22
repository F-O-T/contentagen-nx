import type { ContenttaEventTracker } from "./events/client.ts";
import type { ContenttaSdkConfig } from "./events/types.ts";
import { createSdk } from "./index.ts";

// ── Type Definitions ────────────────────────────────────────────

/** Minimal typed interface for the forms-related SDK calls used internally. */
interface FormsSubmitResult {
	success: boolean;
	submissionId: string;
	settings: { successMessage?: string; redirectUrl?: string };
}

interface FormsApiClient {
	forms: {
		get: (input: { formId: string }) => Promise<FormDefinition>;
		submit: (input: {
			formId: string;
			data: Record<string, unknown>;
			experimentId?: string;
			variantId?: string;
		}) => Promise<FormsSubmitResult>;
	};
}

interface FormField {
	id: string;
	type:
		| "text"
		| "email"
		| "textarea"
		| "checkbox"
		| "select"
		| "number"
		| "date"
		| "rating"
		| "file";
	label: string;
	placeholder?: string;
	required: boolean;
	options?: string[];
}

interface FormDefinition {
	id: string;
	name: string;
	description?: string;
	fields: FormField[];
	settings?: {
		successMessage?: string;
		redirectUrl?: string;
	};
	title?: string;
	subtitle?: string;
	icon?: string;
	buttonText?: string;
	layout?: "card" | "inline" | "banner";
}

// ── Helpers ─────────────────────────────────────────────────────

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// ── CSS ─────────────────────────────────────────────────────────

const FORM_STYLES = `
.contentta-form {
	--cf-bg: var(--background, #fff);
	--cf-fg: var(--foreground, #09090b);
	--cf-muted: var(--muted, #f4f4f5);
	--cf-muted-fg: var(--muted-foreground, #71717a);
	--cf-border: var(--border, #e4e4e7);
	--cf-radius: var(--radius, 0.5rem);
	--cf-primary: var(--primary, #18181b);
	--cf-primary-fg: var(--primary-foreground, #fafafa);
	--cf-ring: var(--ring, #18181b);
	--cf-destructive: var(--destructive, #ef4444);

	font-family: inherit;
	max-width: 480px;
	margin: 0 auto;
	background: var(--cf-bg);
	color: var(--cf-fg);
	border-radius: var(--cf-radius);
}
.contentta-form__cta {
	margin-bottom: 1.25rem;
}
.contentta-form__cta-icon {
	font-size: 1.75rem;
	margin-bottom: 0.375rem;
}
.contentta-form__cta-title {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.25rem;
	color: var(--cf-fg);
}
.contentta-form__cta-subtitle {
	font-size: 0.875rem;
	color: var(--cf-muted-fg);
	margin: 0;
}
.contentta-form__title {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.25rem;
	color: var(--cf-fg);
}
.contentta-form__description {
	font-size: 0.875rem;
	color: var(--cf-muted-fg);
	margin: 0 0 1.25rem;
}
.contentta-form__field {
	margin-bottom: 1rem;
}
.contentta-form__label {
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	margin-bottom: 0.375rem;
	color: var(--cf-fg);
}
.contentta-form__required {
	color: var(--cf-destructive);
	margin-left: 0.125rem;
}
.contentta-form__input,
.contentta-form__textarea,
.contentta-form__select {
	display: block;
	width: 100%;
	padding: 0.5rem 0.75rem;
	font-size: 0.875rem;
	line-height: 1.5;
	border: 1px solid var(--cf-border);
	border-radius: calc(var(--cf-radius) - 2px);
	background: var(--cf-bg);
	color: var(--cf-fg);
	box-sizing: border-box;
	transition: border-color 0.15s ease;
	font-family: inherit;
}
.contentta-form__input:focus,
.contentta-form__textarea:focus,
.contentta-form__select:focus {
	outline: none;
	border-color: var(--cf-ring);
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--cf-ring) 20%, transparent);
}
.contentta-form__textarea {
	min-height: 5rem;
	resize: vertical;
}
.contentta-form__checkbox-wrapper {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
}
.contentta-form__checkbox {
	margin-top: 0.25rem;
	accent-color: var(--cf-primary);
}
.contentta-form__rating {
	display: flex;
	gap: 0.375rem;
}
.contentta-form__star {
	font-size: 1.5rem;
	cursor: pointer;
	color: var(--cf-border);
	transition: color 0.1s ease;
	background: none;
	border: none;
	padding: 0;
	line-height: 1;
}
.contentta-form__star:hover,
.contentta-form__star--active {
	color: #eab308;
}
.contentta-form__error {
	font-size: 0.75rem;
	color: var(--cf-destructive);
	margin-top: 0.25rem;
	min-height: 0;
}
.contentta-form__submit {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.5rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--cf-primary-fg);
	background: var(--cf-primary);
	border: none;
	border-radius: calc(var(--cf-radius) - 2px);
	cursor: pointer;
	transition: opacity 0.15s ease;
	font-family: inherit;
}
.contentta-form__submit:hover {
	opacity: 0.9;
}
.contentta-form__submit:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}
.contentta-form__success {
	padding: 1rem;
	font-size: 0.875rem;
	color: var(--cf-fg);
	background: color-mix(in srgb, var(--cf-primary) 8%, var(--cf-bg));
	border: 1px solid color-mix(in srgb, var(--cf-primary) 20%, transparent);
	border-radius: var(--cf-radius);
	text-align: center;
}
`;

// ── Forms Client ────────────────────────────────────────────────

const DEFAULT_API_URL = "https://api.contentagen.com";

/**
 * Validate that a redirect URL uses a safe protocol.
 * Blocks javascript:, data:, and other dangerous protocols.
 */
function isSafeRedirectUrl(url: string): boolean {
	try {
		const parsed = new URL(url, window.location.href);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
}

/**
 * Lightweight validation that an API response looks like a FormDefinition.
 */
function isFormDefinition(value: unknown): value is FormDefinition {
	if (!value || typeof value !== "object") return false;
	const obj = value as Record<string, unknown>;
	return (
		typeof obj.id === "string" &&
		typeof obj.name === "string" &&
		Array.isArray(obj.fields)
	);
}

let stylesInjected = false;

function injectFormStyles(): void {
	if (stylesInjected) return;
	if (typeof document === "undefined") return;

	const style = document.createElement("style");
	style.setAttribute("data-contentta-forms", "");
	style.textContent = FORM_STYLES;
	document.head.appendChild(style);
	stylesInjected = true;
}

export class ContenttaFormsClient {
	private config: ContenttaSdkConfig;
	private tracker: ContenttaEventTracker;
	private apiUrl: string;
	private readonly sdk: FormsApiClient;

	constructor(config: ContenttaSdkConfig, tracker: ContenttaEventTracker) {
		this.config = config;
		this.tracker = tracker;
		this.apiUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");

		// Initialize SDK client for oRPC calls
		this.sdk = createSdk({
			apiKey: this.config.apiKey,
			host: this.apiUrl,
		}) as unknown as FormsApiClient;
	}

	// ── Public API ──────────────────────────────────────────────

	async embedForm(
		formId: string,
		containerId: string,
		options?: {
			experimentId?: string;
			variantId?: string;
		},
	): Promise<void> {
		const container = document.getElementById(containerId);
		if (!container) {
			console.error(
				`[ContenttaForms] Container element with id "${containerId}" not found.`,
			);
			return;
		}

		let form: FormDefinition;

		try {
			// Use oRPC client to fetch form definition
			const result = await this.sdk.forms.get({ formId });

			if (!isFormDefinition(result)) {
				console.error(
					"[ContenttaForms] Invalid form definition received from API.",
				);
				return;
			}

			form = result;
		} catch (error) {
			// Handle ORPCError and other errors
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			console.error(
				`[ContenttaForms] Failed to fetch form: ${errorMessage}`,
				error,
			);
			return;
		}

		// Inject styles once into <head>
		injectFormStyles();

		container.innerHTML = this.renderForm(form);

		this.tracker.track("form.impression", {
			formId: form.id,
			formName: form.name,
			pageUrl: typeof window !== "undefined" ? window.location.href : "",
			referrer: typeof document !== "undefined" ? document.referrer : "",
		});

		// Track experiment impression if this form is part of an A/B test
		if (options?.experimentId && options?.variantId) {
			this.tracker.track("experiment.started", {
				targetType: "form",
				targetId: formId,
				experimentId: options.experimentId,
				variantId: options.variantId,
				visitorId: this.tracker.getVisitorId(),
				sessionId: this.tracker.getSessionId(),
			});
		}

		this.setupFormHandler(formId, container, options);
	}

	// ── Rendering ───────────────────────────────────────────────

	private renderForm(form: FormDefinition): string {
		// Prefer CTA title/subtitle over name/description for display
		const displayTitle = form.title || form.name;
		const displaySubtitle = form.subtitle || form.description;

		const ctaHtml =
			form.icon || displayTitle || displaySubtitle
				? `
<div class="contentta-form__cta">
	${form.icon ? `<div class="contentta-form__cta-icon">${escapeHtml(form.icon)}</div>` : ""}
	${displayTitle ? `<h3 class="contentta-form__cta-title">${escapeHtml(displayTitle)}</h3>` : ""}
	${displaySubtitle ? `<p class="contentta-form__cta-subtitle">${escapeHtml(displaySubtitle)}</p>` : ""}
</div>`
				: "";

		const fieldsHtml = form.fields
			.map((field) => this.renderField(field))
			.join("\n");

		const buttonText = form.buttonText || "Enviar";

		return `
<div class="contentta-form">
	${ctaHtml}
	<form class="contentta-form__form" novalidate>
		${fieldsHtml}
		<button type="submit" class="contentta-form__submit">${escapeHtml(buttonText)}</button>
	</form>
</div>`;
	}

	private renderField(field: FormField): string {
		const escapedId = escapeHtml(field.id);
		const escapedLabel = escapeHtml(field.label);
		const escapedPlaceholder = field.placeholder
			? escapeHtml(field.placeholder)
			: "";
		const requiredAttr = field.required ? "required" : "";
		const requiredMarker = field.required
			? '<span class="contentta-form__required">*</span>'
			: "";

		let inputHtml: string;

		switch (field.type) {
			case "text":
			case "email":
				inputHtml = `<input
					type="${field.type}"
					id="contentta-field-${escapedId}"
					name="${escapedId}"
					class="contentta-form__input"
					placeholder="${escapedPlaceholder}"
					${requiredAttr}
				/>`;
				break;

			case "textarea":
				inputHtml = `<textarea
					id="contentta-field-${escapedId}"
					name="${escapedId}"
					class="contentta-form__textarea"
					placeholder="${escapedPlaceholder}"
					${requiredAttr}
				></textarea>`;
				break;

			case "checkbox":
				inputHtml = `<div class="contentta-form__checkbox-wrapper">
					<input
						type="checkbox"
						id="contentta-field-${escapedId}"
						name="${escapedId}"
						class="contentta-form__checkbox"
						${requiredAttr}
					/>
					<label for="contentta-field-${escapedId}">${escapedLabel}</label>
				</div>`;
				break;

			case "select": {
				const optionsHtml = (field.options ?? [])
					.map(
						(opt) =>
							`<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`,
					)
					.join("\n");

				inputHtml = `<select
					id="contentta-field-${escapedId}"
					name="${escapedId}"
					class="contentta-form__select"
					${requiredAttr}
				>
					<option value="">${escapedPlaceholder || "Selecione uma opção"}</option>
					${optionsHtml}
				</select>`;
				break;
			}

			case "number":
				inputHtml = `<input
					type="number"
					id="contentta-field-${escapedId}"
					name="${escapedId}"
					class="contentta-form__input"
					placeholder="${escapedPlaceholder}"
					${requiredAttr}
				/>`;
				break;

			case "date":
				inputHtml = `<input
					type="date"
					id="contentta-field-${escapedId}"
					name="${escapedId}"
					class="contentta-form__input"
					${requiredAttr}
				/>`;
				break;

			case "rating": {
				const stars = [1, 2, 3, 4, 5]
					.map(
						(n) =>
							`<button type="button" class="contentta-form__star" data-rating="${n}" aria-label="${n} estrela${n > 1 ? "s" : ""}">★</button>`,
					)
					.join("");
				inputHtml = `<div class="contentta-form__rating" id="contentta-field-${escapedId}" data-field-id="${escapedId}">
					<input type="hidden" name="${escapedId}" id="contentta-rating-input-${escapedId}" />
					${stars}
				</div>`;
				break;
			}

			case "file":
				inputHtml = `<input
					type="file"
					id="contentta-field-${escapedId}"
					name="${escapedId}"
					class="contentta-form__input"
					${requiredAttr}
				/>`;
				break;

			default: {
				// Fallback for unknown field types — render as text input
				const _type: string = field.type;
				inputHtml = `<input
					type="text"
					id="contentta-field-${escapedId}"
					name="${escapedId}"
					data-field-type="${escapeHtml(_type)}"
					class="contentta-form__input"
					placeholder="${escapedPlaceholder}"
					${requiredAttr}
				/>`;
			}
		}

		// Checkbox renders its own label inside the wrapper
		const labelHtml =
			field.type === "checkbox"
				? ""
				: `<label class="contentta-form__label" for="contentta-field-${escapedId}">${escapedLabel}${requiredMarker}</label>`;

		return `
<div class="contentta-form__field">
	${labelHtml}
	${inputHtml}
	<div class="contentta-form__error" data-field-error="${escapedId}"></div>
</div>`;
	}

	// ── Form Submission ─────────────────────────────────────────

	private setupFormHandler(
		formId: string,
		container: HTMLElement,
		options?: { experimentId?: string; variantId?: string },
	): void {
		const formElement = container.querySelector<HTMLFormElement>(
			".contentta-form__form",
		);
		if (!formElement) {
			return;
		}

		// Setup star rating fields
		const ratingContainers = container.querySelectorAll<HTMLDivElement>(
			".contentta-form__rating",
		);
		for (const ratingContainer of ratingContainers) {
			const fieldId = ratingContainer.getAttribute("data-field-id");
			if (!fieldId) continue;
			const stars = ratingContainer.querySelectorAll<HTMLButtonElement>(
				".contentta-form__star",
			);
			const hiddenInput = container.querySelector<HTMLInputElement>(
				`#contentta-rating-input-${CSS.escape(fieldId)}`,
			);

			for (const [i, star] of stars.entries()) {
				star.addEventListener("click", () => {
					const value = i + 1;
					if (hiddenInput) hiddenInput.value = String(value);
					// Update star visual state
					for (const [j, s] of stars.entries()) {
						s.classList.toggle("contentta-form__star--active", j <= i);
					}
				});
			}
		}

		formElement.addEventListener("submit", (event: Event) => {
			event.preventDefault();

			const submitButton = formElement.querySelector<HTMLButtonElement>(
				".contentta-form__submit",
			);
			if (submitButton) {
				submitButton.disabled = true;
			}

			const formData = new FormData(formElement);
			const data: Record<string, unknown> = {};
			for (const [key, value] of formData.entries()) {
				data[key] = value;
			}

			// Handle unchecked checkboxes (FormData omits them)
			const checkboxes = formElement.querySelectorAll<HTMLInputElement>(
				'input[type="checkbox"]',
			);
			for (const checkbox of checkboxes) {
				if (!data[checkbox.name]) {
					data[checkbox.name] = false;
				} else {
					data[checkbox.name] = true;
				}
			}

			const submissionData = {
				formId,
				data,
				metadata: {
					visitorId: this.tracker.getVisitorId(),
					sessionId: this.tracker.getSessionId(),
					referrer: typeof document !== "undefined" ? document.referrer : "",
					url: typeof window !== "undefined" ? window.location.href : "",
				},
				...(options?.experimentId &&
					options?.variantId && {
						experimentId: options.experimentId,
						variantId: options.variantId,
					}),
			};

			// Use oRPC client to submit form
			this.sdk.forms
				.submit(submissionData)
				.then((result: FormsSubmitResult) => {
					this.tracker.track("form.submitted", {
						formId,
						pageUrl: typeof window !== "undefined" ? window.location.href : "",
						referrer: typeof document !== "undefined" ? document.referrer : "",
					});

					if (options?.experimentId && options?.variantId) {
						this.tracker.track("experiment.conversion", {
							targetType: "form",
							targetId: formId,
							experimentId: options.experimentId,
							variantId: options.variantId,
							visitorId: this.tracker.getVisitorId(),
							sessionId: this.tracker.getSessionId(),
						});
					}

					const successMessage =
						result.settings?.successMessage ??
						"Obrigado! Sua resposta foi recebida.";
					const redirectUrl = result.settings?.redirectUrl;

					if (redirectUrl) {
						if (isSafeRedirectUrl(redirectUrl)) {
							window.location.href = redirectUrl;
						} else {
							console.error(
								`[ContenttaForms] Unsafe redirect URL: ${redirectUrl}`,
							);
						}
					} else {
						this.showSuccess(container, successMessage);
					}
				})
				.catch((error: unknown) => {
					// Handle validation errors (ORPCError with UNPROCESSABLE_CONTENT)
					const err = error as { cause?: { errors?: Record<string, string> } };
					if (err?.cause?.errors && typeof err.cause.errors === "object") {
						this.showErrors(formElement, err.cause.errors);
					} else {
						const errorMessage =
							error instanceof Error ? error.message : "Unknown error";
						console.error(
							`[ContenttaForms] Submission failed: ${errorMessage}`,
							error,
						);
					}

					if (submitButton) {
						submitButton.disabled = false;
					}
				});
		});
	}

	// ── Error & Success Display ─────────────────────────────────

	private showErrors(
		form: HTMLFormElement,
		errors: Record<string, string>,
	): void {
		// Clear all previous errors
		const errorContainers = form.querySelectorAll<HTMLDivElement>(
			".contentta-form__error",
		);
		for (const el of errorContainers) {
			el.textContent = "";
		}

		// Show new errors
		for (const [fieldId, message] of Object.entries(errors)) {
			const errorContainer = form.querySelector<HTMLDivElement>(
				`[data-field-error="${CSS.escape(fieldId)}"]`,
			);
			if (errorContainer) {
				errorContainer.textContent = message;
			}
		}
	}

	private showSuccess(container: HTMLElement, message: string): void {
		container.innerHTML = `
<div class="contentta-form">
	<div class="contentta-form__success">${escapeHtml(message)}</div>
</div>`;
	}
}

// ── Factory ─────────────────────────────────────────────────────

export function createFormsClient(
	config: ContenttaSdkConfig,
	tracker: ContenttaEventTracker,
): ContenttaFormsClient {
	return new ContenttaFormsClient(config, tracker);
}

export type { FormField, FormDefinition };
