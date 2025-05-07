import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import { writeDocumentsToJson } from "../src/utils.js";
import type { AstroIntegrationLogger } from "astro";

vi.mock("node:fs", () => ({
	promises: {
		mkdir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
	},
}));

describe("file operations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("writeDocumentsToJson", () => {
		it("should write documents to JSON files in the specified directory", async () => {
			const store = {
				"123": {
					privacyPolicy: "Privacy content",
					cookiePolicy: "Cookie content",
					termsAndConditions: "Terms content",
				},
				"456": {
					privacyPolicy: "Another privacy content",
					cookiePolicy: null,
					termsAndConditions: "Another terms content",
				},
			};

			const logger = {
				info: vi.fn(),
				warn: vi.fn(),
			} as unknown as AstroIntegrationLogger;

			const projectRoot = new URL("file:///project/");
			const outputDir = "src/content/iubenda";

			await writeDocumentsToJson(store, projectRoot, outputDir, logger);

			// Should create the directory
			expect(fs.mkdir).toHaveBeenCalledTimes(1);
			expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining(outputDir), {
				recursive: true,
			});

			// Should write files for each document ID
			expect(fs.writeFile).toHaveBeenCalledTimes(2);

			// First document
			expect(fs.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("123.json"),
				expect.stringContaining("Privacy content"),
			);

			// Second document
			expect(fs.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("456.json"),
				expect.stringContaining("Another privacy content"),
			);

			// Should log success message
			expect(logger.info).toHaveBeenCalledWith(
				expect.stringContaining("Iubenda JSON-files written"),
			);
		});

		it("should do nothing if projectRoot is undefined", async () => {
			const store = {
				"123": {
					privacyPolicy: "Privacy content",
					cookiePolicy: "Cookie content",
					termsAndConditions: "Terms content",
				},
			};

			const logger = {
				info: vi.fn(),
				warn: vi.fn(),
			} as unknown as AstroIntegrationLogger;

			const projectRoot = undefined;
			const outputDir = "src/content/iubenda";

			await writeDocumentsToJson(store, projectRoot, outputDir, logger);

			// Should not create the directory or write files
			expect(fs.mkdir).not.toHaveBeenCalled();
			expect(fs.writeFile).not.toHaveBeenCalled();
			expect(logger.info).not.toHaveBeenCalled();
		});
	});
});
