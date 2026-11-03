import {type BasesEntryGroup, type CachedMetadata, type TFile} from "obsidian";
import {escapeMermaidQuotedLabel} from "../../utils/mermaid-text";
import {getBodyLinksForSource, getFrontmatterLinksForSource} from "../../links/note-links";
import {getGroupLabel} from "../../links/group-label";

interface MindmapOptions {
	rootLabel: string | null;
	hasGrouping: boolean;
	linkSource: string;
	linkPropertyName: string | null;
	getFileCache: (file: TFile) => CachedMetadata | null;
	resolveLink: (linkpath: string, sourcePath: string) => TFile | null;
	getLabel: (file: TFile) => string;
}

export function buildMindmapCode(
	groups: readonly BasesEntryGroup[],
	baseFilesByPath: ReadonlyMap<string, TFile>,
	options: MindmapOptions,
): {code: string; noteNodes: Map<string, string>} {
	const filesByPath = new Map(baseFilesByPath);
	const outgoingLinks = new Map<string, Set<string>>();
	const indegree = new Map(Array.from(filesByPath.keys(), (path) => [path, 0]));

	for (const [path, file] of baseFilesByPath) {
		const cache = options.getFileCache(file);
		const links = [
			...getBodyLinksForSource(cache, options.linkSource),
			...getFrontmatterLinksForSource(cache, options.linkSource, options.linkPropertyName),
		];
		for (const link of links) {
			const target = options.resolveLink(link.link, file.path);
			if (!target || target.path === path)
				continue;
			if (!filesByPath.has(target.path)) {
				filesByPath.set(target.path, target);
				indegree.set(target.path, 0);
			}
			let children = outgoingLinks.get(path);
			if (!children) {
				children = new Set();
				outgoingLinks.set(path, children);
			}
			if (!children.has(target.path)) {
				children.add(target.path);
				indegree.set(target.path, (indegree.get(target.path) ?? 0) + 1);
			}
		}
	}

	const allPaths = Array.from(filesByPath.keys());
	let roots = allPaths.filter((path) => (indegree.get(path) ?? 0) === 0);
	if (roots.length === 0)
		roots = allPaths;
	const noteNodes = new Map(allPaths.map((path, index) => [path, `n${index}`]));
	const visited = new Set<string>();
	const lines = ["mindmap", options.rootLabel === null
		? "  root" : `  root["${escapeMermaidQuotedLabel(options.rootLabel)}"]`];

	const renderNode = (path: string, level: number, groupedPaths?: ReadonlySet<string>): void => {
		if (visited.has(path))
			return;
		visited.add(path);
		const file = filesByPath.get(path);
		if (!file)
			return;
		const nodeId = noteNodes.get(path)!;
		const label = options.getLabel(file);
		lines.push(`${"  ".repeat(level)}${nodeId}["${escapeMermaidQuotedLabel(label)}"]`);
		lines.push(`${"  ".repeat(level + 1)}:::bases-mermaid-note-${nodeId}`);
		for (const childPath of outgoingLinks.get(path) ?? []) {
			if (!groupedPaths?.has(childPath))
				renderNode(childPath, level + 1, groupedPaths);
		}
	};

	if (options.hasGrouping) {
		const groupedPaths = new Set(groups.flatMap((group) => group.entries.map((entry) => entry.file.path)));
		for (const [groupIndex, group] of groups.entries()) {
			if (group.entries.length === 0)
				continue;
			const label = getGroupLabel(group, `No value (${groupIndex + 1})`);
			const safeLabel = escapeMermaidQuotedLabel(label.replace(/[\r\n]/g, " "));
			lines.push(`    g${groupIndex}["${safeLabel}"]`);
			for (const entry of group.entries)
				renderNode(entry.file.path, 3, groupedPaths);
		}
	} else {
		for (const path of roots)
			renderNode(path, 2);
		for (const path of allPaths) {
			if (!visited.has(path))
				renderNode(path, 2);
		}
	}
	return {code: lines.join("\n"), noteNodes};
}
