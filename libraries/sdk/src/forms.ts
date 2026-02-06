import type { ContenttaEventTracker } from "./events/client.ts";
import type { ContenttaSdkConfig } from "./events/types.ts";

// ── Type Definitions ────────────────────────────────────────────

interface FormField {
	id: string;
	type: "text" | "email" | "textarea" | "checkbox" | "select";
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
<style>
.contentta-form {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	max-width: 480px;
	margin: 0 auto;
}
.contentta-form__title {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.25rem;
}
.contentta-form__description {
	font-size: 0.875rem;
	color: #6b7280;
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
}
.contentta-form__required {
	color: #ef4444;
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
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: #fff;
	box-sizing: border-box;
	transition: border-color 0.15s ease;
}
.contentta-form__input:focus,
.contentta-form__textarea:focus,
.contentta-form__select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
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
}
.contentta-form__error {
	font-size: 0.75rem;
	color: #ef4444;
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
	color: #fff;
	background: #3b82f6;
	border: none;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: background 0.15s ease;
}
.contentta-form__submit:hover {
	background: #2563eb;
}
.contentta-form__submit:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}
.contentta-form__success {
	padding: 1rem;
	font-size: 0.875rem;
	color: #065f46;
	background: #d1fae5;
	border-radius: 0.375rem;
	text-align: center;
}
</style>
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
function isFormDefinition(
	value: unknown,
): value is FormDefinition {
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
	style.textContent = FORM_STYLES.replace(/<\/?style>/g, "");
	document.head.appendChild(style);
	stylesInjected = true;
}

export class ContenttaFormsClient {
	private config: ContenttaSdkConfig;
	private tracker: ContenttaEventTracker;
	private apiUrl: string;

	constructor(config: ContenttaSdkConfig, tracker: ContenttaEventTracker) {
		this.config = config;
		this.tracker = tracker;
		this.apiUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
	}

	// ── Public API ──────────────────────────────────────────────

	async embedForm(formId: string, containerId: string): Promise<void> {
		const container = document.getElementById(containerId);
		if (!container) {
			console.error(
				`[ContenttaForms] Container element with id "${containerId}" not found.`,
			);
			return;
		}

		let form: FormDefinition;

		try {
			const response = await fetch(
				`${this.apiUrl}/sdk/forms/${encodeURIComponent(formId)}`,
				{
					method: "GET",
					headers: {
						"X-API-Key": this.config.apiKey,
					},
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(
					`[ContenttaForms] Failed to fetch form: ${response.status} ${response.statusText} - ${errorText}`,
				);
				return;
			}

			const json: unknown = await response.json();

			if (!isFormDefinition(json)) {
				console.error(
					"[ContenttaForms] Invalid form definition received from API.",
				);
				return;
			}

			form = json;
		} catch (error) {
			console.error("[ContenttaForms] Network error fetching form:", error);
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

		this.setupFormHandler(formId, container);
	}

	// ── Rendering ───────────────────────────────────────────────

	private renderForm(form: FormDefinition): string {
		const titleHtml = `<h3 class="contentta-form__title">${escapeHtml(form.name)}</h3>`;

		const descriptionHtml = form.description
			? `<p class="contentta-form__description">${escapeHtml(form.description)}</p>`
			: "";

		const fieldsHtml = form.fields
			.map((field) => this.renderField(field))
			.join("\n");

		return `
<div class="contentta-form">
	${titleHtml}
	${descriptionHtml}
	<form class="contentta-form__form" novalidate>
		${fieldsHtml}
		<button type="submit" class="contentta-form__submit">Submit</button>
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
					<option value="">${escapedPlaceholder || "Select an option"}</option>
					${optionsHtml}
				</select>`;
				break;
			}

			default: {
				const _exhaustive: never = field.type;
				inputHtml = `<input
					type="text"
					id="contentta-field-${_exhaustive}"
					name="${escapedId}"
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

	private setupFormHandler(formId: string, container: HTMLElement): void {
		const formElement = container.querySelector<HTMLFormElement>(
			".contentta-form__form",
		);
		if (!formElement) {
			return;
		}

		formElement.addEventListener("submit", (event: Event) => {
			event.preventDefault();

			const submitButton =
				formElement.querySelector<HTMLButtonElement>(
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
			const checkboxes =
				formElement.querySelectorAll<HTMLInputElement>(
					'input[type="checkbox"]',
				);
			for (const checkbox of checkboxes) {
				if (!data[checkbox.name]) {
					data[checkbox.name] = false;
				} else {
					data[checkbox.name] = true;
				}
			}

			const body = {
				data,
				metadata: {
					visitorId: this.tracker.getVisitorId(),
					sessionId: this.tracker.getSessionId(),
					referrer:
						typeof document !== "undefined" ? document.referrer : "",
					url:
						typeof window !== "undefined"
							? window.location.href
							: "",
				},
			};

			fetch(
				`${this.apiUrl}/sdk/forms/${encodeURIComponent(formId)}/submit`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-API-Key": this.config.apiKey,
					},
					body: JSON.stringify(body),
				},
			)
				.then(async (response) => {
					if (!response.ok) {
						const result = (await response.json().catch(() => null)) as {
							errors?: Record<string, string>;
						} | null;

						if (response.status === 422 && result?.errors) {
							this.showErrors(formElement, result.errors);
						} else {
							console.error(
								`[ContenttaForms] Submission failed: ${response.status} ${response.statusText}`,
							);
						}

						if (submitButton) {
							submitButton.disabled = false;
						}
						return;
					}

					this.tracker.track("form.submitted", {
						formId,
						pageUrl:
							typeof window !== "undefined"
								? window.location.href
								: "",
						referrer:
							typeof document !== "undefined"
								? document.referrer
								: "",
					});

					const result = (await response.json().catch(() => null)) as {
						settings?: {
							successMessage?: string;
							redirectUrl?: string;
						};
					} | null;

					const successMessage =
						result?.settings?.successMessage ??
						"Thank you! Your submission has been received.";
					const redirectUrl = result?.settings?.redirectUrl;

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
				.catch((error) => {
					console.error(
						"[ContenttaForms] Network error submitting form:",
						error,
					);
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
