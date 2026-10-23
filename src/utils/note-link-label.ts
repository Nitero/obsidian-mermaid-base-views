export function createNoteFileNameLinks(node: Element, fileNames: readonly string[], path: string): number {
	let linkCount = 0;
	const document = node.ownerDocument;
	const labels = node.matches("text") ? [node] : Array.from(node.querySelectorAll("text"));
	for (const label of labels) {
		const content = label.textContent ?? "";
		const ranges = fileNames.flatMap((fileName) => {
			const start = content.indexOf(fileName);
			return start < 0 || fileName.length === 0 ? [] : [{start, end: start + fileName.length}];
		});
		const walker = document.createTreeWalker(label, 4);
		const textNodes: Text[] = [];
		while (walker.nextNode())
			textNodes.push(walker.currentNode as Text);
		let offset = 0;
		for (const textNode of textNodes) {
			const length = textNode.length;
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
				const span = createSvg("a");
				span.classList.add("bases-mermaid-note-link", "bases-mermaid-file-name", "bases-mermaid-file-name-link");
				span.setAttribute("href", path);
				span.setAttribute("data-href", path);
				span.setAttribute("tabindex", "0");
				linkCount++;
				matchedText.replaceWith(span);
				span.appendChild(matchedText);
				remainingEnd = segment.start;
			}
			offset += length;
		}
	}
	return linkCount;
}
