import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { AstroIntegrationLogger } from "astro";
import type { PolicySet } from "virtual:astro-iubenda";

export const PRIVACY_URL = "https://www.iubenda.com/api/privacy-policy/";
export const TERMS_URL = "https://www.iubenda.com/api/terms-and-conditions/";

export const formatContent = (content: string, stripMarkup: boolean): string =>
	stripMarkup ? content.replace(/"|\\/g, "") : content;

const PRO_MSG_RE = /convert it to/i;
const HTML_TAG_RE = /<\/?(p|div|h\d|ul|ol|li|section|br)\b/i;

const buildError = (msg: string, code: number): Error => {
	const err = new Error(msg);
	(err as unknown as { code: number }).code = code;
	return err;
};

export const fetchDocument = async (url: string, stripMarkup: boolean): Promise<string> => {
	const res = await fetch(`${url}/no-markup`);

	if (!res.ok) {
		throw buildError(`HTTP ${res.status}`, res.status);
	}

	const raw = await res.text();

	try {
		const parsed = JSON.parse(raw) as { content?: string };
		if (typeof parsed.content === "string" && parsed.content.trim()) {
			return formatContent(parsed.content, stripMarkup);
		}
	} catch {
		/* not JSON – fallthrough */
	}

	if (PRO_MSG_RE.test(raw)) {
		throw buildError("Requires Pro plan", 403);
	}

	if (raw.length === 0 && !HTML_TAG_RE.test(raw)) {
		throw buildError("Empty or invalid document", 404);
	}

	return formatContent(raw, stripMarkup);
};

export const handleApiError = (
	error: unknown,
	name: string,
	id: string | number,
	logger: AstroIntegrationLogger,
): void => {
	// Error codes from https://www.iubenda.com/en/help/78-privacy-policy-direct-text-embedding-api#api
	const statusCode = (error as { code?: number }).code || 0;

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
			logger.warn(`${name} ${id} — ${String(error)}`);
			break;
	}
};

export const fetchAllDocuments = async (
	documentIds: Array<number | string>,
	stripMarkup: boolean,
	logger: AstroIntegrationLogger,
): Promise<Record<string, PolicySet>> => {
	const store: Record<string, PolicySet> = {};

	await Promise.all(
		documentIds.map(async id => {
			const data: PolicySet = {
				privacyPolicy: null,
				cookiePolicy: null,
				termsAndConditions: null,
			};

			try {
				data.privacyPolicy = await fetchDocument(PRIVACY_URL + id, stripMarkup);
				logger.info(`🚛 Privacy Policy ${id} fetched`);
			} catch (e) {
				handleApiError(e, "Privacy Policy", id, logger);
			}

			try {
				data.cookiePolicy = await fetchDocument(`${PRIVACY_URL + id}/cookie-policy`, stripMarkup);
				logger.info(`Cookie Policy ${id} fetched`);
			} catch (e) {
				handleApiError(e, "Cookie Policy", id, logger);
			}

			try {
				data.termsAndConditions = await fetchDocument(TERMS_URL + id, stripMarkup);
				logger.info(`Terms & Conditions ${id} fetched`);
			} catch (e) {
				handleApiError(e, "Terms & Conditions", id, logger);
			}

			store[id] = data;
		}),
	);

	return store;
};

export const generateVirtualCode = (store: Record<string, PolicySet>): string => `
export const documents = ${JSON.stringify(store, null, 2)};
export const getDocument = (id, type='privacyPolicy') => documents[id]?.[type] ?? null;
export default documents;`;

export const writeDocumentsToJson = async (
	store: Record<string, PolicySet>,
	projectRoot: URL | undefined,
	outputDir: string,
	logger: AstroIntegrationLogger,
): Promise<void> => {
	if (!projectRoot) return;

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

	logger.info(`💾 Iubenda JSON-files written to ${path.relative(fileURLToPath(projectRoot), dir)}`);
};

export const createVitePlugin = (
	codeOrGetter: string | (() => string),
): {
	name: string;
	resolveId(id: string): string | undefined;
	load(id: string): string | undefined;
} => {
	const getCode: () => string =
		typeof codeOrGetter === "function" ? codeOrGetter : (): string => codeOrGetter;

	return {
		name: "astro-iubenda",
		resolveId(id: string): string | undefined {
			return id === "virtual:astro-iubenda" ? "\0virtual:astro-iubenda" : undefined;
		},
		load(id: string): string | undefined {
			return id === "\0virtual:astro-iubenda" ? getCode() : undefined;
		},
	};
};
