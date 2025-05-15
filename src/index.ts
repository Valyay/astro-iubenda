import type { AstroIntegration } from "astro";
import type { PolicySet } from "virtual:astro-iubenda";
import {
	PRIVACY_URL,
	TERMS_URL,
	fetchAllDocuments,
	generateVirtualCode,
	writeDocumentsToJson,
	createVitePlugin,
} from "./utils.js";

export { PRIVACY_URL, TERMS_URL };

export interface Options {
	documentIds: Array<number | string>;
	saveInJson?: boolean;
	outputDir?: string;
	stripMarkup?: boolean;
}

export default function iubenda(opts: Options): AstroIntegration {
	const {
		documentIds,
		saveInJson = false,
		outputDir = "src/content/iubenda",
		stripMarkup = true,
	} = opts;

	let projectRoot: URL | undefined;
	let store: Record<string, PolicySet> = {};
	let virtualCode = "export default {};";

	return {
		name: "astro-iubenda",
		hooks: {
			"astro:config:setup": ({ config, updateConfig, logger }) => {
				projectRoot = (config as unknown as { root: URL }).root;

				const vitePlugin = createVitePlugin(() => virtualCode);

				updateConfig({
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore vite exists in astro config
					vite: {
						plugins: [vitePlugin],
					},
				});

				logger.info("✅ virtual:astro-iubenda registered");
			},

			"astro:server:setup": async ({ logger }) => {
				store = await fetchAllDocuments(documentIds, stripMarkup, logger);
				virtualCode = generateVirtualCode(store);
			},

			"astro:build:start": async ({ logger }) => {
				store = await fetchAllDocuments(documentIds, stripMarkup, logger);
				virtualCode = generateVirtualCode(store);

				if (saveInJson) {
					await writeDocumentsToJson(store, projectRoot, outputDir, logger);
				}
			},
		},
	};
}
