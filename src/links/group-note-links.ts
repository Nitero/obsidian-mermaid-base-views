import {parseLinktext, type App, type BasesEntryGroup} from "obsidian";
import {createLabelTextLinks} from "./note-text-links";
import {parseGroupLabel} from "./group-label";

export function createGroupNoteLinks(app: App, node: Element, group: BasesEntryGroup): void {
	const {text, links} = parseGroupLabel(group);
	if (links.length === 0)
		return;
	const sourceFile = group.entries[0]?.file;
	const targets = links.map(({start, end, linktext}) => {
		const {path, subpath} = parseLinktext(linktext);
		const file = path ? app.metadataCache.getFirstLinkpathDest(path, sourceFile?.path ?? "") : sourceFile;
		return {
			start,
			end,
			path: `${file?.path ?? path}${subpath}`,
		};
	});
	createLabelTextLinks(node, text, targets, "bases-mermaid-group-note-link");
}
