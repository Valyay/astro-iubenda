import type { AstroIntegration, AstroIntegrationLogger, HookParameters } from "astro";
import type { PolicySet } from "virtual:astro-iubenda";
import {
	fetchAllDocuments,
	generateVirtualCode,
	writeDocumentsToJson,
	createVitePlugin,
} from "./utils.js";
import { buildCookieFooterScripts, type CookieFooterOptions } from "./cookieFooter.js";

export interface Options {
	documentIds: Array<number | string>;
	saveInJson?: boolean;
	outputDir?: string;
	stripMarkup?: boolean;
	cookieFooter?: false | CookieFooterOptions;
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
		cookieFooter = false,
	} = opts;

	let projectRoot: URL | undefined;
	let store: Record<string, PolicySet> = {};
	let virtualCode = "export default {};";
	let viteServer: DevServer | undefined;

	/* Helper: reload docs + push HMR                                       */
	const refresh = async (providedLogger?: AstroIntegrationLogger): Promise<void> => {
		const logger = (providedLogger ||
			viteServer?.config?.logger ||
			console) as unknown as AstroIntegrationLogger;

		store = await fetchAllDocuments(documentIds, stripMarkup, logger);
		virtualCode = generateVirtualCode(store);

		if (!viteServer) return;

		// Skip HMR-related operations in test environment
		if (viteServer.moduleGraph && viteServer.ws) {
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
		}
	};

	const cookieScripts = buildCookieFooterScripts(cookieFooter);

	return {
		name: "astro-iubenda",
		hooks: {
			"astro:config:setup": ({
				config,
				updateConfig,
				logger,
				injectScript,
			}: HookParameters<"astro:config:setup">): void => {
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

				// Inject Cookie‑Solution banner, if enabled
				for (const script of cookieScripts) {
					if (script) {
						const { stage, code } = script;
						injectScript(stage, code);
					}
					logger.info("🍪 Iubenda Cookie Solution banner injected");
				}
			},

			"astro:server:setup": async ({
				server,
				logger,
			}: HookParameters<"astro:server:setup">): Promise<void> => {
				viteServer = server;

				// Only fetch if not already fetched to prevent duplication
				if (Object.keys(store).length === 0) {
					await refresh(logger);
				}

				const WATCHED = [".env"];
				server?.watcher?.add(WATCHED);
				server?.watcher?.on("change", p => {
					if (!WATCHED.some(f => p.endsWith(f))) return;
					logger.info(`🔄 ${p} changed → refreshing Iubenda docs`);
					void refresh(logger);
				});
			},

			"astro:build:start": async ({
				logger,
			}: HookParameters<"astro:build:start">): Promise<void> => {
				// Only refresh if store is empty to prevent duplicate fetches
				if (Object.keys(store).length === 0) {
					await refresh(logger);
				}
				if (saveInJson) {
					await writeDocumentsToJson(store, projectRoot, outputDir, logger);
				}
			},
		},
	};
}

export type {
	CookieFooterOptions,
	HexColor,
	BannerVersion,
	TcfPurposesKeys,
	ConsentEventName,
	IubendaCallbacks,
	IubendaOptions,
} from "./cookieFooter.js";
