// Obsidian reports the frontmatter property a link came from in
// FrontmatterLinkCache.key. For a list property every entry gets its index
// appended ("parent_note.0", "parent_note.1"), which is not part of the property
// name. The format is not covered by the public API documentation.
const listIndexSuffix = /(\.\d+)+$/;

export function frontmatterLinkKeyToProperty(key: string): string {
	return key.replace(listIndexSuffix, "");
}

export function frontmatterLinkMatchesProperty(key: string, property: string | null): boolean {
	if (property === null)
		return true;

	return frontmatterLinkKeyToProperty(key) === property;
}
