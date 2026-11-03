import {type BasesEntryGroup, type MetadataCache, type TFile} from "obsidian";

export function collectBaseFilesByPath(groups: readonly BasesEntryGroup[]): Map<string, TFile> {
	const filesByPath = new Map<string, TFile>();
	for (const group of groups) {
		if (!group)
			continue;
		for (const entry of group.entries) {
			if (entry.file && !filesByPath.has(entry.file.path))
				filesByPath.set(entry.file.path, entry.file);
		}
	}
	return filesByPath;
}

export function getLinkedFileIfVisible(
	metadataCache: MetadataCache,
	linkpath: string,
	sourcePath: string,
	baseFilesByPath: ReadonlyMap<string, TFile>,
	showLinksToFilteredOutNotes: boolean,
): TFile | null {
	const target = metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
	if (!target || (!showLinksToFilteredOutNotes && !baseFilesByPath.has(target.path)))
		return null;
	return target;
}
