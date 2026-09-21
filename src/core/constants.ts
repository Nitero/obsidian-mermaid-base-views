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
	nodeLabelContent: {
		displayName: "Node Label Content",
		key: "nodeLabelContent",
	},
	mermaidConfigOverride: {
		displayName: "Mermaid Config Override Directive (optional)",
		key: "mermaidConfigOverrideDirective",
		placeholder: `%%{init: { "look": "handDrawn", "theme": "neutral" }}%%`,
	},
} as const;

export const COMMON_OPTION_GROUPS = {
	labels: "Labels",
	links: "Links",
} as const;

export const NODE_LABEL_CONTENT_VALUES = {
	namedLinks: "named-links",
	properties: "properties",
} as const;

export const SELECTED_PROPERTIES_LABEL = "Selected Properties";

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
