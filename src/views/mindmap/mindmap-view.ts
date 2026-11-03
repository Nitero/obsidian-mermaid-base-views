import {MermaidBasesView} from "../../core/mermaid-bases-view";
import {type MermaidViewRegistrationData} from "../../core/mermaid-view-registration-data";
import {createPropertySourceFilter} from "../../view-options/property-filters";
import {COMMON_OPTION_GROUPS, COMMON_VIEW_OPTIONS, NOTE_LABEL_OPTIONS} from "../../view-options/common-options";
import {MERMAID_CONFIG_EXAMPLES} from "../../view-options/mermaid-config-examples";
import {LINK_OPTIONS, shouldHidePropertyLinkOptions} from "../../view-options/link-options";
import {getPropertyNameFromId} from "../../links/note-links";
import {collectBaseFilesByPath, getLinkedFileIfVisible} from "../../links/linked-files";
import {buildMindmapCode} from "./mindmap-builder";

export class MindmapView extends MermaidBasesView {
	readonly type = MindmapView.RegistrationData.id;
	readonly registrationData = MindmapView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-mindmap",
		name: "Mindmap",
		icon: "custom-molecule",//brain
		getOptions: () => [
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
						filter: createPropertySourceFilter("note"),
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
		const showPropertyNames = this.getBooleanConfig(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		const linkSource = this.getDropdownConfig(LINK_OPTIONS.source.key, LINK_OPTIONS.source.options);
		const showLinksToFilteredOutNotes = this.getBooleanConfig(LINK_OPTIONS.showFilteredOutNotes.key);
		const filesByPath = collectBaseFilesByPath(this.data.groupedData);
		if (filesByPath.size === 0) {
			this.containerEl.createDiv({text: "No files found in this base."});
			return;
		}
		const {code, noteNodes, groups} = buildMindmapCode(this.data.groupedData, filesByPath, {
			getGroups: (files) => this.getGroupsWithFilteredNotes(files),
			rootLabel,
			hasGrouping: this.hasGrouping(),
			linkSource,
			linkPropertyName: getPropertyNameFromId(this.config.getAsPropertyId(LINK_OPTIONS.property.key)),
			getFileCache: (file) => this.app.metadataCache.getFileCache(file),
			resolveLink: (linkpath, sourcePath) => getLinkedFileIfVisible(
				this.app.metadataCache, linkpath, sourcePath, filesByPath, showLinksToFilteredOutNotes,
			),
			getLabel: (file) => this.getLabelWithProperties(file, showPropertyNames, "\n", ":", true),
		});
		const target = await this.renderMermaid(code, this.plugin.settings.mindmapMermaidConfig, noteNodes);
		if (target?.parentElement !== this.containerEl || !this.hasGrouping())
			return;
		for (const [groupIndex, group] of groups.entries()) {
			target.querySelectorAll(`.pele-node[data-id="g${groupIndex}"]`).forEach((node) => {
				this.markGroupNoteLinks(node, group);
			});
		}
	}
}
