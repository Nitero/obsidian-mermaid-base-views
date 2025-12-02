import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesEntryGroup, TFile} from "obsidian";
import MermaidBaseViews from "../../main";

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
}

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
				options: {"TB": "Top to bottom", "BT": "Bottom to top", "LR": "Left to right", "RL": "Right to left"} as Record<string, string>,
			},
			{
				type: "dropdown",
				displayName: "Node Label Content",
				key: "nodeLabelContent",
				default: "named-links",
				options: {"named-links": "Note Names (Clickable Links)", "properties": "Selected Properties"} as Record<string, string>,
			},
			{
				type: "toggle",
				displayName: "Show property names",
				key: "showPropertyNames",
				default: true,
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
		const nodeLabelContent = (this.config.get("nodeLabelContent") as string) ?? "named-links";
		const showPropertyNames = this.getConfigValue<boolean>("showPropertyNames");

		const ctx: FlowchartRenderContext = {
			fileToNodeId: new Map<string, string>(),
			nodeIdToLabel: new Map<string, string>(),
			groupIndexToNodeIds: new Map<number, Set<string>>(),
			groupedNodeIds: new Set<string>(),
			notePropDisplayByKey: new Map<string, string>(),
			edges: new Map<string, Edge>(),
			nodeLabelContent,
			showPropertyNames,
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
		const links = fileCache?.links ?? [];
		for (const link of links) {
			const target = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path);
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
		const fmLinks = fileCache?.frontmatterLinks ?? [];
		for (const fm of fmLinks) {
			const target = this.app.metadataCache.getFirstLinkpathDest(fm.link, file.path);
			if (!target)
				continue;

			const tgtId = this.ensureNode(target, ctx);
			if (!tgtId)
				return;

			const frontmatterKey: string = fm.key;
			const label = ctx.notePropDisplayByKey.get(frontmatterKey) ?? frontmatterKey;

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
		try {
			if (typeof group.hasKey === "function" && group.hasKey()) {
				const keyValue = group.key;
				const string = keyValue?.toString?.() ?? "";
				if (string && string.trim().length > 0)
					return string;
			}
		} catch (e) {
		}
		return hasGroupingConfigured
			? `No value (${index + 1})`
			: `Group ${index + 1}`;
	}
}
