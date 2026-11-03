import {type BasesViewConfig} from "obsidian";
import {LINK_SOURCE_VALUES} from "../links/note-links";

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

export function shouldHidePropertyLinkOptions(defaultLinkSource: string) {
	return (config?: BasesViewConfig): boolean => {
		const linkSource = config?.get(LINK_OPTIONS.source.key);
		const resolvedLinkSource = typeof linkSource === "string" && linkSource.length > 0
			? linkSource
			: defaultLinkSource;

		return resolvedLinkSource === LINK_SOURCE_VALUES.bodyOnly;
	};
}
