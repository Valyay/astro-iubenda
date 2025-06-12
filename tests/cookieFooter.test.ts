import { describe, it, expect } from "vitest";
import { buildCookieFooterScripts, type CookieFooterOptions } from "../src/cookieFooter.js";

describe("buildCookieFooterScripts", () => {
	it("returns empty array when cookieFooter is false", () => {
		expect(buildCookieFooterScripts(false)).toEqual([]);
	});

	it("returns empty array when cookieFooter is undefined", () => {
		expect(buildCookieFooterScripts(undefined)).toEqual([]);
	});

	it("generates basic scripts with default injection stage", () => {
		const options: CookieFooterOptions = {
			iubendaOptions: {
				siteId: "12345",
				cookiePolicyId: "67890",
			},
		};

		const result = buildCookieFooterScripts(options);

		expect(result).toHaveLength(4);
		expect(result[0]).toEqual({
			stage: "head-inline",
			code: expect.stringContaining(
				'_iub.csConfiguration={"siteId":"12345","cookiePolicyId":"67890"}',
			),
		});
		expect(result[1]).toEqual({
			stage: "head-inline",
			code: expect.stringContaining("cs.iubenda.com/autoblocking/12345.js"),
		});
		expect(result[2]).toEqual({
			stage: "head-inline",
			code: expect.stringContaining("cdn.iubenda.com/cs/gpp/stub.js"),
		});
		expect(result[3]).toEqual({
			stage: "head-inline",
			code: expect.stringContaining("cdn.iubenda.com/cs/iubenda_cs.js"),
		});
	});

	it("generates scripts with custom injection stage", () => {
		const options: CookieFooterOptions = {
			iubendaOptions: {
				siteId: "12345",
			},
			injectionStage: "page",
		};

		const result = buildCookieFooterScripts(options);

		expect(result).toHaveLength(4);
		expect(result[0].stage).toBe("page");
		expect(result[1].stage).toBe("page");
		expect(result[2].stage).toBe("page");
		expect(result[3].stage).toBe("page");
	});

	it("includes GTM script when googleTagManagerOptions is true", () => {
		const options: CookieFooterOptions = {
			iubendaOptions: {
				siteId: "12345",
			},
			googleTagManagerOptions: true,
		};

		const result = buildCookieFooterScripts(options);

		expect(result).toHaveLength(5);

		// Check onConsentGiven callback
		expect(result[0].code).toContain("_iub.csConfiguration.onConsentGiven=function(payload){");
		expect(result[0].code).toContain("dataLayer.push({event:'iubenda_consent_given'})");
		expect(result[0].code).toContain(
			"dataLayer.push({event:'iubenda_consent_given_purpose_'+pid})",
		);

		// Check onPreferenceNotNeeded callback
		expect(result[0].code).toContain("_iub.csConfiguration.onPreferenceNotNeeded=function(){");
		expect(result[0].code).toContain("dataLayer.push({event:'iubenda_preference_not_needed'})");

		// Check onCcpaOptedOut callback
		expect(result[0].code).toContain("_iub.csConfiguration.onCcpaOptedOut=function(){");
		expect(result[0].code).toContain("dataLayer.push({event:'iubenda_ccpa_opted_out'})");

		// Check SPA navigation script
		expect(result[4].code).toContain("astro:after-swap");
	});

	it("supports custom GTM event and dataLayer names", () => {
		const options: CookieFooterOptions = {
			iubendaOptions: {
				siteId: "12345",
			},
			googleTagManagerOptions: {
				eventName: "custom_consent",
				dataLayerName: "customDataLayer",
			},
		};

		const result = buildCookieFooterScripts(options);

		expect(result).toHaveLength(5);

		// Check custom event name and dataLayer name in onConsentGiven
		expect(result[0].code).toContain("customDataLayer.push({event:'custom_consent'})");
		expect(result[0].code).toContain("window.customDataLayer=window.customDataLayer||[]");

		// Check that other events still use default names (not customizable)
		expect(result[0].code).toContain(
			"customDataLayer.push({event:'iubenda_preference_not_needed'})",
		);
		expect(result[0].code).toContain("customDataLayer.push({event:'iubenda_ccpa_opted_out'})");

		// Check SPA navigation uses custom event name
		expect(result[4].code).toContain("customDataLayer.push({event:'custom_consent'})");
	});
});
