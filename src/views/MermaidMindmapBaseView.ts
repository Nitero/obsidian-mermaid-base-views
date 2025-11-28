import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidMindmapViewId} from "../core/constants";
import {MetadataCache, TFile} from "obsidian";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {indent} from "../core/utils";

interface MindmapRenderContext {
	visited: Set<string>;
	filesByPaths: Map<string, TFile>;
	fileToNodeIdsToLabels: Map<string, string>;
	pathToOutgoingLinks: Map<string, Set<string>>;
	showPropertyNames: boolean;
	lines: string[];
}

export class MermaidMindmapBaseView extends MermaidBaseViewBase {
	readonly type = MermaidMindmapViewId;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: MermaidMindmapViewId,
		name: "Mindmap",
		icon: "brain",
		options: [
			{
				type: "text",
				displayName: "Central node label",
				key: "rootLabel",
				default: "Mindmap",
			},
			{
				type: "toggle",
				displayName: "Show property names",
				key: "showPropertyNames",
				default: true,
			},
			{
				type: "text",
				displayName: "Mermaid config (optional)",
				key: "mermaidConfig",
				placeholder: `%%{init: { "theme": "dark" }}%%`,
			},
		],
	};

	protected async render(): Promise<void> {
		const rootLabel = this.getConfigValue("rootLabel", "Mindmap");

		const showPropertyNames = this.getConfigValue("showPropertyNames", true);//TODO: should be connected to default setting

		const metadataCache = this.app.metadataCache;

		const filesByPaths = new Map<string, TFile>();
		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				if (!filesByPaths.has(entry.file.path))
					filesByPaths.set(entry.file.path, entry.file);
			}
		}

		if (filesByPaths.size === 0) {
			this.containerEl.createDiv({text: "No files found in this base."});
			return;
		}

		const {pathToOutgoingLinks, pathIndegrees} = this.buildAdjacencyFromOutgoingLinksRestrictedToBase(filesByPaths, metadataCache);

		const allPaths = Array.from(filesByPaths.keys());
		let roots = allPaths.filter((p) => (pathIndegrees.get(p) ?? 0) === 0);
		if (roots.length === 0)
			roots = allPaths;

		const fileToNodeIdsToLabels = new Map<string, string>();

		let idx = 0;
		for (const path of allPaths) {
			const id = `n${idx++}`;
			fileToNodeIdsToLabels.set(path, id);
		}

		const mermaidCode = this.buildMermaidCode(rootLabel, filesByPaths, fileToNodeIdsToLabels, pathToOutgoingLinks, showPropertyNames, roots);
		await this.renderMermaid(mermaidCode);
	}

	private buildMermaidCode(rootLabel: string, filesByPaths: Map<string, TFile>, fileToNodeIdsToLabels: Map<string, string>, pathToOutgoingLinks: Map<string, Set<string>>, showPropertyNames: boolean, roots: string[]): string {
		const lines: string[] = [];
		lines.push("mindmap");

		const rootId = "root";
		lines.push(`  ${rootId}["${rootLabel}"]`);

		const ctx: MindmapRenderContext = {
			visited: new Set<string>(),
			filesByPaths,
			fileToNodeIdsToLabels,
			pathToOutgoingLinks,
			showPropertyNames,
			lines,
		};

		for (const rootPath of roots)
			this.renderNode(rootPath, 2, ctx);

		return lines.join("\n");
	}

	private renderNode(path: string, level: number, ctx: MindmapRenderContext): void{
		if (ctx.visited.has(path))
			return;
		ctx.visited.add(path);

		const file = ctx.filesByPaths.get(path);
		if (!file)
			return;

		const nodeId = ctx.fileToNodeIdsToLabels.get(path)!;
		const label = this.getLabelWithProperties(file, ctx.showPropertyNames, "\n", ":");

		ctx.lines.push(`${indent(level)}${nodeId}["${label}"]`);

		const children = ctx.pathToOutgoingLinks.get(path);
		if (!children)
			return;

		for (const childPath of children)
			this.renderNode(childPath, level + 1, ctx);
	}

	private buildAdjacencyFromOutgoingLinksRestrictedToBase(filesByPaths: Map<string, TFile>, metadataCache: MetadataCache):
		{ pathToOutgoingLinks: Map<string, Set<string>>; pathIndegrees: Map<string, number>; } {
		const pathToOutgoingLinks = new Map<string, Set<string>>();
		const pathIndegrees = new Map<string, number>();

		for (const path of filesByPaths.keys())
			pathIndegrees.set(path, 0);

		for (const [path, file] of filesByPaths.entries()) {
			const fileCache = metadataCache.getFileCache(file);
			const links = fileCache?.links ?? [];
			const embeds = fileCache?.embeds ?? [];
			const allLinks = [...links, ...embeds];

			for (const link of allLinks) {
				const target = metadataCache.getFirstLinkpathDest(link.link, file.path);
				if (!target)
					continue;
				if (!filesByPaths.has(target.path))
					continue;

				if (target.path === path)
					continue;

				let set = pathToOutgoingLinks.get(path);
				if (!set) {
					set = new Set<string>();
					pathToOutgoingLinks.set(path, set);
				}
				if (!set.has(target.path)) {
					set.add(target.path);
					pathIndegrees.set(
						target.path,
						(pathIndegrees.get(target.path) ?? 0) + 1,
					);
				}
			}
		}
		return {pathToOutgoingLinks: pathToOutgoingLinks, pathIndegrees: pathIndegrees};
	}
}
