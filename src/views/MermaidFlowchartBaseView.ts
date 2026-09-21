import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesEntryGroup, parsePropertyId, TFile} from "obsidian";
import MermaidBaseViews from "../main";
import {frontmatterLinkKeyToProperty, frontmatterLinkMatchesProperty} from "../core/frontmatterLinks";
import {DEFAULT_LINK_SOURCE, EDGE_LINK_SOURCE_OPTIONS} from "../core/constants";
import {getBodyLinksForSource, getFrontmatterLinksForSource, shouldHidePropertyLinkOptions} from "../core/utils";
import {shouldHideShowPropertyNames} from "../core/viewOptionVisibility";

type Edge = {
	from: string;
	to: string;
	label?: string;
};

interface FlowchartRenderContext {
	fileToNodeId: Map<string, string>;
	nodeIdToLabel: Map<string, string>;
	groupIndexToNodeIds: Map<number, Set<string>>;
	groupedNodeIds: Set<string>;
	notePropDisplayByKey: Map<string, string>;
	edges: Map<string, Edge>;
	nodeLabelContent: string;
	showPropertyNames: boolean;
	linkSource: string;
	showLinksToFilteredOutNotes: boolean;
	filesByPath: Map<string, TFile>;
	linkPropertyName: string | null;
	showLinkPropertyNames: boolean;
}

const FLOWCHART_DIRECTION_OPTIONS: Record<string, string> = {
	"TB": "Top to bottom",
	"BT": "Bottom to top",
	"LR": "Left to right",
	"RL": "Right to left",
};

const NODE_LABEL_CONTENT_OPTIONS: Record<string, string> = {
	"named-links": "Note Names (Clickable Links)",
	"properties": "Selected Properties",
};

export class MermaidFlowchartBaseView extends MermaidBaseViewBase {
	readonly type = MermaidFlowchartBaseView.RegistrationData.id;
	readonly registrationData = MermaidFlowchartBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-flowchart",
		name: "Flowchart",
		icon: "git-fork",//waypoints//workflow//share-2
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: "Title",
				key: "title",
				default: "Title",
			},
			{
				type: "dropdown",
				displayName: "Direction",
				key: "direction",
				default: "TB",
				options: FLOWCHART_DIRECTION_OPTIONS,
			},
			{
				displayName: "Labels",
				type: "group",
				items: [
					{
						type: "dropdown",
						displayName: "Node Label Content",
						key: "nodeLabelContent",
						default: "named-links",
						options: NODE_LABEL_CONTENT_OPTIONS,
					},
					{
						type: "toggle",
						displayName: "Show property names",
						key: "showPropertyNames",
						default: true,
						shouldHide: shouldHideShowPropertyNames("named-links"),
					},
				],
			},
			{
				displayName: "Links",
				type: "group",
				items: [
					{
						type: "dropdown",
						displayName: "Link Source",
						key: "linkSource",
						default: DEFAULT_LINK_SOURCE,
						options: EDGE_LINK_SOURCE_OPTIONS,
					},
					{
						type: "toggle",
						displayName: "Show links to filtered-out notes",
						key: "showLinksToFilteredOutNotes",
						default: false,
					},
					{
						type: "property",
						displayName: "Link property (optional)",
						key: "linkProperty",
						placeholder: "e.g. parent_note",
						filter: plugin.propertyTypes.createSourceFilter("note"),
						shouldHide: shouldHidePropertyLinkOptions(DEFAULT_LINK_SOURCE),
					},
					{
						type: "toggle",
						displayName: "Show link property names",
						key: "showLinkPropertyNames",
						default: true,
						shouldHide: shouldHidePropertyLinkOptions(DEFAULT_LINK_SOURCE),
					},
				],
			},
			{
				type: "text",
				displayName: "Mermaid Config Override Directive (optional)",
				key: "mermaidConfigOverrideDirective",
				placeholder: `%%{init: { "look": "handDrawn", "theme": "neutral" }}%%`,
			},
		],
	};

	protected async render(): Promise<void> {
		const title = this.getConfigValue<string>("title");
		const direction = this.getConfigValue<string>("direction");
		const nodeLabelContent = this.getConfigValue<string>("nodeLabelContent");
		const showPropertyNames = this.getConfigValue<boolean>("showPropertyNames");
		const linkSource = this.getConfigValue<string>("linkSource");
		const showLinksToFilteredOutNotes = this.getConfigValue<boolean>("showLinksToFilteredOutNotes");
		const linkPropertyId = this.config.getAsPropertyId("linkProperty");
		const filesByPath = this.collectBaseFilesByPath();
		const linkPropertyName = linkPropertyId ? parsePropertyId(linkPropertyId).name : null;
		const showLinkPropertyNames = this.getConfigValue<boolean>("showLinkPropertyNames");

		const ctx: FlowchartRenderContext = {
			fileToNodeId: new Map<string, string>(),
			nodeIdToLabel: new Map<string, string>(),
			groupIndexToNodeIds: new Map<number, Set<string>>(),
			groupedNodeIds: new Set<string>(),
			notePropDisplayByKey: new Map<string, string>(),
			edges: new Map<string, Edge>(),
			nodeLabelContent,
			showPropertyNames,
			linkSource,
			showLinksToFilteredOutNotes,
			filesByPath: filesByPath,
			linkPropertyName,
			showLinkPropertyNames,
		};

		this.collectNodesAndEdges(ctx);

		if (ctx.fileToNodeId.size === 0) {
			this.containerEl.createDiv({text: "No notes found for this base to build a flowchart from."});
			return;
		}

		if (ctx.fileToNodeId.size > this.plugin.settings.flowchartResultLimit) {
			this.containerEl.createDiv({text: `Exceeded result limit (${this.plugin.settings.flowchartResultLimit}). This can be increased in the settings, but may impact performance.`});
			return;
		}

		const hasGroupingConfigured = this.data.groupedData.length !== 1;
		const mermaidCode = this.buildMermaidCode(direction, title, ctx, hasGroupingConfigured);

		await this.renderMermaid(mermaidCode, this.plugin.settings.flowchartMermaidConfig);
	}

	private collectNodesAndEdges(
		ctx: FlowchartRenderContext,
	): void {
		for (let groupIndex = 0; groupIndex < this.data.groupedData.length; groupIndex++) {
			const group = this.data.groupedData[groupIndex];

			let nodeSet = ctx.groupIndexToNodeIds.get(groupIndex);
			if (!nodeSet) {
				nodeSet = new Set<string>();
				ctx.groupIndexToNodeIds.set(groupIndex, nodeSet);
			}

			if(!group)
				continue;

			for (const entry of group.entries) {
				if (!entry.file)
					continue;

				const srcId = this.ensureNode(entry.file, ctx);
				if (!srcId)
					return;

				nodeSet.add(srcId);
				ctx.groupedNodeIds.add(srcId);

				this.collectOutgoingEdgesFromLinks(entry.file, srcId, ctx);
				this.collectEdgesFromFrontmatterLinks(entry.file, srcId, ctx);
			}
		}
	}

	private ensureNode(file: TFile, ctx: FlowchartRenderContext): string {
		let id = ctx.fileToNodeId.get(file.path);
		if (id)
			return id;

		id = `n${ctx.fileToNodeId.size}`;
		ctx.fileToNodeId.set(file.path, id);

		let label: string;
		if (ctx.nodeLabelContent === "named-links")
			label = file.basename;
		else
			label = this.getLabelWithProperties(file, ctx.showPropertyNames, "<br>", ":");

		ctx.nodeIdToLabel.set(id, label);
		return id;
	}

	private collectOutgoingEdgesFromLinks(
		file: TFile,
		srcId: string,
		ctx: FlowchartRenderContext,
	): void {
		const fileCache = this.app.metadataCache.getFileCache(file);
		const links = getBodyLinksForSource(fileCache, ctx.linkSource);
		for (const link of links) {
			const target = this.getLinkedFileIfVisible(
				link.link,
				file.path,
				ctx.filesByPath,
				ctx.showLinksToFilteredOutNotes,
			);
			if (!target)
				continue;

			const tgtId = this.ensureNode(target, ctx);
			if (!tgtId)
				return;

			this.addEdge({from: srcId, to: tgtId}, ctx);
		}
	}

	private collectEdgesFromFrontmatterLinks(
		file: TFile,
		srcId: string,
		ctx: FlowchartRenderContext,
	): void {
		const fileCache = this.app.metadataCache.getFileCache(file);
		const fmLinks = getFrontmatterLinksForSource(fileCache, ctx.linkSource);
		for (const fm of fmLinks) {
			if (!frontmatterLinkMatchesProperty(fm.key, ctx.linkPropertyName))
				continue;

			const target = this.getLinkedFileIfVisible(
				fm.link,
				file.path,
				ctx.filesByPath,
				ctx.showLinksToFilteredOutNotes,
			);
			if (!target)
				continue;

			const tgtId = this.ensureNode(target, ctx);
			if (!tgtId)
				return;

			const frontmatterKey = frontmatterLinkKeyToProperty(fm.key);
			const label = ctx.showLinkPropertyNames
				? (ctx.notePropDisplayByKey.get(frontmatterKey) ?? frontmatterKey)
				: undefined;

			this.addEdge({from: srcId, to: tgtId, label}, ctx);
		}
	}

	private addEdge(edge: Edge, ctx: FlowchartRenderContext): void {
		const key = `${edge.from}||${edge.label ?? ""}||${edge.to}`;
		if (!ctx.edges.has(key))
			ctx.edges.set(key, edge);
	}

	private buildMermaidCode(
		direction: string,
		title: string,
		ctx: FlowchartRenderContext,
		hasGroupingConfigured: boolean,
	): string {
		const lines: string[] = [];

		lines.push(`flowchart ${direction}`);
		if (title?.length > 0)
			lines.push(`    %% ${title}`);

		if (hasGroupingConfigured) {
			for (let groupIndex = 0; groupIndex < this.data.groupedData.length; groupIndex++) {
				const group = this.data.groupedData[groupIndex];
				const nodeSet = ctx.groupIndexToNodeIds.get(groupIndex);
				if (!nodeSet || nodeSet.size === 0)
					continue;

				if(!group)
					continue;

				const groupLabel = this.getGroupLabel(group, groupIndex, hasGroupingConfigured);
				const groupId = `g${groupIndex}`;

				lines.push(`    subgraph ${groupId}["${groupLabel}"]`);

				for (const nodeId of nodeSet) {
					const label = ctx.nodeIdToLabel.get(nodeId) ?? nodeId;
					lines.push(`        ${nodeId}["${label}"]`);
				}

				lines.push("    end");
			}

			for (const [path, id] of ctx.fileToNodeId.entries()) {
				if (ctx.groupedNodeIds.has(id))
					continue;

				const label = ctx.nodeIdToLabel.get(id) ?? path;
				lines.push(`    ${id}["${label}"]`);
			}
		} else {
			for (const [path, id] of ctx.fileToNodeId.entries()) {
				const label = ctx.nodeIdToLabel.get(id) ?? path;
				lines.push(`    ${id}["${label}"]`);
			}
		}

		for (const edge of ctx.edges.values())
			lines.push(`    ${this.formatEdgeForMermaid(edge)}`);

		if (ctx.nodeLabelContent === "named-links") {
			const allIds = Array.from(ctx.fileToNodeId.values());
			if (allIds.length > 0)
				lines.push(`    class ${allIds.join(",")} internal-link;`);
		}

		return lines.join("\n");
	}

	private formatEdgeForMermaid(edge: Edge): string {
		if (edge.label && edge.label.trim().length > 0)
			return `${edge.from}-->|${edge.label}|${edge.to}`;
		return `${edge.from}-->${edge.to}`;
	}

	private getGroupLabel(group: BasesEntryGroup, index: number, hasGroupingConfigured: boolean): string {
		if (group.hasKey()) {
			const groupKey = group.key?.toString() ?? "";
			if (groupKey && groupKey.trim().length > 0)
				return groupKey;
		}
		return hasGroupingConfigured
			? `No value (${index + 1})`
			: `Group ${index + 1}`;
	}
}
