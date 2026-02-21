import type { ReactNode } from "react";

interface EditorLayoutProps {
	navbar: ReactNode;
	children: ReactNode;
}

export function EditorLayout({ navbar, children }: EditorLayoutProps) {
	return (
		<div className="flex h-screen flex-col overflow-hidden bg-background">
			<div className="shrink-0 border-b">{navbar}</div>
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
