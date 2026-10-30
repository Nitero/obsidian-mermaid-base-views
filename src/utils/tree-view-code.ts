import {BooleanValue, NullValue, type BasesEntry, type BasesPropertyId, type TFile, type Value} from "obsidian";
import {parseNoteIcon, type NoteMedia} from "./note-media";
import {type TreeViewBranch, type TreeViewNode} from "./tree-view-tree";

export const TREE_VIEW_FOLD_MARKER = "\u25b8";

export interface TreeViewNoteRow {
	path: string;
	label: string;
	media: NoteMedia | null;
}

export interface TreeViewBranchRow {
	branch: TreeViewBranch;
	collapsed: boolean;
}

interface TreeViewLabelOptions {
	properties: readonly BasesPropertyId[];
	showPropertyNames: boolean;
	getDisplayName: (property: BasesPropertyId) => string;
	formatValue: (value: Value, file: TFile) => string;
	highlightProperty: BasesPropertyId | null;
	iconProperty: BasesPropertyId | null;
	isCollapsed: (branch: TreeViewBranch) => boolean;
}

export function escapeTreeViewText(text: string): string {
	return text.replace(/[\r\n\t\u2028\u2029]/g, " ")
		.replace(/[&#"<>`]/g, (character) => `#${character.charCodeAt(0)};`);
}

function getFileLabel(entry: BasesEntry, properties: readonly BasesPropertyId[]): string {
	const property = properties.find((property) => property === "file.name" || property === "file.basename");
	if (property === "file.name")
		return entry.file.name;
	if (property === "file.basename" || entry.file.extension === "md")
		return entry.file.basename;
	return entry.file.name;
}

function getDescription(entry: BasesEntry, options: TreeViewLabelOptions): string {
	const parts: string[] = [];
	for (const property of options.properties) {
		if (property === "file.name" || property === "file.basename")
			continue;
		const value = entry.getValue(property);
		if (value === null || value instanceof NullValue)
			continue;
		const text = options.formatValue(value, entry.file);
		if (!text.trim())
			continue;
		parts.push(options.showPropertyNames ? `${options.getDisplayName(property)}: ${text}` : text);
	}
	return parts.join(" · ");
}

export function buildTreeViewCode(
	roots: readonly TreeViewNode[], options: TreeViewLabelOptions,
): {code: string; rows: TreeViewNoteRow[]; branches: TreeViewBranchRow[]} {
	const lines = ["treeView-beta"];
	const rows: TreeViewNoteRow[] = [];
	const branches: TreeViewBranchRow[] = [];
	const pending = roots.map((node) => ({node, depth: 1})).reverse();
	while (pending.length > 0) {
		const {node, depth} = pending.pop()!;
		const indentation = "  ".repeat(depth);
		if (node.kind === "branch") {
			const collapsed = options.isCollapsed(node);
			branches.push({branch: node, collapsed});
			lines.push(`${indentation}"${escapeTreeViewText(node.label)}\u00a0${TREE_VIEW_FOLD_MARKER}/"`);
			if (!collapsed) {
				for (let index = node.children.length - 1; index >= 0; index--)
					pending.push({node: node.children[index]!, depth: depth + 1});
			}
			continue;
		}
		const label = getFileLabel(node.entry, options.properties);
		const media = parseNoteIcon(options.iconProperty ? node.entry.getValue(options.iconProperty) : null);
		const icon = media === "none" ? " icon(none)" : media ? " icon(file)" : "";
		const value = options.highlightProperty ? node.entry.getValue(options.highlightProperty) : null;
		const highlight = value instanceof BooleanValue && value.isTruthy() ? " :::highlight" : "";
		const description = getDescription(node.entry, options);
		lines.push(`${indentation}"${escapeTreeViewText(label)}"${icon}${highlight}${description ? ` ## ${escapeTreeViewText(description)}` : ""}`);
		rows.push({path: node.entry.file.path, label, media: media === "none" ? null : media});
	}
	return {code: lines.join("\n"), rows, branches};
}
