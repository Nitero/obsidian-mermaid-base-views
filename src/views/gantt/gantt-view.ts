import {type BasesPropertyId} from "obsidian";
import {MermaidBasesView} from "../../core/mermaid-bases-view";
import {MERMAID_CONFIG_EXAMPLES} from "../../view-options/mermaid-config-examples";
import {MermaidViewRegistrationData} from "../../core/mermaid-view-registration-data";
import {COMMON_VIEW_OPTIONS, NOTE_LABEL_OPTIONS} from "../../view-options/common-options";
import {createPropertyTypeFilter} from "../../view-options/property-filters";
import {
	buildGanttCode,
	type GanttData,
	type GanttSection,
	hasGanttMarkerMedia,
	parseGanttBarColors
} from "./gantt-builder";
import {GanttMarkerMedia} from "./gantt-marker-media";
import {isMissingGanttValue, parseGanttDate, parseGanttDuration} from "./gantt-values";
import {parseNoteIcon} from "../../media/note-media";
import {getGroupLabel} from "../../links/group-label";

const TICK_INTERVAL_OPTIONS: Record<string, string> = {
	auto: "Automatic",
	"1minute": "Every minute",
	"1hour": "Hourly",
	"1day": "Daily",
	"1week": "Weekly",
	"1month": "Monthly",
	"3month": "Quarterly",
	"12month": "Yearly",
};

export class GanttView extends MermaidBasesView {
	readonly type = GanttView.RegistrationData.id;
	readonly registrationData = GanttView.RegistrationData;
	private markerMedia?: GanttMarkerMedia;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-gantt",
		name: "Gantt",
		icon: "square-chart-gantt",
		getOptions: () => [
			{
				type: "text",
				...COMMON_VIEW_OPTIONS.title,
			},
			{
				type: "property",
				displayName: "Start property",
				key: "startDateProperty",
				placeholder: "e.g. start, created, or a time like 09:30",
				filter: createPropertyTypeFilter("date", "string"),
			},
			{
				type: "property",
				displayName: "End property (optional)",
				key: "endDateProperty",
				placeholder: "e.g. end or due; alternative to duration",
				filter: createPropertyTypeFilter("date", "string"),
			},
			{
				type: "property",
				displayName: "Duration property (optional)",
				key: "durationProperty",
				placeholder: "e.g. duration (30m, 2h); alternative to end",
				filter: createPropertyTypeFilter("string"),
			},
			{
				type: "group",
				displayName: "Formatting",
				items: [
					{
						type: "property",
						displayName: "Vertical marker property (optional)",
						key: "vertDateProperty",
						placeholder: "e.g. deadline",
						filter: createPropertyTypeFilter("date", "string"),
					},
					{
						type: "property",
						displayName: "Bar color property (optional)",
						key: "barColorProperty",
						placeholder: "e.g. status (active, done, crit)",
						filter: createPropertyTypeFilter("string", "list"),
					},
					{
						type: "property",
						...COMMON_VIEW_OPTIONS.iconProperty,
						filter: createPropertyTypeFilter("string", "list"),
					},
					{
						type: "text",
						displayName: "Input date text property format (optional)",
						key: "textDateFormat",
						default: "",
						placeholder: "Automatic (ISO or HH:mm); e.g. DD/MM/YYYY",
					},
					{
						type: "text",
						displayName: "Axis label format (optional)",
						key: "axisFormat",
						default: "",
						placeholder: "%Y-%m-%d (default); e.g. %d %b or %H:%M",
					},
					{
						type: "dropdown",
						displayName: "Axis tick interval",
						key: "tickInterval",
						default: "auto",
						options: TICK_INTERVAL_OPTIONS,
					},
					{
						type: "text",
						displayName: "Excludes (days, optional)",
						key: "excludes",
						default: "",
						placeholder: "e.g. weekends, sunday, 2026-12-25",
					},
				],
			},
			{
				type: "group",
				displayName: "Today marker",
				items: [
					{
						type: "toggle",
						displayName: "Show today marker",
						key: "showTodayMarker",
						default: true,
					},
					{
						type: "toggle",
						displayName: "Expand range to include today",
						key: "includeTodayInRange",
						default: false,
					},
				],
			},
			...NOTE_LABEL_OPTIONS,
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.gantt.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const startProperty = this.config.getAsPropertyId("startDateProperty");
		const verticalMarkerProperty = this.config.getAsPropertyId("vertDateProperty");
		if (!startProperty && !verticalMarkerProperty) {
			this.containerEl.createDiv({text: "Configure a start or vertical marker property in the view settings."});
			return;
		}

		const data = this.generateData(startProperty, this.config.getAsPropertyId("endDateProperty"), verticalMarkerProperty);
		if (data.sections.length === 0 && data.markers.length === 0) {
			this.containerEl.createDiv({text: "No valid intervals or vertical markers found."});
			return;
		}

		const code = buildGanttCode(
			this.getOptionalTitle(),
			data,
			{
				axisFormat: this.getStringConfig("axisFormat").trim(),
				tickInterval: this.getDropdownConfig("tickInterval", TICK_INTERVAL_OPTIONS),
				excludes: this.getStringConfig("excludes"),
				showTodayMarker: this.getBooleanConfig("showTodayMarker"),
				includeTodayInRange: this.getBooleanConfig("includeTodayInRange"),
			},
		);
		const hasMarkerMedia = data.sections.some((section) => section.tasks.some(hasGanttMarkerMedia));
		if (hasMarkerMedia)
			this.markerMedia ??= new GanttMarkerMedia(this, this.app, this.containerEl,
				(node, path) => this.markNoteLink(node, path, null));
		this.markerMedia?.setData(data);
		const target = await this.renderMermaid(code, this.plugin.settings.ganttMermaidConfig);
		if (target?.parentElement !== this.containerEl)
			return;
		this.markerMedia?.render();
		this.hookUpNoteLinks(data);
		if (this.hasGrouping())
			this.markOrderedGroupNoteLinks(".pele-section-label", data.sections.map((section) => section.group));
	}

	private generateData(
		startProperty: BasesPropertyId | null,
		endProperty: BasesPropertyId | null,
		verticalMarkerProperty: BasesPropertyId | null,
	): GanttData {
		const groups = this.data.groupedData;
		const hasGrouping = this.hasGrouping();
		const showPropertyNames = this.getBooleanConfig(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		const barColorProperty = this.config.getAsPropertyId("barColorProperty");
		const iconProperty = this.config.getAsPropertyId(COMMON_VIEW_OPTIONS.iconProperty.key);
		const durationProperty = this.config.getAsPropertyId("durationProperty");
		const textDateFormat = this.getStringConfig("textDateFormat").trim();
		const referenceDate = new Date();
		const data: GanttData = {sections: [], markers: []};
		let taskIndex = 0;
		for (const group of groups) {
			const section: GanttSection = {
				label: hasGrouping ? getGroupLabel(group) : null,
				group,
				tasks: [],
			};
			for (const entry of group.entries) {
				const start = startProperty ? parseGanttDate(entry.getValue(startProperty), referenceDate, textDateFormat) : null;
				const verticalMarkerDate = verticalMarkerProperty
					? parseGanttDate(entry.getValue(verticalMarkerProperty), referenceDate, textDateFormat) : null;
				if (!start && !verticalMarkerDate)
					continue;
				const label = this.getLabelWithProperties(entry.file, showPropertyNames, "<br>", "ː", true);
				if (verticalMarkerDate)
					data.markers.push({
						id: `vert${data.markers.length}`,
						label,
						path: entry.file.path,
						date: verticalMarkerDate
					});
				if (!start)
					continue;
				const endValue = endProperty ? entry.getValue(endProperty) : null;
				const hasEnd = !isMissingGanttValue(endValue);
				const end = hasEnd ? parseGanttDate(endValue, start, textDateFormat) : null;
				if (hasEnd && (!end || end.getTime() < start.getTime()))
					continue;
				const durationValue = !hasEnd && durationProperty ? entry.getValue(durationProperty) : null;
				const hasDuration = !isMissingGanttValue(durationValue);
				const duration = hasDuration ? parseGanttDuration(durationValue) : null;
				if (hasDuration && duration === null)
					continue;
				const icon = parseNoteIcon(iconProperty ? entry.getValue(iconProperty) : null);
				section.tasks.push({
					id: `task${taskIndex++}`,
					label,
					path: entry.file.path,
					start,
					end,
					duration,
					colors: parseGanttBarColors(barColorProperty ? entry.getValue(barColorProperty) : null),
					icon: icon === "none" ? null : icon,
				});
			}
			if (section.tasks.length > 0)
				data.sections.push(section);
		}
		return data;
	}

	private hookUpNoteLinks(data: GanttData): void {
		const items = [...data.sections.flatMap((section) => section.tasks), ...data.markers];
		const paths = new Map(items.map((item) => [item.id, item.path]));
		this.containerEl.querySelectorAll(".pele-task[data-id], .pele-vert-label[data-id]").forEach((node) => {
			const path = paths.get(node.getAttribute("data-id") ?? "");
			if (path !== undefined)
				this.markNoteLink(node, path);
		});
	}
}
