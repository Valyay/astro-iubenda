import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	target: "node18",
	bundle: true,
	dts: {
		banner: '/// <reference path="./virtual.d.ts" />\n',
	},
	sourcemap: true,
	clean: true,
	external: ["astro", "vite"],
	treeshake: true,
	tsconfig: "tsconfig.json",
});
