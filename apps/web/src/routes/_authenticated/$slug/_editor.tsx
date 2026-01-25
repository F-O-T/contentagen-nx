import { createFileRoute, Outlet } from "@tanstack/react-router";
import { EditorStandaloneLayout } from "@/layout/editor/editor-standalone-layout";

export const Route = createFileRoute("/_authenticated/$slug/_editor")({
	component: EditorLayoutRoute,
	ssr: false,
});

function EditorLayoutRoute() {
	return (
		<EditorStandaloneLayout>
			<Outlet />
		</EditorStandaloneLayout>
	);
}
