export function createNoteFileNameLinks(node: Element, fileNames: readonly string[], path: string): void {
	const document = node.ownerDocument;
	const labels = node.matches("text, foreignObject") ? [node] : Array.from(node.querySelectorAll("text, foreignObject"));
	for (const label of labels) {
		const content = label.textContent ?? "";
		const characterOffsets: number[] = [];
		let compactContent = "";
		for (let index = 0; index < content.length; index++) {
			if (/\s/.test(content[index]!))
				continue;
			characterOffsets.push(index);
			compactContent += content[index];
		}
		const ranges = fileNames.flatMap((fileName) => {
			const start = content.indexOf(fileName);
			if (fileName.length === 0)
				return [];
			if (start >= 0)
				return [{start, end: start + fileName.length}];
			const compactName = fileName.replace(/\s/g, "");
			const compactStart = compactContent.indexOf(compactName);
			if (compactStart < 0 || compactName.length === 0)
				return [];
			return [{start: characterOffsets[compactStart]!, end: characterOffsets[compactStart + compactName.length - 1]! + 1}];
		});
		const walker = document.createTreeWalker(label, 4);
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
				.map((range) => ({start: Math.max(0, range.start - offset), end: Math.min(length, range.end - offset)}))
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
				link.setAttribute("href", path);
				link.setAttribute("data-href", path);
				link.setAttribute("tabindex", "0");
				matchedText.replaceWith(link);
				link.appendChild(matchedText);
				remainingEnd = segment.start;
			}
			offset += length;
		}
	}
}
