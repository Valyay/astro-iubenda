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
	},
);
