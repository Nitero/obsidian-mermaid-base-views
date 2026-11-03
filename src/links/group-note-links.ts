import {parseLinktext, type App, type BasesEntryGroup} from "obsidian";
import {createNoteTextLinks} from "./note-filename-links";
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
			start: text.slice(0, start).replace(/\s/g, "").length,
			end: text.slice(0, end).replace(/\s/g, "").length,
			path: `${file?.path ?? path}${subpath}`,
		};
	});
	const labels = node.matches("text, foreignObject") ? [node] : Array.from(node.querySelectorAll("text, foreignObject"));
	for (const label of labels) {
		const content = label.textContent ?? "";
		const offsets: number[] = [];
		let compactContent = "";
		for (let index = 0; index < content.length; index++) {
			if (/\s/.test(content[index]!))
				continue;
			offsets.push(index);
			compactContent += content[index];
		}
		const start = compactContent.indexOf(text.replace(/\s/g, ""));
		if (start < 0)
			continue;
		const ranges = targets.filter((link) => link.path && link.start < link.end).map((link) => ({
			start: offsets[start + link.start]!,
			end: offsets[start + link.end - 1]! + 1,
			path: link.path,
		}));
		createNoteTextLinks(label, ranges, "bases-mermaid-group-note-link");
	}
}
