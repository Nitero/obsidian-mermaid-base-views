import {parseYaml} from "obsidian";

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMermaidConfig(source: string): Record<string, unknown> {
	const frontmatter: unknown = parseYaml(source.replace(/\r?\n---[ \t]*(?:\r?\n[ \t]*)*$/, "\n"));
	return isRecord(frontmatter) && isRecord(frontmatter.config) ? frontmatter.config : {};
}
