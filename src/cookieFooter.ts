import type { InjectedScriptStage } from "astro";

/** Object callback inside _iub.csConfiguration */ /* Iubenda CS - Advanced configurator (sorted per documentation) */
/* ------------------------------------------------------------- */

export type HexColor = `#${string}`;
export type BannerVersion = "beta" | "current" | "stable";
export type TcfPurposesKeys = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

/* ----------------------------------------------------------------- */
/* CALLBACKS (same order as guide’s list)                            */
/* ----------------------------------------------------------------- */
export type ConsentEventName =
	| "documentScroll"
	| "documentMoved"
	| "bannerXClose"
	| "documentClicked"
	| "cookiePolicyClosed";

export interface IubendaCallbacks {
	onReady?: (has: boolean) => void;
	onBannerShown?: () => void;
	onBannerClosed?: () => void;
	onCookiePolicyShown?: () => void;
	onConsentGiven?: (c: boolean) => void;
	onConsentFirstGiven?: (e: ConsentEventName) => void;
	onConsentRejected?: () => void;
	onConsentFirstRejected?: (e: ConsentEventName) => void;
	onPreferenceExpressed?: (p: unknown) => void;
	onPreferenceFirstExpressed?: (p: unknown) => void;
	onPreferenceExpressedOrNotNeeded?: (p: unknown) => void;
	onPreferenceNotNeeded?: () => void;
	onConsentRead?: (c: boolean) => void;
	onStartupFailed?: (msg: string) => void;
	onError?: (msg: string) => void;
	onFatalError?: (msg: string) => void;
	onActivationDone?: () => void;
	onBeforePreload?: () => void;
	onCcpaAcknowledged?: () => void;
	onCcpaFirstAcknowledged?: () => void;
	onCcpaOptOut?: () => void;
	onCcpaFirstOptOut?: () => void;
	on2ndLayerShown?: () => void;
}

/* ----------------------------------------------------------------- */
/* MAIN CONFIG                                                       */
/* ----------------------------------------------------------------- */
export interface IubendaOptions {
	/* 1 — REQUIRED PARAMETERS ----------------------------------------- */
	siteId: number;
	cookiePolicyId: number;
	lang: string;

	/* 2 — COMPLIANCE SETTINGS ----------------------------------------- */

	/* generic */
	countryDetection?: boolean;

	/* GDPR */
	enableGdpr?: boolean;
	gdprAppliesGlobally?: boolean;
	gdprApplies?: boolean;
	perPurposeConsent?: boolean;
	purposes?: string;

	/* US State laws + CCPA */
	enableUspr?: boolean;
	usprApplies?: boolean;
	usprPurposes?: string;
	showBannerForUS?: boolean;
	noticeAtCollectionUrl?: string;

	enableCcpa?: boolean;
	ccpaApplies?: boolean;
	ccpaNoticeDisplay?: boolean;
	ccpaAcknowledgeOnDisplay?: boolean;
	ccpaAcknowledgeOnLoad?: boolean;
	ccpaLspa?: boolean;

	/* LGPD */
	enableLgpd?: boolean;
	lgpdAppliesGlobally?: boolean;
	lgpdApplies?: boolean;

	/* IAB TCF v2 */
	enableTcf?: boolean;
	googleAdditionalConsentMode?: boolean;
	tcfPurposes?: {
		[K in TcfPurposesKeys]?: "consent_not_needed" | false | "li_only" | "consent_only";
	};
	askConsentIfCMPNotFound?: boolean;
	newConsentAtVendorListUpdate?: number;
	tcfPublisherCC?: string;
	acceptTcfSpecialFeaturesWithAcceptBtn?: boolean;

	/* 3 — STYLE AND TEXT ---------------------------------------------- */
	banner?: {
		/* buttons */
		acceptButtonDisplay?: boolean;
		customizeButtonDisplay?: boolean;
		rejectButtonDisplay?: boolean;
		closeButtonDisplay?: boolean;
		closeButtonRejects?: boolean;
		explicitWithdrawal?: boolean;

		/* first-layer purpose UI */
		listPurposes?: boolean;
		showPurposesToggles?: boolean;

		/* format / position */
		position?:
			| "top"
			| "bottom"
			| "float-top-left"
			| "float-top-right"
			| "float-bottom-left"
			| "float-bottom-right"
			| "float-top-center"
			| "float-bottom-center"
			| "float-center";
		backgroundOverlay?: boolean;

		/* theme */
		logo?: string;
		brandTextColor?: HexColor;
		brandBackgroundColor?: HexColor;
		backgroundColor?: HexColor;
		textColor?: HexColor;
		acceptButtonColor?: HexColor;
		acceptButtonCaptionColor?: HexColor;
		customizeButtonColor?: HexColor;
		customizeButtonCaptionColor?: HexColor;
		rejectButtonColor?: HexColor;
		rejectButtonCaptionColor?: HexColor;
		continueWithoutAcceptingButtonColor?: HexColor;
		continueWithoutAcceptingButtonCaptionColor?: HexColor;
		applyStyles?: boolean;
		zIndex?: number;

		/* text / fonts */
		fontSize?: string;
		fontSizeCloseButton?: string;
		fontSizeBody?: string;
		content?: string;
		acceptButtonCaption?: string;
		customizeButtonCaption?: string;
		rejectButtonCaption?: string;
		closeButtonCaption?: string;
		continueWithoutAcceptingButtonCaption?: string | false;
		useThirdParties?: boolean;
		showTotalNumberOfProviders?: boolean;
		totalNumberOfProviders?: number;
		html?: string;
		footer?: { btnCaption?: string };
		i18n?: Record<string, unknown>;
		cookiePolicyLinkCaption?: string;

		/* banner behaviour */
		slideDown?: boolean;
		prependOnBody?: boolean;
	};

	/* consent widget */
	floatingPreferencesButtonDisplay?:
		| boolean
		| "top-left"
		| "top-right"
		| "bottom-left"
		| "bottom-right"
		| "anchored-center-left"
		| "anchored-center-right"
		| "anchored-top-left"
		| "anchored-top-right"
		| "anchored-bottom-left"
		| "anchored-bottom-right";
	floatingPreferencesButtonCaption?: string;
	floatingPreferencesButtonIcon?: boolean;
	floatingPreferencesButtonHover?: boolean;
	floatingPreferencesButtonRound?: boolean;
	floatingPreferencesButtonZIndex?: number;
	floatingPreferencesButtonColor?: HexColor;
	floatingPreferencesButtonCaptionColor?: HexColor;

	/* 4 — PRIVACY & COOKIE POLICY ------------------------------------- */
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	cookiePolicyInOtherWindow?: boolean;
	cookiePolicyLinkCaption?: string; // inside banner{}

	/* 5 — ADVANCED SETTINGS ------------------------------------------- */

	/* 5.1 banner-specific (inside banner{}) already placed above        */

	/* 5.2 consent-collection */
	reloadOnConsent?: boolean;
	askConsentAtCookiePolicyUpdate?: boolean;
	enableRemoteConsent?: boolean;
	invalidateConsentWithoutLog?: boolean | `${number}-${number}-${number}`;
	googleConsentMode?: boolean | "template";

	/* 5.3 development & debugging */
	inlineDelay?: number;
	rebuildIframe?: boolean;
	skipSaveConsent?: boolean;
	logLevel?: "debug" | "info" | "warn" | "error" | "fatal" | "nolog";

	/* inline activator */
	safeTimeout?: number;
	forceSafeActivation?: boolean;

	/* cookie expiration */
	preferenceCookie?: { expireAfter?: number };
	ccpaCookie?: { expireAfter?: number };

	/* local domain & path */
	localConsentDomain?: string;
	localConsentDomainExact?: boolean;
	localConsentPath?: string;

	/* misc. limits / branding */
	whitelabel?: boolean;
	invalidateConsentBefore?: number | `${number}-${number}-${number}`;
	maxCookieSize?: number;
	maxCookieChunks?: number;
	timeoutLoadConfiguration?: number;
	startOnDomReady?: boolean;

	/* callbacks */
	callback?: IubendaCallbacks;
}

export interface CookieFooterOptions {
	/**
	 * The `_iub.csConfiguration` object you copy from the Iubenda dashboard.
	 */
	iubendaOptions: IubendaOptions;

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
	/**
	 * The version of the Iubenda banner to use.
	 * Default: "current" (latest stable version).
	 * Use "beta" for latest beta version, or "stable" for the last stable version.
	 */
	bannerVersion?: BannerVersion;
}

export const buildCookieFooterScripts = (
	cookieFooter?: CookieFooterOptions | false,
): {
	stage: InjectedScriptStage;
	code: string;
}[] => {
	if (!cookieFooter) return [];

	const {
		iubendaOptions,
		googleTagManagerOptions,
		injectionStage = "head-inline",
		bannerVersion = "current",
	} = cookieFooter;

	const versionPath = bannerVersion === "current" ? "" : `/${bannerVersion}`;

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
	const addScript = (src: string, attrs = ""): string =>
		`(()=>{var s=document.createElement('script');s.src='${src}';s.async=true;${attrs}document.head.appendChild(s);})();`;

	const siteId = iubendaOptions.siteId;

	const snippets: Array<{ stage: InjectedScriptStage; code: string }> = [
		{ stage: injectionStage, code: configSnippet },
	];

	if (siteId)
		snippets.push({
			stage: injectionStage,
			code: addScript(`https://cs.iubenda.com/autoblocking/${siteId}.js`),
		});

	snippets.push({ stage: injectionStage, code: addScript("//cdn.iubenda.com/cs/gpp/stub.js") });

	if (iubendaOptions.enableTcf)
		snippets.push({
			stage: injectionStage,
			code: addScript(`//cdn.iubenda.com/cs/tcf${versionPath}/stub-v2.js`),
		});

	if (iubendaOptions.enableUspr)
		snippets.push({
			stage: injectionStage,
			code: addScript(`//cdn.iubenda.com/cs/gpp${versionPath}/stub.js`),
		});

	snippets.push({
		stage: injectionStage,
		code: addScript(`//cdn.iubenda.com/cs${versionPath}/iubenda_cs.js`, "s.charset='UTF-8';"),
	});

	/* SPA navigation — fire GTM event again if consent already given */
	if (googleTagManagerOptions) {
		const spaSnippet = `document.addEventListener('astro:after-swap',function(){if(window._iub?.cs?.consent_given){window.${dataLayerName}=window.${dataLayerName}||[];window.${dataLayerName}.push({event:'${eventName}'})}});`;
		snippets.push({ stage: injectionStage, code: spaSnippet });
	}

	return snippets;
};
