import type {CachedMetadata, FrontmatterLinkCache, LinkCache} from "obsidian";

export function indent(level: number): string{
	return '  '.repeat(level);
}

export function getBodyLinksForSource(cache: CachedMetadata | null | undefined, linkSource: string): LinkCache[] {
	if (linkSource !== "properties-and-body" && linkSource !== "body-only")
		return [];

	return cache?.links ?? [];
}

export function getFrontmatterLinksForSource(cache: CachedMetadata | null | undefined, linkSource: string): FrontmatterLinkCache[] {
	if (linkSource !== "properties-and-body" && linkSource !== "properties-only")
		return [];

	return cache?.frontmatterLinks ?? [];
}
