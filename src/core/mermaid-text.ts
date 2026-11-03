export function escapeMermaidQuotedLabel(text: string): string {
	return text.replace(/[&#"`]/g, (character) => `#${character.charCodeAt(0)};`);
}

export function escapeTimelineLabel(text: string): string {
	return text.replace(/[\r\n]+/g, "<br>")
		.replace(/[&#:;]/g, (character) => `#${character.charCodeAt(0)};`);
}

export function escapeCsvField(text: string): string {
	return /[,"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
