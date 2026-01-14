declare module "typo-js" {
	export default class Typo {
		constructor(
			lang: string,
			affData?: string | null,
			dicData?: string | null,
			options?: {
				dictionaryPath?: string;
				asyncLoad?: boolean;
				loadedCallback?: (result: Typo) => void;
			},
		);
		check(word: string): boolean;
		suggest(word: string, limit?: number): string[];
		loaded: boolean;
	}
}
