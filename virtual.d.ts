declare module "virtual:astro-iubenda" {
	export interface PolicySet {
		privacyPolicy: string | null;
		cookiePolicy: string | null;
		termsAndConditions: string | null;
	}
	export const documents: Record<string, PolicySet>;
	export function getDocument(id: string, type?: keyof PolicySet): string | null;
}
