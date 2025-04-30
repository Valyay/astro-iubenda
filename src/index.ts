import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { PolicySet } from "virtual:astro-iubenda";

const PRIVACY_URL = "https://www.iubenda.com/api/privacy-policy/";
const TERMS_URL = "https://www.iubenda.com/api/terms-and-conditions/";

export interface Options {
	documentIds: Array<number | string>;
	writeToDisk?: boolean;
	outputDir?: string;
	stripMarkup?: boolean;
}

export default function iubenda(opts: Options): AstroIntegration {
	const {
		documentIds,
		writeToDisk = false,
		outputDir = "src/content/iubenda",
		stripMarkup = true,
	} = opts;

	let projectRoot: URL | undefined;

	const store: Record<string, PolicySet> = {};
	let virtualCode = "export default {};";

	const fmt = (s: string) => (stripMarkup ? s.replace(/"|\\/g, "") : s);
	const fetchDoc = async (url: string) => {
		const res = await fetch(`${url}/no-markup`);
		if (!res.ok) {
			const error = new Error(`HTTP ${res.status}`);
			(error as unknown as { code: number }).code = res.status;
			throw error;
		}
		const { content } = (await res.json()) as unknown as { content: string };
		return fmt(content);
	};

	const handleError = (
		error: unknown,
		name: string,
		id: string | number,
		logger: AstroIntegrationLogger,
	) => {
		// Error codes from https://www.iubenda.com/en/help/78-privacy-policy-direct-text-embedding-api#api
		const statusCode = (error as { code: number }).code || 0;

		switch (statusCode) {
			case 404:
				logger.warn(`${name} for ${id} not found.`);
				break;
			case 403:
				logger.warn(`To access the ${name} for ${id} via API, convert it to Pro.`);
				break;
			case 500:
				logger.warn("Application Error. Please contact info@iubenda.com for support.");
				break;
			default:
				logger.warn(`${name} ${id} — ${error}`);
				break;
		}
	};

	const fetchAll = async (logger: AstroIntegrationLogger) => {
		await Promise.all(
			documentIds.map(async id => {
				const data: PolicySet = {
					privacyPolicy: null,
					cookiePolicy: null,
					termsAndConditions: null,
				};

				try {
					data.privacyPolicy = await fetchDoc(PRIVACY_URL + id);
					logger.info(`🚛 Privacy Policy ${id} fetched`);
				} catch (e) {
					handleError(e, "Privacy Policy", id, logger);
				}

				try {
					data.cookiePolicy = await fetchDoc(`${PRIVACY_URL + id}/cookie-policy`);
					logger.info(`Cookie Policy ${id} fetched`);
				} catch (e) {
					handleError(e, "Cookie Policy", id, logger);
				}

				try {
					data.termsAndConditions = await fetchDoc(TERMS_URL + id);
					logger.info(`Terms & Conditions ${id} fetched`);
				} catch (e) {
					handleError(e, "Terms & Conditions", id, logger);
				}

				store[id] = data;
			}),
		);

		virtualCode = `
export const documents = ${JSON.stringify(store, null, 2)};
export const getDocument = (id, type='privacyPolicy') => documents[id]?.[type] ?? null;
export default documents;`;
	};

	const writeJsonFiles = async (logger: AstroIntegrationLogger) => {
		if (!writeToDisk || !projectRoot) return;

		const dir = path.join(fileURLToPath(projectRoot), outputDir);
		await fs.mkdir(dir, { recursive: true });

		await Promise.all(
			Object.entries(store).map(([id, data]) =>
				fs.writeFile(
					path.join(dir, `${id}.json`),
					JSON.stringify({ documentId: id, ...data }, null, 2),
				),
			),
		);

		logger.info(
			`💾 Iubenda JSON-files written to ${path.relative(fileURLToPath(projectRoot), dir)}`,
		);
	};

	return {
		name: "astro-iubenda",
		hooks: {
			"astro:config:setup": ({ config, updateConfig, logger }) => {
				projectRoot = config.root;

				const vitePlugin = {
					name: "astro-iubenda",
					resolveId(id: string) {
						return id === "virtual:astro-iubenda" ? "\0virtual:astro-iubenda" : undefined;
					},
					load(id: string) {
						return id === "\0virtual:astro-iubenda" ? virtualCode : undefined;
					},
				};

				updateConfig({
					vite: {
						plugins: [vitePlugin],
					},
				});

				logger.info("✅ virtual:astro-iubenda registered");
			},

			"astro:server:setup": ({ logger }) => fetchAll(logger),

			"astro:build:start": async ({ logger }) => {
				await fetchAll(logger);
				await writeJsonFiles(logger);
			},
		},
	};
}
