import {MermaidBasesView} from "../core/mermaid-bases-view";
import {MERMAID_CONFIG_EXAMPLES} from "../core/mermaid-config-examples";
import {TFile} from "obsidian";
import {MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {
	getBodyLinksForSource,
	getFrontmatterLinksForSource,
	getPropertyNameFromId,
	indent,
	shouldHidePropertyLinkOptions
} from "../utils/utils";
import MermaidBaseViews from "../main";
import {
	COMMON_OPTION_GROUPS,
	COMMON_VIEW_OPTIONS,
	LINK_OPTIONS,
	NOTE_LABEL_OPTIONS
} from "../core/constants";

interface MindmapRenderContext {
	visited: Set<string>;
	filesByPath: Map<string, TFile>;
	fileToNodeIdsToLabels: Map<string, string>;
	pathToOutgoingLinks: Map<string, Set<string>>;
	indegree: Map<string, number>;
	showPropertyNames: boolean;
	lines: string[];
	linkSource: string;
	showLinksToFilteredOutNotes: boolean;
	linkPropertyName: string | null;
}

export class MindmapView extends MermaidBasesView {
	readonly type = MindmapView.RegistrationData.id;
	readonly registrationData = MindmapView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-mindmap",
		name: "Mindmap",
		icon: "custom-molecule",//brain
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: "Central node label (optional)",
				key: "rootLabel",
				default: "",
			},
			{
				displayName: COMMON_OPTION_GROUPS.labels,
				type: "group",
				items: [
					...NOTE_LABEL_OPTIONS,
				],
			},
			{
				displayName: COMMON_OPTION_GROUPS.links,
				type: "group",
				items: [
					{
						type: "dropdown",
						displayName: LINK_OPTIONS.source.displayName,
						key: LINK_OPTIONS.source.key,
						default: LINK_OPTIONS.source.default,
						options: LINK_OPTIONS.source.options,
					},
					{
						type: "toggle",
						displayName: LINK_OPTIONS.showFilteredOutNotes.displayName,
						key: LINK_OPTIONS.showFilteredOutNotes.key,
						default: LINK_OPTIONS.showFilteredOutNotes.default,
					},
					{
						type: "property",
						displayName: LINK_OPTIONS.property.displayName,
						key: LINK_OPTIONS.property.key,
						placeholder: LINK_OPTIONS.property.placeholder,
						filter: plugin.propertyTypes.createSourceFilter("note"),
						shouldHide: shouldHidePropertyLinkOptions(LINK_OPTIONS.source.default),
					},
				],
			},
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.mindmap.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const rootLabel = this.getOptionalTitle("rootLabel");
		const showPropertyNames = this.getConfigValue<boolean>(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		const linkSource = this.getConfigValue<string>(LINK_OPTIONS.source.key);
		const showLinksToFilteredOutNotes = this.getConfigValue<boolean>(LINK_OPTIONS.showFilteredOutNotes.key);
		const linkPropertyName = getPropertyNameFromId(this.config.getAsPropertyId(LINK_OPTIONS.property.key));

		const filesByPath = this.collectBaseFilesByPath();
		const ctx: MindmapRenderContext = {
			visited: new Set<string>(),
			filesByPath: new Map<string, TFile>(filesByPath),
			fileToNodeIdsToLabels: new Map<string, string>(),
			pathToOutgoingLinks: new Map<string, Set<string>>(),
			indegree: new Map<string, number>(),
			showPropertyNames,
			lines: [],
			linkSource,
			showLinksToFilteredOutNotes,
			linkPropertyName,
		};

		if (filesByPath.size === 0) {
			this.containerEl.createDiv({text: "No files found in this base."});
			return;
		}

		this.collectOutgoingLinks(filesByPath, ctx);

		const mermaidCode = this.buildMermaidCode(rootLabel, ctx);
		await this.renderMermaid(
			mermaidCode,
			this.plugin.settings.mindmapMermaidConfig,
			ctx.fileToNodeIdsToLabels,
		);
	}

	private buildMermaidCode(
		rootLabel: string | null,
		ctx: MindmapRenderContext,
	): string {
		const allPaths = Array.from(ctx.filesByPath.keys());
		let roots = allPaths.filter((p) => (ctx.indegree.get(p) ?? 0) === 0);
		if (roots.length === 0)
			roots = allPaths;

		let idx = 0;
		for (const path of allPaths) {
			const id = `n${idx++}`;
			ctx.fileToNodeIdsToLabels.set(path, id);
		}

		ctx.lines.push("mindmap");

		const rootId = "root";
		if (rootLabel === null)
			ctx.lines.push(`  ${rootId}`);
		else
			ctx.lines.push(`  ${rootId}["${rootLabel}"]`);

		const groups = this.data.groupedData;
		const hasGroupingConfigured = this.config.get("groupBy") != null
			|| groups.length > 1
			|| groups.some((group) => group.hasKey());
		if (hasGroupingConfigured) {
			const groupedPaths = new Set(groups.flatMap((group) => group.entries.map((entry) => entry.file.path)));
			for (const [groupIndex, group] of groups.entries()) {
				if (group.entries.length === 0)
					continue;

				const groupLabel = (group.hasKey() ? group.key?.toString().trim() : "") || `No value (${groupIndex + 1})`;
				const safeLabel = groupLabel.replaceAll("&", "#38;").replaceAll('"', "#quot;").replaceAll("\n", " ").replaceAll("\r", " ");
				ctx.lines.push(`${indent(2)}g${groupIndex}["${safeLabel}"]`);
				for (const entry of group.entries)
					this.renderNode(entry.file.path, 3, ctx, groupedPaths);
			}
		} else {
			for (const rootPath of roots)
				this.renderNode(rootPath, 2, ctx);
		}

		return ctx.lines.join("\n");
	}

	private renderNode(
		path: string,
		level: number,
		ctx: MindmapRenderContext,
		groupedPaths?: Set<string>,
	): void {
		if (ctx.visited.has(path))
			return;
		ctx.visited.add(path);

		const file = ctx.filesByPath.get(path);
		if (!file)
			return;

		const nodeId = ctx.fileToNodeIdsToLabels.get(path)!;
		const label = this.getLabelWithProperties(file, ctx.showPropertyNames, "\n", ":", true);

		ctx.lines.push(`${indent(level)}${nodeId}["${label}"]`);
		ctx.lines.push(`${indent(level + 1)}:::bases-mermaid-note-${nodeId}`);

		const children = ctx.pathToOutgoingLinks.get(path);
		if (!children)
			return;

		for (const childPath of children) {
			if (!groupedPaths?.has(childPath))
				this.renderNode(childPath, level + 1, ctx, groupedPaths);
		}
	}

	private collectOutgoingLinks(
		baseFileByPath: Map<string, TFile>,
		ctx: MindmapRenderContext,
	): void {
		for (const path of ctx.filesByPath.keys())
			ctx.indegree.set(path, 0);

		for (const [path, file] of baseFileByPath.entries()) {
			const cache = this.app.metadataCache.getFileCache(file);
			const allLinks = [
				...getBodyLinksForSource(cache, ctx.linkSource),
				...getFrontmatterLinksForSource(cache, ctx.linkSource, ctx.linkPropertyName),
			];

			for (const link of allLinks) {
				const target = this.getLinkedFileIfVisible(
					link.link,
					file.path,
					baseFileByPath,
					ctx.showLinksToFilteredOutNotes,
				);
				if (!target)
					continue;
				if (target.path === path)
					continue;

				if (!ctx.filesByPath.has(target.path)) {
					ctx.filesByPath.set(target.path, target);
					ctx.indegree.set(target.path, 0);
				}

				let set = ctx.pathToOutgoingLinks.get(path);
				if (!set) {
					set = new Set<string>();
					ctx.pathToOutgoingLinks.set(path, set);
				}
				if (!set.has(target.path)) {
					set.add(target.path);
					ctx.indegree.set(
						target.path,
						(ctx.indegree.get(target.path) ?? 0) + 1,
					);
				}
			}
		}
	}
}
