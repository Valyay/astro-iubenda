import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import type { PolicySet } from "virtual:astro-iubenda";
import {
	fetchAllDocuments,
	generateVirtualCode,
	writeDocumentsToJson,
	createVitePlugin,
} from "./utils.js";

export interface Options {
	documentIds: Array<number | string>;
	saveInJson?: boolean;
	outputDir?: string;
	stripMarkup?: boolean;
}

interface LoggerSubset {
	info(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
}
interface DevServer {
	moduleGraph: {
		getModuleById(id: string): unknown;
		invalidateModule(mod: unknown): void;
	};
	ws: { send(payload: unknown): void };
	config: { logger: LoggerSubset };
	watcher: {
		add(paths: string | string[]): void;
		on(event: "change", cb: (path: string) => void): void;
	};
}

const VIRTUAL_ID = "\0virtual:astro-iubenda";

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
	let viteServer: DevServer | undefined;

	/* Helper: reload docs + push HMR                                       */
	const refresh = async () => {
		const logger = (viteServer?.config.logger ?? console) as unknown as AstroIntegrationLogger;

		store = await fetchAllDocuments(documentIds, stripMarkup, logger);
		virtualCode = generateVirtualCode(store);

		if (!viteServer) return;
		const mod = viteServer.moduleGraph.getModuleById(VIRTUAL_ID);
		if (mod) viteServer.moduleGraph.invalidateModule(mod);

		viteServer.ws.send({
			type: "update",
			updates: [
				{
					type: "js-update",
					path: "virtual:astro-iubenda",
					acceptedPath: "virtual:astro-iubenda",
					timestamp: Date.now(),
				},
			],
		});
	};

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

			"astro:server:setup": async ({ server, logger }) => {
				viteServer = server;

				// Only fetch if not already fetched to prevent duplication
				if (Object.keys(store).length === 0) {
					await refresh();
				}

				const WATCHED = [".env"];
				server.watcher.add(WATCHED);
				server.watcher.on("change", p => {
					if (!WATCHED.some(f => p.endsWith(f))) return;
					logger.info(`🔄 ${p} changed → refreshing Iubenda docs`);
					void refresh();
				});
			},

			"astro:build:start": async ({ logger }) => {
				// Only refresh if store is empty to prevent duplicate fetches
				if (Object.keys(store).length === 0) {
					await refresh();
				}
				if (saveInJson) {
					await writeDocumentsToJson(store, projectRoot, outputDir, logger);
				}
			},
		},
	};
}
