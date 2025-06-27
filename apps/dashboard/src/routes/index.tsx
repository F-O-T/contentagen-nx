import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.sessionMiddleware();
    if (session?.session?.token) {
      throw redirect({ to: "/home" });
    }
    throw redirect({ to: "/auth/sign-in" });
  },
});
