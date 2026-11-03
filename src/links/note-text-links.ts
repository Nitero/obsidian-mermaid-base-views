export interface NoteTextLink {
	start: number;
	end: number;
	path: string;
}

function compactLabelText(text: string): string {
	return text.replace(/<br\s*\/?>|\s/gi, "");
}

export function createLabelTextLinks(node: Element, text: string, links: readonly NoteTextLink[], className?: string): void {
	const labels = node.matches("text, foreignObject") ? [node] : Array.from(node.querySelectorAll("text, foreignObject"));
	const content = labels.map((label) => label.textContent ?? "").join("");
	const offsets: number[] = [];
	let compactContent = "";
	// Preserve character offsets while treating rendered line breaks like source line breaks.
	const plainContent = content.replace(/<br\s*\/?>/gi, (match) => " ".repeat(match.length));
	for (const match of plainContent.matchAll(/\S/g)) {
		offsets.push(match.index);
		compactContent += match[0];
	}
	const compactText = compactLabelText(text);
	const labelStart = compactContent.indexOf(compactText);
	if (!compactText || labelStart < 0)
		return;
	const ranges = links.flatMap((link) => {
		const start = compactLabelText(text.slice(0, link.start)).length;
		const end = compactLabelText(text.slice(0, link.end)).length;
		const contentStart = offsets[labelStart + start];
		const contentEnd = offsets[labelStart + end - 1];
		return link.path && start < end && contentStart !== undefined && contentEnd !== undefined
			? [{start: contentStart, end: contentEnd + 1, path: link.path}] : [];
	});
	let offset = 0;
	for (const label of labels) {
		createNoteTextLinks(label, ranges.map((range) => ({...range, start: range.start - offset, end: range.end - offset})), className);
		offset += label.textContent?.length ?? 0;
	}
}

function createNoteTextLinks(label: Element, ranges: readonly NoteTextLink[], className?: string): void {
	const walker = label.ownerDocument.createTreeWalker(label, 4);
	const textNodes: Text[] = [];
	while (walker.nextNode())
		textNodes.push(walker.currentNode as Text);
	let offset = 0;
	for (const textNode of textNodes) {
		const length = textNode.length;
		if (textNode.parentElement?.closest(".bases-mermaid-file-name-link")) {
			offset += length;
			continue;
		}
		const segments = ranges
			.map((range) => ({
				start: Math.max(0, range.start - offset),
				end: Math.min(length, range.end - offset),
				path: range.path,
				range: `${range.start}-${range.end}`,
			}))
			.filter((range) => range.start < range.end)
			.sort((first, second) => second.start - first.start);
		let remainingEnd = length;
		for (const segment of segments) {
			if (segment.end > remainingEnd)
				continue;
			const matchedText = textNode.splitText(segment.start);
			matchedText.splitText(segment.end - segment.start);
			const link = label.localName === "foreignObject"
				? createEl("a")
				: createSvg("a");
			link.classList.add("bases-mermaid-note-link", "bases-mermaid-file-name", "bases-mermaid-file-name-link");
			if (className) {
				link.classList.add(className);
				link.setAttribute("data-bases-link-range", segment.range);
			}
			link.setAttribute("href", segment.path);
			link.setAttribute("data-href", segment.path);
			link.setAttribute("tabindex", "0");
			matchedText.replaceWith(link);
			link.appendChild(matchedText);
			remainingEnd = segment.start;
		}
		offset += length;
	}
}
