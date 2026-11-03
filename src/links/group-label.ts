import {type BasesEntryGroup} from "obsidian";

interface GroupLabelLink {
	start: number;
	end: number;
	linktext: string;
}

export function parseGroupLabel(group: BasesEntryGroup): {text: string; links: GroupLabelLink[]} {
	const raw = group.hasKey() ? group.key?.toString().trim() ?? "" : "";
	const links: GroupLabelLink[] = [];
	let text = "";
	let offset = 0;
	for (const match of raw.matchAll(/(?<!!)\[\[([^[\]\r\n]+)\]\]/g)) {
		text += raw.slice(offset, match.index);
		const value = match[1]!;
		const separator = value.indexOf("|");
		const linktext = (separator < 0 ? value : value.slice(0, separator)).trim();
		const displayText = separator < 0
			? linktext.split("#").filter(Boolean).join(" > ")
			: value.slice(separator + 1).trim();
		const start = text.length;
		text += displayText;
		links.push({start, end: text.length, linktext});
		offset = match.index + match[0].length;
	}
	return {text: text + raw.slice(offset), links};
}

export function getGroupLabel(group: BasesEntryGroup, fallback = "No value"): string {
	return parseGroupLabel(group).text || fallback;
}
