import type { InjectedScriptStage } from "astro";

export interface CookieFooterOptions {
	/**
	 * The `_iub.csConfiguration` object you copy from the Iubenda dashboard.
	 */
	iubendaOptions: Record<string, unknown>;

	/**
	 * `true` → push default event `iubenda_consent_given` to `dataLayer`.
	 * Pass an object to customise names.
	 */
	googleTagManagerOptions?:
		| boolean
		| {
				eventName?: string;
				dataLayerName?: string;
		  };

	/**
	 * Where to inject the banner scripts. Default `head-inline` (recommended by Iubenda).
	 */
	injectionStage?: "head-inline" | "page";
}

export const buildCookieFooterScripts = (cookieFooter?: CookieFooterOptions | false) => {
	if (!cookieFooter) return [];

	const { iubendaOptions, googleTagManagerOptions, injectionStage = "head-inline" } = cookieFooter;

	const eventName =
		typeof googleTagManagerOptions === "object" && googleTagManagerOptions?.eventName
			? googleTagManagerOptions.eventName
			: "iubenda_consent_given";

	const dataLayerName =
		typeof googleTagManagerOptions === "object" && googleTagManagerOptions?.dataLayerName
			? googleTagManagerOptions.dataLayerName
			: "dataLayer";

	/* inline _iub.csConfiguration */
	const gtmCallbacks = googleTagManagerOptions
		? `\n// GTM events\n_iub.csConfiguration.onConsentGiven=function(payload){\n  window.${dataLayerName}=window.${dataLayerName}||[];\n  window.${dataLayerName}.push({event:'${eventName}'});\n  if(payload && payload.purposes){\n    payload.purposes.forEach(function(pid){\n      window.${dataLayerName}.push({event:'iubenda_consent_given_purpose_'+pid});\n    });\n  }\n};\n_iub.csConfiguration.onPreferenceNotNeeded=function(){\n  window.${dataLayerName}=window.${dataLayerName}||[];\n  window.${dataLayerName}.push({event:'iubenda_preference_not_needed'});\n};\n_iub.csConfiguration.onCcpaOptedOut=function(){\n  window.${dataLayerName}=window.${dataLayerName}||[];\n  window.${dataLayerName}.push({event:'iubenda_ccpa_opted_out'});\n};`
		: "";

	const configSnippet = `var _iub=_iub||[];\n_iub.csConfiguration=${JSON.stringify(iubendaOptions)};${gtmCallbacks}`;

	/* helper to inject external script via DOM */
	const addScript = (src: string, attrs = "") =>
		`(()=>{var s=document.createElement('script');s.src='${src}';s.async=true;${attrs}document.head.appendChild(s);})();`;

	const siteId = (iubendaOptions as { siteId?: number | string }).siteId;

	const snippets: Array<{ stage: InjectedScriptStage; code: string }> = [
		{ stage: injectionStage, code: configSnippet },
	];

	if (siteId)
		snippets.push({
			stage: injectionStage,
			code: addScript(`https://cs.iubenda.com/autoblocking/${siteId}.js`),
		});
	snippets.push({ stage: injectionStage, code: addScript("//cdn.iubenda.com/cs/gpp/stub.js") });
	snippets.push({
		stage: injectionStage,
		code: addScript("//cdn.iubenda.com/cs/iubenda_cs.js", "s.charset='UTF-8';"),
	});

	/* SPA navigation — fire GTM event again if consent already given */
	if (googleTagManagerOptions) {
		const spaSnippet = `document.addEventListener('astro:after-swap',function(){if(window._iub?.cs?.consent_given){window.${dataLayerName}=window.${dataLayerName}||[];window.${dataLayerName}.push({event:'${eventName}'})}});`;
		snippets.push({ stage: injectionStage, code: spaSnippet });
	}

	return snippets;
};
