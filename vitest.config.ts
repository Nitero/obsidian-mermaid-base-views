import {defineConfig} from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			// The obsidian package only ships type declarations. The few runtime
			// functions the tested code imports are stubbed here.
			obsidian: `${import.meta.dirname}/tests/stubs/obsidian.ts`,
		},
	},
	test: {
		include: ["tests/**/*.test.ts"],
	},
});
