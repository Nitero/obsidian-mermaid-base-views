export const COMMON_VIEW_OPTIONS = {
	title: {
		displayName: "Title (optional)",
		key: "title",
		default: "",
	},
	showPropertyNames: {
		displayName: "Show property names",
		key: "showPropertyNames",
		default: true,
	},
	iconProperty: {
		displayName: "Icon property (optional)",
		key: "iconProperty",
		placeholder: "Icon or image property/formula",
	},
	mermaidConfigOverride: {
		displayName: "Mermaid Config Override Directive (optional)",
		key: "mermaidConfigOverrideDirective",
	},
	showDataLabel: {
		displayName: "Show values on labels",
		key: "showDataLabel",
		default: false,
	},
} as const;

export const COMMON_OPTION_GROUPS = {
	labels: "Labels",
	links: "Links",
} as const;

export const NOTE_LABEL_OPTIONS = [
	{type: "toggle", ...COMMON_VIEW_OPTIONS.showPropertyNames},
] as const;

export const NUMBER_RANGE_PLACEHOLDER = "number (defaults to automatic from data)";
export const FILE_SIZE_PLACEHOLDER = "e.g. file size";
