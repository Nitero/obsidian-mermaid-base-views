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

export const LINK_SOURCE_VALUES = {
	propertiesAndBody: "properties-and-body",
	propertiesOnly: "properties-only",
	bodyOnly: "body-only",
} as const;

export const EDGE_LINK_SOURCE_OPTIONS: Record<string, string> = {
	[LINK_SOURCE_VALUES.propertiesAndBody]: "Properties And Body",
	[LINK_SOURCE_VALUES.propertiesOnly]: "Properties",
	[LINK_SOURCE_VALUES.bodyOnly]: "Body",
};

export const DEFAULT_LINK_SOURCE = LINK_SOURCE_VALUES.propertiesAndBody;

export const LINK_OPTIONS = {
	source: {
		displayName: "Link Source",
		key: "linkSource",
		default: DEFAULT_LINK_SOURCE,
		options: EDGE_LINK_SOURCE_OPTIONS,
	},
	property: {
		displayName: "Link property (optional)",
		key: "linkProperty",
		placeholder: "e.g. parent_note",
	},
	showFilteredOutNotes: {
		displayName: "Show links to filtered-out notes",
		key: "showLinksToFilteredOutNotes",
		default: false,
	},
} as const;
