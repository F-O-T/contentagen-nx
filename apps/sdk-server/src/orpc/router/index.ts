import * as content from "./sdk";

const sdkRouter = {
	content,
	forms: {},
	events: {},
};

export default sdkRouter;
export type SdkRouter = typeof sdkRouter;
