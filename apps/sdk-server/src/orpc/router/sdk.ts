import { router, sdkProcedure } from "../server";

export const sdkRouter = router({
	// Content namespace - to be implemented in Task #3
	content: router({}),

	// Forms namespace - to be implemented in Task #4
	forms: router({}),

	// Events namespace - to be implemented in Task #5
	events: router({}),
});

export type SdkRouter = typeof sdkRouter;
