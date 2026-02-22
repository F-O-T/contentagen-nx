import type { ContenttaSdkConfig } from "./events/types.ts";
import { createSdk } from "./index.ts";

// ── Types ────────────────────────────────────────────────────────

interface ChangelogEntry {
	id: string;
	title: string;
	description?: string | null;
	createdAt: string;
}

interface EmbedConfig {
	theme?: "light" | "dark" | "auto";
	label?: string;
	accentColor?: string;
}

// Minimal type for the clusters portion of the SDK router used by this client.
// Avoids a cross-package dependency on sdk-server while keeping type safety.
interface SdkClustersClient {
	getEmbed(input: { pillarId: string }): Promise<{
		config: EmbedConfig;
		pillarTitle: string;
		entries: ChangelogEntry[];
	}>;
}

interface SdkWithClusters {
	clusters: SdkClustersClient;
}

// ── CSS ─────────────────────────────────────────────────────────

let stylesInjected = false;

function injectChangelogStyles(accentColor = "#6366f1"): void {
	if (stylesInjected) return;
	stylesInjected = true;

	const style = document.createElement("style");
	style.textContent = `
.ctt-changelog-badge {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: ${accentColor};
  color: #fff;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 9998;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  transition: transform 0.15s ease;
}
.ctt-changelog-badge:hover { transform: scale(1.04); }
.ctt-changelog-popover {
  position: fixed;
  bottom: 5rem;
  right: 1.5rem;
  width: 22rem;
  max-height: 28rem;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow-y: auto;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.ctt-changelog-popover--dark { background: #1a1a2e; color: #e2e8f0; }
.ctt-changelog-popover__header {
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  font-weight: 600;
  font-size: 0.9375rem;
}
.ctt-changelog-popover--dark .ctt-changelog-popover__header { border-color: rgba(255,255,255,0.08); }
.ctt-changelog-entry {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;
  transition: background 0.1s;
}
.ctt-changelog-entry:hover { background: rgba(0,0,0,0.03); }
.ctt-changelog-popover--dark .ctt-changelog-entry { border-color: rgba(255,255,255,0.06); }
.ctt-changelog-popover--dark .ctt-changelog-entry:hover { background: rgba(255,255,255,0.04); }
.ctt-changelog-entry__title {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 0.25rem;
}
.ctt-changelog-entry__date {
  font-size: 0.75rem;
  color: #9ca3af;
}
.ctt-changelog-entry__desc {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}
.ctt-changelog-popover--dark .ctt-changelog-entry__desc { color: #94a3b8; }
`;
	document.head.appendChild(style);
}

// ── Helpers ──────────────────────────────────────────────────────

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(iso));
}

// ── Client class ─────────────────────────────────────────────────

export class ContenttaChangelogClient {
	private sdk: ReturnType<typeof createSdk> & SdkWithClusters;
	private clusterId: string;
	private config: EmbedConfig;
	private containerId: string | null;
	private popoverEl: HTMLElement | null = null;
	private badgeEl: HTMLElement | null = null;
	private outsideClickHandler: ((e: MouseEvent) => void) | null = null;

	constructor(
		sdkConfig: ContenttaSdkConfig,
		opts: {
			clusterId: string;
			theme?: "light" | "dark" | "auto";
			label?: string;
			accentColor?: string;
			containerId?: string;
		},
	) {
		this.sdk = createSdk(sdkConfig) as ReturnType<typeof createSdk> &
			SdkWithClusters;
		this.clusterId = opts.clusterId;
		this.containerId = opts.containerId ?? null;
		this.config = {
			theme: opts.theme ?? "auto",
			label: opts.label ?? "What's New",
			accentColor: opts.accentColor ?? "#6366f1",
		};
	}

	async init(): Promise<void> {
		injectChangelogStyles(this.config.accentColor);
		const data = await this.sdk.clusters.getEmbed({ pillarId: this.clusterId });
		this.render(data.entries, data.config);
	}

	private resolvedTheme(): "light" | "dark" {
		if (this.config.theme === "dark") return "dark";
		if (this.config.theme === "light") return "light";
		return window.matchMedia?.("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}

	private render(entries: ChangelogEntry[], cfg: EmbedConfig): void {
		const theme = this.resolvedTheme();
		const accentColor = cfg.accentColor ?? this.config.accentColor ?? "#6366f1";
		const label = cfg.label ?? this.config.label ?? "What's New";

		if (this.containerId) {
			this.renderInline(entries, theme, label);
		} else {
			this.renderBadgeWithPopover(entries, theme, label, accentColor);
		}
	}

	private renderInline(
		entries: ChangelogEntry[],
		theme: "light" | "dark",
		label: string,
	): void {
		const container = document.getElementById(this.containerId!);
		if (!container) return;
		container.innerHTML = this.buildPopoverHTML(entries, theme, label);
	}

	private renderBadgeWithPopover(
		entries: ChangelogEntry[],
		theme: "light" | "dark",
		label: string,
		accentColor: string,
	): void {
		const badge = document.createElement("button");
		badge.type = "button";
		badge.className = "ctt-changelog-badge";
		badge.style.background = accentColor;
		badge.textContent = `${entries.length > 0 ? `${entries.length} ` : ""}${label}`;
		badge.setAttribute("aria-expanded", "false");
		document.body.appendChild(badge);
		this.badgeEl = badge;

		const popover = document.createElement("div");
		popover.className = `ctt-changelog-popover${theme === "dark" ? " ctt-changelog-popover--dark" : ""}`;
		popover.style.display = "none";
		popover.innerHTML = this.buildPopoverHTML(entries, theme, label);
		document.body.appendChild(popover);
		this.popoverEl = popover;

		badge.addEventListener("click", () => {
			const isOpen = popover.style.display !== "none";
			popover.style.display = isOpen ? "none" : "block";
			badge.setAttribute("aria-expanded", String(!isOpen));
		});

		this.outsideClickHandler = (e: MouseEvent) => {
			if (
				!badge.contains(e.target as Node) &&
				!popover.contains(e.target as Node)
			) {
				popover.style.display = "none";
				badge.setAttribute("aria-expanded", "false");
			}
		};
		document.addEventListener("click", this.outsideClickHandler);
	}

	destroy(): void {
		if (this.outsideClickHandler) {
			document.removeEventListener("click", this.outsideClickHandler);
			this.outsideClickHandler = null;
		}
		this.badgeEl?.remove();
		this.popoverEl?.remove();
		this.badgeEl = null;
		this.popoverEl = null;
	}

	private buildPopoverHTML(
		entries: ChangelogEntry[],
		_theme: "light" | "dark",
		label: string,
	): string {
		return `
      <div class="ctt-changelog-popover__header">${escapeHtml(label)}</div>
      ${
				entries.length === 0
					? '<p style="padding:1rem 1.25rem;font-size:0.875rem;color:#9ca3af;">Nenhuma entrada ainda.</p>'
					: entries
							.map(
								(e) => `
        <div class="ctt-changelog-entry" data-entry-id="${escapeHtml(e.id)}">
          <p class="ctt-changelog-entry__title">${escapeHtml(e.title)}</p>
          <p class="ctt-changelog-entry__date">${formatDate(e.createdAt)}</p>
          ${e.description ? `<p class="ctt-changelog-entry__desc">${escapeHtml(e.description)}</p>` : ""}
        </div>
      `,
							)
							.join("")
			}
    `;
	}
}
