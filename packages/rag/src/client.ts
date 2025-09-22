import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export interface PgVectorDatabaseClientOptions {
   pgVectorURL?: string;
   max?: number;
}

export type PgVectorDatabaseInstance = NodePgDatabase<typeof schema>;

export const createDb = (
   opts?: PgVectorDatabaseClientOptions,
): PgVectorDatabaseInstance => {
   return drizzle({
      schema,
      casing: "snake_case",
      connection: {
         connectionString: opts?.pgVectorURL,
         max: opts?.max,
      },
   });
};
