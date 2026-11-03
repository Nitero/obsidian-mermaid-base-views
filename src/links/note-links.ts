import {
	parsePropertyId,
	type BasesPropertyId,
	type CachedMetadata,
	type FrontmatterLinkCache,
	type LinkCache
} from "obsidian";
import {frontmatterLinkMatchesProperty} from "./frontmatter-links";

export const LINK_SOURCE_VALUES = {
	propertiesAndBody: "properties-and-body",
	propertiesOnly: "properties-only",
	bodyOnly: "body-only",
} as const;

export function getBodyLinksForSource(cache: CachedMetadata | null | undefined, linkSource: string): LinkCache[] {
	if (linkSource !== LINK_SOURCE_VALUES.propertiesAndBody && linkSource !== LINK_SOURCE_VALUES.bodyOnly)
		return [];

	return cache?.links ?? [];
}

export function getFrontmatterLinksForSource(
	cache: CachedMetadata | null | undefined,
	linkSource: string,
	linkPropertyName: string | null = null,
): FrontmatterLinkCache[] {
	if (linkSource !== LINK_SOURCE_VALUES.propertiesAndBody && linkSource !== LINK_SOURCE_VALUES.propertiesOnly)
		return [];

	return (cache?.frontmatterLinks ?? []).filter((link) => frontmatterLinkMatchesProperty(link.key, linkPropertyName));
}

export function getPropertyNameFromId(propertyId: BasesPropertyId | null): string | null {
	return propertyId ? parsePropertyId(propertyId).name : null;
}
