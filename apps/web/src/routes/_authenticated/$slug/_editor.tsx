/**
 * Layout standalone para o editor de conteudo.
 * Sem sidebar do dashboard para evitar conflitos de keybinds.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { EditorStandaloneLayout } from "@/layout/editor/editor-standalone-layout";

export const Route = createFileRoute("/_authenticated/$slug/_editor")({
	component: EditorLayoutRoute,
});

function EditorLayoutRoute() {
	return (
		<EditorStandaloneLayout>
			<Outlet />
		</EditorStandaloneLayout>
	);
}
