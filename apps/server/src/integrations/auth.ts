import { env } from "@api/config/env";
import * as authSchema from "@api/schemas/auth-schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import Elysia from "elysia";
import { db } from "./database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [openAPI()],
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;

export const authMiddleware = new Elysia({ name: "better-auth-middleware" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ request: { headers }, status }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session)
          return status(401, {
            message:
              "Unauthorized: Please check your credentials and permissions",
            success: false,
          });

        return {
          session: session.session,
          user: session.user,
        };
      },
    },
  });
// biome-ignore lint/suspicious/noAssignInExpressions: <no need>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  // biome-ignore lint/suspicious/noExplicitAny: Explicit type declaration needed for dynamic API components
  components: getSchema().then(({ components }) => components) as Promise<any>,
  getPaths: (prefix = "/api/v1/auth") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        //@ts-ignore
        reference[key] = paths[path];

        //@ts-ignore
        for (const method of Object.keys(paths[path])) {
          // biome-ignore lint/suspicious/noExplicitAny: Explicit type declaration needed for dynamic API operations
          const operation = (reference[key] as any)[method];

          operation.tags = ["Better Auth"];
        }
      }
      return reference;
      // biome-ignore lint/suspicious/noExplicitAny: Explicit type declaration needed for dynamic API operations
    }) as Promise<any>,
} as const;
