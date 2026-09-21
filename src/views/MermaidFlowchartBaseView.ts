import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesEntryGroup, TFile} from "obsidian";
import MermaidBaseViews from "../main";
import {frontmatterLinkKeyToProperty} from "../core/frontmatterLinks";
import {
	COMMON_OPTION_GROUPS,
	COMMON_VIEW_OPTIONS,
	LINK_OPTIONS,
	NODE_LABEL_CONTENT_VALUES,
	SELECTED_PROPERTIES_LABEL
} from "../core/constants";
import {
	getBodyLinksForSource,
	getFrontmatterLinksForSource,
	getPropertyNameFromId,
	shouldHidePropertyLinkOptions
} from "../core/utils";
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
	[NODE_LABEL_CONTENT_VALUES.namedLinks]: "Note Names (Clickable Links)",
	[NODE_LABEL_CONTENT_VALUES.properties]: SELECTED_PROPERTIES_LABEL,
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
				displayName: COMMON_VIEW_OPTIONS.title.displayName,
				key: COMMON_VIEW_OPTIONS.title.key,
				default: COMMON_VIEW_OPTIONS.title.default,
			},
			{
				type: "dropdown",
				displayName: "Direction",
				key: "direction",
				default: "TB",
				options: FLOWCHART_DIRECTION_OPTIONS,
			},
			{
				displayName: COMMON_OPTION_GROUPS.labels,
				type: "group",
				items: [
					{
						type: "dropdown",
						displayName: COMMON_VIEW_OPTIONS.nodeLabelContent.displayName,
						key: COMMON_VIEW_OPTIONS.nodeLabelContent.key,
						default: NODE_LABEL_CONTENT_VALUES.namedLinks,
						options: NODE_LABEL_CONTENT_OPTIONS,
					},
					{
						type: "toggle",
						displayName: COMMON_VIEW_OPTIONS.showPropertyNames.displayName,
						key: COMMON_VIEW_OPTIONS.showPropertyNames.key,
						default: COMMON_VIEW_OPTIONS.showPropertyNames.default,
						shouldHide: shouldHideShowPropertyNames(NODE_LABEL_CONTENT_VALUES.namedLinks),
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
					{
						type: "toggle",
						displayName: "Show link property names",
						key: "showLinkPropertyNames",
						default: true,
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
		const title = this.getOptionalTitle();
		const direction = this.getConfigValue<string>("direction");
		const nodeLabelContent = this.getConfigValue<string>(COMMON_VIEW_OPTIONS.nodeLabelContent.key);
		const showPropertyNames = this.getConfigValue<boolean>(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		const linkSource = this.getConfigValue<string>(LINK_OPTIONS.source.key);
		const showLinksToFilteredOutNotes = this.getConfigValue<boolean>(LINK_OPTIONS.showFilteredOutNotes.key);
		const linkPropertyId = this.config.getAsPropertyId(LINK_OPTIONS.property.key);
		const filesByPath = this.collectBaseFilesByPath();
		const linkPropertyName = getPropertyNameFromId(linkPropertyId);
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
		if (ctx.nodeLabelContent === NODE_LABEL_CONTENT_VALUES.namedLinks)
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
		const fmLinks = getFrontmatterLinksForSource(fileCache, ctx.linkSource, ctx.linkPropertyName);
		for (const fm of fmLinks) {
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
		title: string | null,
		ctx: FlowchartRenderContext,
		hasGroupingConfigured: boolean,
	): string {
		const lines: string[] = [];

		lines.push(`flowchart ${direction}`);
		if (title !== null)
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

		if (ctx.nodeLabelContent === NODE_LABEL_CONTENT_VALUES.namedLinks) {
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
