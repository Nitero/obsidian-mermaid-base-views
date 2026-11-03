import {MermaidBasesView} from "../../core/mermaid-bases-view";
import {type MermaidViewRegistrationData} from "../../core/mermaid-view-registration-data";
import MermaidBaseViews from "../../main";
import {InferredPropertyType} from "../../view-options/inferred-property-type";
import {COMMON_VIEW_OPTIONS, NOTE_LABEL_OPTIONS} from "../../view-options/common-options";
import {MERMAID_CONFIG_EXAMPLES} from "../../view-options/mermaid-config-examples";
import {buildTimelineCode, collectTimelineSections, type TimeGranularity, type TimelineSection} from "./timeline-builder";

const TIME_GRANULARITY_OPTIONS = {
	year: "Year",
	month: "Month",
	day: "Day",
	hour: "Hour",
	minute: "Minute",
	second: "Second",
} satisfies Record<TimeGranularity, string>;

export class TimelineView extends MermaidBasesView {
	readonly type = TimelineView.RegistrationData.id;
	readonly registrationData = TimelineView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-timeline",
		name: "Timeline",
		icon: "custom-timeline",//timeline//chart-no-axes-gantt
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.title.displayName,
				key: COMMON_VIEW_OPTIONS.title.key,
				default: COMMON_VIEW_OPTIONS.title.default,
			},
			{
				type: "property",
				displayName: "Date / Time property",
				key: "timeProperty",
				placeholder: "e.g. created or modified",
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Date),
			},
			{
				type: "dropdown",
				displayName: "Cutoff",
				key: "cutoff",
				default: "day",
				options: TIME_GRANULARITY_OPTIONS,
			},
			...NOTE_LABEL_OPTIONS,
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.timeline.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const timePropertyId = this.config.getAsPropertyId("timeProperty");
		const showPropertyNames = this.getBooleanConfig(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		if (!timePropertyId) {
			this.containerEl.createDiv({text: "Configure a time property in the view settings."});
			return;
		}
		const title = this.getOptionalTitle();
		const granularity = this.getDropdownConfig("cutoff", TIME_GRANULARITY_OPTIONS);
		const sections = collectTimelineSections(
			this.data.groupedData, timePropertyId, granularity, this.hasGrouping(),
			(file) => this.getLabelWithProperties(file, showPropertyNames, "<br>", "ː", true),
		);
		if (sections.length === 0) {
			this.containerEl.createDiv({text: "No valid time values found for the selected property."});
			return;
		}
		const code = buildTimelineCode(title, sections);
		const target = await this.renderMermaid(code, this.plugin.settings.timelineMermaidConfig);
		if (target?.parentElement !== this.containerEl)
			return;
		this.hookUpEventLinks(sections);
	}

	private hookUpEventLinks(sections: TimelineSection[]): void {
		const paths = sections.flatMap((section) =>
			section.periods.flatMap((period) => period.events.map((event) => event.path)));
		this.markOrderedNoteLinks(".pele-period .pele-event", paths);
	}

}
