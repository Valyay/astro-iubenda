import { describe, it, expect, vi, afterEach } from "vitest";
import type { AstroIntegrationLogger } from "astro";
import {
	generateVirtualCode,
	handleApiError,
	createVitePlugin,
	fetchAllDocuments,
	formatContent,
	fetchDocument,
	TERMS_URL,
	PRIVACY_URL,
} from "../src/utils.js";

const createMockLogger = (): AstroIntegrationLogger => {
	const logger = {
		info: vi.fn<[message: string], void>(),
		warn: vi.fn<[message: string], void>(),
		error: vi.fn<[message: string], void>(),
	};
	return logger as unknown as AstroIntegrationLogger;
};

// Helpers for building fake Fetch API Response objects
const mockJsonResponse = (
	obj: unknown,
): { ok: boolean; status: number; text: () => Promise<string> } => ({
	ok: true,
	status: 200,
	text: (): Promise<string> => Promise.resolve(JSON.stringify(obj)),
});
const mockTextResponse = (
	text: string,
	status = 200,
): { ok: boolean; status: number; text: () => Promise<string> } => ({
	ok: status >= 200 && status < 300,
	status,
	text: (): Promise<string> => Promise.resolve(text),
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("utility functions", () => {
	describe("formatContent", () => {
		it("should strip markup when stripMarkup is true", () => {
			const content = 'This is a "test" with \\"escaped\\" quotes';
			const result = formatContent(content, true);
			expect(result).not.toContain('"');
			expect(result).not.toContain("\\");
		});

		it("should not modify content when stripMarkup is false", () => {
			const content = 'This is a "test" with \\"escaped\\" quotes';
			const result = formatContent(content, false);
			expect(result).toBe(content);
		});
	});

	describe("fetchDocument", () => {
		afterEach(() => {
			mockFetch.mockReset();
		});

		it("parses JSON payload and formats", async () => {
			mockFetch.mockResolvedValueOnce(mockJsonResponse({ content: 'Test "content"' }));
			const result = await fetchDocument("https://api.example/doc", true);
			expect(mockFetch).toHaveBeenCalledWith("https://api.example/doc/no-markup");
			expect(result).toBe("Test content");
		});

		it("returns raw HTML when not JSON", async () => {
			const html = `<div>${"a".repeat(400)}</div>`;
			mockFetch.mockResolvedValueOnce(mockTextResponse(html));
			const result = await fetchDocument("https://api.example/doc", false);
			expect(result).toBe(html);
		});

		it("throws 403 when 'convert it to Pro' message", async () => {
			mockFetch.mockResolvedValueOnce(
				mockTextResponse("To access the Privacy Policy for 1 convert it to Pro."),
			);
			await expect(fetchDocument("https://api.example/doc", false)).rejects.toMatchObject({
				code: 403,
			});
		});

		it("throws 404 on short invalid body", async () => {
			mockFetch.mockResolvedValueOnce(mockTextResponse(""));
			await expect(fetchDocument("https://api.example/doc", true)).rejects.toMatchObject({
				code: 404,
			});
		});

		it("throws when res.ok === false", async () => {
			mockFetch.mockResolvedValueOnce(mockTextResponse("Not found", 404));
			await expect(fetchDocument("https://api.example/doc", false)).rejects.toThrow();
		});
	});

	describe("fetchAllDocuments", () => {
		const logger = createMockLogger();
		afterEach(() => {
			vi.clearAllMocks();
			mockFetch.mockReset();
		});

		function stubAllOk(): void {
			mockFetch.mockImplementation((input: any) => {
				const url = String(input);
				if (url.includes("/cookie-policy/")) return mockJsonResponse({ content: "cookie" });
				if (url.startsWith(TERMS_URL)) return mockJsonResponse({ content: "terms" });
				if (url.startsWith(PRIVACY_URL)) return mockJsonResponse({ content: "privacy" });
				return mockTextResponse("unexpected", 500);
			});
		}

		it("returns a full store when every request succeeds", async () => {
			stubAllOk();
			const store = await fetchAllDocuments([123], true, logger);

			expect(store).toEqual({
				123: {
					privacyPolicy: "privacy",
					cookiePolicy: "cookie",
					termsAndConditions: "terms",
				},
			});

			expect(logger.info).toHaveBeenCalledTimes(3);
		});

		it("sets individual field null when request fails", async () => {
			mockFetch.mockImplementation((input: any) => {
				const url = String(input);
				if (url.includes("/cookie-policy/")) return mockTextResponse("convert it to Pro", 200); // 403 inside
				return mockJsonResponse({ content: "ok" });
			});
			const store = await fetchAllDocuments(["a"], true, logger);
			expect(store["a"].cookiePolicy).toBeNull();

			expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Cookie Policy"));
		});
	});

	describe("generateVirtualCode", () => {
		it("should generate correct virtual module code", () => {
			const store = {
				"123": {
					privacyPolicy: "Privacy content",
					cookiePolicy: "Cookie content",
					termsAndConditions: "Terms content",
				},
			};

			const code = generateVirtualCode(store);

			expect(code).toContain("export const documents =");
			expect(code).toContain("export const getDocument =");
			expect(code).toContain("privacyPolicy");
			expect(code).toContain("cookiePolicy");
			expect(code).toContain("termsAndConditions");
			expect(code).toContain("Privacy content");
			expect(code).toContain("export default documents");
		});
	});

	describe("handleApiError", () => {
		it("should log appropriate warning for 404 error", () => {
			const logger = {
				warn: vi.fn(),
				info: vi.fn(),
			};

			const error = new Error("Not found");
			(error as unknown as { code: number }).code = 404;

			handleApiError(error, "Privacy Policy", "123", logger as AstroIntegrationLogger);

			expect(logger.warn).toHaveBeenCalledWith("Privacy Policy for 123 not found.");
		});

		it("should log appropriate warning for 403 error", () => {
			const logger = {
				warn: vi.fn(),
				info: vi.fn(),
			};

			const error = new Error("Forbidden");
			(error as unknown as { code: number }).code = 403;

			handleApiError(error, "Terms & Conditions", "123", logger as AstroIntegrationLogger);

			expect(logger.warn).toHaveBeenCalledWith(
				"To access the Terms & Conditions for 123 via API, convert it to Pro.",
			);
		});

		it("should log appropriate warning for 500 error", () => {
			const logger = {
				warn: vi.fn(),
				info: vi.fn(),
			};

			const error = new Error("Server error");
			(error as unknown as { code: number }).code = 500;

			handleApiError(error, "Cookie Policy", "123", logger as AstroIntegrationLogger);

			expect(logger.warn).toHaveBeenCalledWith(
				"Application Error. Please contact info@iubenda.com for support.",
			);
		});

		it("should log the error message for other errors", () => {
			const logger = {
				warn: vi.fn(),
				info: vi.fn(),
			};

			const error = new Error("Unknown error");

			handleApiError(error, "Privacy Policy", "123", logger as AstroIntegrationLogger);

			expect(logger.warn).toHaveBeenCalledWith("Privacy Policy 123 — Error: Unknown error");
		});
	});

	describe("createVitePlugin", () => {
		it("should create a vite plugin with the expected methods", () => {
			const virtualCode = "export default { test: true };";
			const plugin = createVitePlugin(virtualCode);

			expect(plugin).toHaveProperty("name", "astro-iubenda");
			expect(plugin).toHaveProperty("resolveId");
			expect(plugin).toHaveProperty("load");
		});

		it("should resolve the correct virtual module id", () => {
			const virtualCode = "export default { test: true };";
			const plugin = createVitePlugin(virtualCode);

			const resolvedId = plugin.resolveId("virtual:astro-iubenda");
			expect(resolvedId).toBe("\0virtual:astro-iubenda");

			const otherResolvedId = plugin.resolveId("other-module");
			expect(otherResolvedId).toBeUndefined();
		});

		it("should load the virtual module with the provided code", () => {
			const virtualCode = "export default { test: true };";
			const plugin = createVitePlugin(virtualCode);

			const code = plugin.load("\0virtual:astro-iubenda");
			expect(code).toBe(virtualCode);

			const otherCode = plugin.load("other-module");
			expect(otherCode).toBeUndefined();
		});
	});
});
