import { env } from "@api/config/env";
import { getMinioClient } from "@packages/files/client";

export const minioClient = getMinioClient(env);
