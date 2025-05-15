import { describe, it, expect, vi, beforeEach } from "vitest";
import iubenda from "../src/index.js";
import { promises as fs } from "node:fs";

const createMockLogger = () => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock fs.mkdir and fs.writeFile
vi.mock("node:fs", async () => {
	const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
	return {
		...actual,
		promises: {
			...(actual.promises as object),
			mkdir: vi.fn().mockResolvedValue(undefined),
			writeFile: vi.fn().mockResolvedValue(undefined),
		},
	};
});

describe("astro-iubenda", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockReset();
	});

	describe("iubenda integration", () => {
		it("should create an Astro integration with correct hooks", () => {
			const options = {
				documentIds: [123, 456],
				saveInJson: true,
				outputDir: "custom/dir",
				stripMarkup: false,
			};

			const integration = iubenda(options);

			expect(integration).toHaveProperty("name", "astro-iubenda");
			expect(integration).toHaveProperty("hooks");
			expect(integration.hooks).toHaveProperty("astro:config:setup");
			expect(integration.hooks).toHaveProperty("astro:server:setup");
			expect(integration.hooks).toHaveProperty("astro:build:start");
		});

		it("should respect default options", () => {
			const options = {
				documentIds: [123],
			};

			const integration = iubenda(options);

			// There's no direct way to verify private options, but we could test
			// behavior that depends on those options
			expect(integration).toHaveProperty("name", "astro-iubenda");
		});
	});

	describe("integration hooks", () => {
		it("config:setup hook should register vite plugin", async () => {
			const options = { documentIds: [123] };
			const integration = iubenda(options);
			const updateConfig = vi.fn();
			const logger = createMockLogger();
			const config = { root: new URL("file:///project/") };

			await integration.hooks["astro:config:setup"]?.({
				config,
				updateConfig,
				logger,
			} as any);

			expect(updateConfig).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalledWith("✅ virtual:astro-iubenda registered");
		});

		it("server:setup hook should fetch documents", async () => {
			const options = { documentIds: [123] };
			const integration = iubenda(options);
			const logger = createMockLogger();

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve(JSON.stringify({ content: "Privacy Policy Content" })),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve(JSON.stringify({ content: "Cookie Policy Content" })),
				})
				.mockResolvedValueOnce({
					ok: true,
					text: () => Promise.resolve(JSON.stringify({ content: "Terms & Conditions Content" })),
				});

			await integration.hooks["astro:server:setup"]?.({
				logger,
			} as any);

			expect(mockFetch).toHaveBeenCalledTimes(3);
			expect(logger.info).toHaveBeenCalledWith("🚛 Privacy Policy 123 fetched");
		});

		it("build:start hook should fetch documents and save JSON when enabled", async () => {
			const options = {
				documentIds: [123],
				saveInJson: true,
			};
			const integration = iubenda(options);
			const logger = createMockLogger();
			const config = { root: new URL("file:///project/") };
			const updateConfig = vi.fn();

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ content: "Privacy Policy Content" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ content: "Cookie Policy Content" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ content: "Terms & Conditions Content" }),
				});

			await integration.hooks["astro:config:setup"]?.({
				config,
				updateConfig,
				logger,
			} as any);

			await integration.hooks["astro:build:start"]?.({ logger } as any);

			expect(mockFetch).toHaveBeenCalledTimes(3);
			expect(fs.mkdir).toHaveBeenCalled();
			expect(fs.writeFile).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("JSON-files written"));
		});
	});
});
