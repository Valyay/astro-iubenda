import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
	{
		ignores: [
			"dist/**/*",
			"**/node_modules",
			".idea/",
			".vscode/",
			".cache/",
			"node_modules/",
			"public/",
			".dist/",
			".astro/",
			".changeset",
		],
	},
	eslint.configs.recommended,
	eslintPluginPrettierRecommended,
	// Apply type-aware linting (recommendedTypeChecked) only to ts files
	...tseslint.configs.recommendedTypeChecked.map(config => ({
		...config,
		files: ["**/*.ts", "**/*.d.ts"],
	})),
	{
		files: ["**/*.ts", "**/*.d.ts"],
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/explicit-function-return-type": "error",
		},
	},
	{
		files: ["**/*.test.ts"],
		rules: {
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/unbound-method": "off",
		},
	},
);
