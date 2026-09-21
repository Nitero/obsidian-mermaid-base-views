import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {TFile} from "obsidian";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {
	getBodyLinksForSource,
	getFrontmatterLinksForSource,
	getPropertyNameFromId,
	indent,
	shouldHidePropertyLinkOptions
} from "../core/utils";
import MermaidBaseViews from "../main";
import {
	COMMON_OPTION_GROUPS,
	COMMON_VIEW_OPTIONS,
	LINK_OPTIONS,
	NODE_LABEL_CONTENT_VALUES,
	SELECTED_PROPERTIES_LABEL
} from "../core/constants";
import {shouldHideShowPropertyNames} from "../core/viewOptionVisibility";

interface MindmapRenderContext {
	visited: Set<string>;
	filesByPath: Map<string, TFile>;
	fileToNodeIdsToLabels: Map<string, string>;
	pathToOutgoingLinks: Map<string, Set<string>>;
	indegree: Map<string, number>;
	nodeLabelContent: string;
	showPropertyNames: boolean;
	lines: string[];
	linkSource: string;
	showLinksToFilteredOutNotes: boolean;
	linkPropertyName: string | null;
}

const NODE_LABEL_CONTENT_OPTIONS: Record<string, string> = {
	[NODE_LABEL_CONTENT_VALUES.namedLinks]: "Note Names",
	[NODE_LABEL_CONTENT_VALUES.properties]: SELECTED_PROPERTIES_LABEL,
};

export class MermaidMindmapBaseView extends MermaidBaseViewBase {
	readonly type = MermaidMindmapBaseView.RegistrationData.id;
	readonly registrationData = MermaidMindmapBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-mindmap",
		name: "Mindmap",
		icon: "brain",
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: "Central node label",
				key: "rootLabel",
				default: "Mindmap",
			},
			{
				displayName: COMMON_OPTION_GROUPS.labels,
				type: "group",
				items: [
					{
						type: "dropdown",
						displayName: COMMON_VIEW_OPTIONS.nodeLabelContent.displayName,
						key: COMMON_VIEW_OPTIONS.nodeLabelContent.key,
						default: NODE_LABEL_CONTENT_VALUES.properties,
						options: NODE_LABEL_CONTENT_OPTIONS,
					},
					{
						type: "toggle",
						displayName: COMMON_VIEW_OPTIONS.showPropertyNames.displayName,
						key: COMMON_VIEW_OPTIONS.showPropertyNames.key,
						default: COMMON_VIEW_OPTIONS.showPropertyNames.default,
						shouldHide: shouldHideShowPropertyNames(NODE_LABEL_CONTENT_VALUES.properties),
					},
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
				placeholder: COMMON_VIEW_OPTIONS.mermaidConfigOverride.placeholder,
			},
		],
	};

	protected async render(): Promise<void> {
		const rootLabel = this.getConfigValue<string>("rootLabel");
		const nodeLabelContent = this.getConfigValue<string>(COMMON_VIEW_OPTIONS.nodeLabelContent.key);
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
			nodeLabelContent,
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

		if (ctx.filesByPath.size > this.plugin.settings.mindmapResultLimit) {
			this.containerEl.createDiv({text: `Exceeded result limit (${this.plugin.settings.mindmapResultLimit}). This can be increased in the settings, but may impact performance.`});
			return;
		}

		const mermaidCode = this.buildMermaidCode(rootLabel, ctx);
		await this.renderMermaid(mermaidCode, this.plugin.settings.mindmapMermaidConfig);
	}

	private buildMermaidCode(
		rootLabel: string,
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
		ctx.lines.push(`  ${rootId}["${rootLabel}"]`);

		for (const rootPath of roots)
			this.renderNode(rootPath, 2, ctx);

		return ctx.lines.join("\n");
	}
	private renderNode(
		path: string,
		level: number,
		ctx: MindmapRenderContext,
	): void {
		if (ctx.visited.has(path))
			return;
		ctx.visited.add(path);

		const file = ctx.filesByPath.get(path);
		if (!file)
			return;

		const nodeId = ctx.fileToNodeIdsToLabels.get(path)!;
		const label = ctx.nodeLabelContent === NODE_LABEL_CONTENT_VALUES.namedLinks
			? file.basename
			: this.getLabelWithProperties(file, ctx.showPropertyNames, "\n", ":");

		ctx.lines.push(`${indent(level)}${nodeId}["${label}"]`);

		const children = ctx.pathToOutgoingLinks.get(path);
		if (!children)
			return;

		for (const childPath of children)
			this.renderNode(childPath, level + 1, ctx);
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
