import { createTRPCClient, httpLink } from "@trpc/client";
import { setupServer } from "msw/node";
import { describe, test, beforeAll, afterAll, expect, afterEach } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { httpLink as mswHttpLink } from "msw-trpc";
import SuperJSON from "superjson";
import type { AppRouter } from "../src/server/index";

const mswTrpc = createTRPCMsw<AppRouter>({
  links: [
    mswHttpLink({
      url: "http://localhost:3000/trpc",
      headers() {
        return { "content-type": "application/json" };
      },
    }),
  ],
  transformer: { input: SuperJSON, output: SuperJSON },
});

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: "http://localhost:3000/trpc",
      headers() {
        return { "content-type": "application/json" };
      },
      transformer: SuperJSON,
    }),
  ],
});

describe("agentFile router", () => {
  const server = setupServer();

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  type AgentFileUploadResult = { url: string };
  type AgentFileUploadInput = {
    agentId: string;
    fileName: string;
    fileBuffer: string;
    contentType: string;
  };
  type AgentFileDeleteInput = { agentId: string; fileName: string };

  type AgentFileDeleteResult = { success: boolean };

  const agentId = "00000000-0000-0000-0000-000000000001";
  const fileName = "test.txt";
  const fileBuffer = Buffer.from("hello world").toString("base64");
  const contentType = "text/plain";
  test("should upload a file for agent", async () => {
    server.use(
      mswTrpc.agentFile.upload.mutation(() => ({
        url: `/api/v1/files/${agentId}/${fileName}`,
      })),
    );
    const uploadInput: AgentFileUploadInput = {
      agentId,
      fileName,
      fileBuffer,
      contentType,
    };
    const result: AgentFileUploadResult =
      await trpc.agentFile.upload.mutate(uploadInput);
    expect(result).toHaveProperty("url");
    expect(result.url).toContain(agentId);
    expect(result.url).toContain(fileName);
  });

  test("should delete a file for agent", async () => {
    server.use(mswTrpc.agentFile.delete.mutation(() => ({ success: true })));
    const deleteInput: AgentFileDeleteInput = {
      agentId,
      fileName,
    };
    const result: AgentFileDeleteResult =
      await trpc.agentFile.delete.mutate(deleteInput);
    expect(result).toEqual({ success: true });
  });
});
