import {MermaidBasesView} from "../../core/mermaid-bases-view";
import {type MermaidViewRegistrationData} from "../../core/mermaid-view-registration-data";
import MermaidBaseViews from "../../main";
import {COMMON_OPTION_GROUPS, COMMON_VIEW_OPTIONS, NOTE_LABEL_OPTIONS} from "../../view-options/common-options";
import {MERMAID_CONFIG_EXAMPLES} from "../../view-options/mermaid-config-examples";
import {LINK_OPTIONS, shouldHidePropertyLinkOptions} from "../../view-options/link-options";
import {getPropertyNameFromId} from "../../links/note-links";
import {collectBaseFilesByPath, getLinkedFileIfVisible} from "../../links/linked-files";
import {collectFlowchartGraph} from "./flowchart-graph";
import {buildFlowchartCode} from "./flowchart-builder";

const FLOWCHART_DIRECTION_OPTIONS: Record<string, string> = {
	"TB": "Top to bottom",
	"BT": "Bottom to top",
	"LR": "Left to right",
	"RL": "Right to left",
};

export class FlowchartView extends MermaidBasesView {
	readonly type = FlowchartView.RegistrationData.id;
	readonly registrationData = FlowchartView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-flowchart",
		name: "Flowchart",
		icon: "network",//git-fork//waypoints//workflow//share-2
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
				placeholder: MERMAID_CONFIG_EXAMPLES.flowchart.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const title = this.getOptionalTitle();
		const direction = this.getDropdownConfig("direction", FLOWCHART_DIRECTION_OPTIONS);
		const showPropertyNames = this.getBooleanConfig(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		const linkSource = this.getDropdownConfig(LINK_OPTIONS.source.key, LINK_OPTIONS.source.options);
		const showLinksToFilteredOutNotes = this.getBooleanConfig(LINK_OPTIONS.showFilteredOutNotes.key);
		const filesByPath = collectBaseFilesByPath(this.data.groupedData);
		const graph = collectFlowchartGraph(this.data.groupedData, {
			getGroups: (files) => this.getGroupsWithFilteredNotes(files),
			linkSource,
			linkPropertyName: getPropertyNameFromId(this.config.getAsPropertyId(LINK_OPTIONS.property.key)),
			showLinkPropertyNames: this.getBooleanConfig("showLinkPropertyNames"),
			getFileCache: (file) => this.app.metadataCache.getFileCache(file),
			resolveLink: (linkpath, sourcePath) => getLinkedFileIfVisible(
				this.app.metadataCache, linkpath, sourcePath, filesByPath, showLinksToFilteredOutNotes,
			),
			getLabel: (file) => this.getLabelWithProperties(file, showPropertyNames, "<br>", ":", true),
		});
		if (graph.fileToNodeId.size === 0) {
			this.containerEl.createDiv({text: "No notes found for this base to build a flowchart from."});
			return;
		}
		const code = buildFlowchartCode(graph.groups, graph, direction, this.hasGrouping());
		const target = await this.renderMermaid(code, this.plugin.settings.flowchartMermaidConfig, graph.fileToNodeId, title);
		if (target?.parentElement !== this.containerEl || !this.hasGrouping())
			return;
		for (const [groupIndex, group] of graph.groups.entries()) {
			target.querySelectorAll(`.pele-cluster[data-id="g${groupIndex}"] > .pele-cluster-label, .pele-cluster-title[data-id="g${groupIndex}"]`).forEach((node) => {
				this.markGroupNoteLinks(node, group);
			});
		}
	}
}
