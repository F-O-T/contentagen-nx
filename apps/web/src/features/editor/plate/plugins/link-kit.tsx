"use client";

import { LinkPlugin } from "@platejs/link/react";
import { LinkElement } from "../ui/link-element";
import { LinkFloatingToolbar } from "../ui/link-floating-toolbar";

function isValidUrl(text: string): boolean {
  // Accept relative internal paths (e.g. /conteudo/my-slug)
  if (text.startsWith("/")) return true;
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

export const LinkKit = [
  LinkPlugin.configure({
    options: {
      isUrl: isValidUrl,
    },
    render: {
      afterEditable: LinkFloatingToolbar,
      node: LinkElement,
    },
  }),
];
