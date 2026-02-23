import { createAuth } from "@packages/authentication/server";
import { createDb } from "@packages/database/client";
import { env } from "@packages/environment/server";
import { getElysiaPosthogConfig } from "@packages/posthog/server";

export const db = createDb({ databaseUrl: env.DATABASE_URL });
export const auth = createAuth({ db, env });
export const posthog = getElysiaPosthogConfig(env);
