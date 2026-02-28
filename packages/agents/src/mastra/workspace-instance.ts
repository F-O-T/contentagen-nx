import path from "node:path";
import { LocalFilesystem, Workspace } from "@mastra/core/workspace";

export const workspace = new Workspace({
	filesystem: new LocalFilesystem({
		basePath: path.resolve(import.meta.dirname, "./workspace"),
		readOnly: true,
	}),
	skills: ["/skills"],
	bm25: true,
});
