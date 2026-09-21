import {parsePropertyId, type BasesPropertyId, type BasesViewConfig, type CachedMetadata, type FrontmatterLinkCache, type LinkCache} from "obsidian";
import {LINK_SOURCE_CONFIG_KEY} from "./constants";
import {frontmatterLinkMatchesProperty} from "./frontmatterLinks";

export function indent(level: number): string{
	return '  '.repeat(level);
}

export function getBodyLinksForSource(cache: CachedMetadata | null | undefined, linkSource: string): LinkCache[] {
	if (linkSource !== "properties-and-body" && linkSource !== "body-only")
		return [];

	return cache?.links ?? [];
}

export function getFrontmatterLinksForSource(
	cache: CachedMetadata | null | undefined,
	linkSource: string,
	linkPropertyName: string | null = null,
): FrontmatterLinkCache[] {
	if (linkSource !== "properties-and-body" && linkSource !== "properties-only")
		return [];

	return (cache?.frontmatterLinks ?? []).filter((link) => frontmatterLinkMatchesProperty(link.key, linkPropertyName));
}

export function getPropertyNameFromId(propertyId: BasesPropertyId | null): string | null {
	return propertyId ? parsePropertyId(propertyId).name : null;
}

export function shouldHidePropertyLinkOptions(defaultLinkSource: string) {
	return (config?: BasesViewConfig): boolean => {
		const linkSource = config?.get(LINK_SOURCE_CONFIG_KEY);
		const resolvedLinkSource = typeof linkSource === "string" && linkSource.length > 0
			? linkSource
			: defaultLinkSource;

		return resolvedLinkSource === "body-only";
	};
}
