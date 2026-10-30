import {type BasesPropertyId} from "obsidian";
import {MermaidBasesView} from "../core/mermaid-bases-view";
import {MERMAID_CONFIG_EXAMPLES} from "../core/mermaid-config-examples";
import {MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {COMMON_VIEW_OPTIONS, NOTE_LABEL_OPTIONS} from "../core/constants";
import MermaidBaseViews from "../main";
import {InferredPropertyType} from "../propertyTypes/inferred-property-type";
import {buildGanttCode, type GanttData, type GanttSection, hasGanttMarkerMedia, parseGanttBarColors} from "../utils/gantt";
import {GanttMarkerMedia} from "../utils/gantt-marker-media";
import {isMissingGanttValue, parseGanttDate, parseGanttDuration} from "../utils/gantt-values";
import {parseNoteIcon} from "../utils/note-media";

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
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				...COMMON_VIEW_OPTIONS.title,
			},
			{
				type: "property",
				displayName: "Start property",
				key: "startDateProperty",
				placeholder: "e.g. start, created, or a time like 09:30",
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Date, InferredPropertyType.String),
			},
			{
				type: "property",
				displayName: "End property (optional)",
				key: "endDateProperty",
				placeholder: "e.g. end or due; alternative to duration",
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Date, InferredPropertyType.String),
			},
			{
				type: "property",
				displayName: "Duration property (optional)",
				key: "durationProperty",
				placeholder: "e.g. duration (30m, 2h); alternative to end",
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.String),
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
						filter: plugin.propertyTypes.createFilter(InferredPropertyType.Date, InferredPropertyType.String),
					},
					{
						type: "property",
						displayName: "Bar color property (optional)",
						key: "barColorProperty",
						placeholder: "e.g. status (active, done, crit)",
						filter: plugin.propertyTypes.createFilter(InferredPropertyType.String, InferredPropertyType.List),
					},
					{
						type: "property",
						...COMMON_VIEW_OPTIONS.iconProperty,
						filter: plugin.propertyTypes.createFilter(InferredPropertyType.String, InferredPropertyType.List),
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
				axisFormat: this.getConfigValue<string>("axisFormat").trim(),
				tickInterval: this.getConfigValue<string>("tickInterval"),
				excludes: this.getConfigValue<string>("excludes"),
				showTodayMarker: this.getConfigValue<boolean>("showTodayMarker"),
				includeTodayInRange: this.getConfigValue<boolean>("includeTodayInRange"),
			},
		);
		const hasMarkerMedia = data.sections.some((section) => section.tasks.some(hasGanttMarkerMedia));
		if (hasMarkerMedia)
			this.markerMedia ??= new GanttMarkerMedia(this, this.app, this.containerEl,
				(node, path) => this.markNoteLink(node, path, []));
		this.markerMedia?.setData(data);
		await this.renderMermaid(code, this.plugin.settings.ganttMermaidConfig);
		this.markerMedia?.render();
		this.hookUpNoteLinks(data);
	}

	private generateData(
		startProperty: BasesPropertyId | null,
		endProperty: BasesPropertyId | null,
		verticalMarkerProperty: BasesPropertyId | null,
	): GanttData {
		const groups = this.data.groupedData;
		const hasGrouping = this.config.get("groupBy") != null
			|| groups.length > 1 || groups.some((group) => group.hasKey());
		const showPropertyNames = this.getConfigValue<boolean>(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		const barColorProperty = this.config.getAsPropertyId("barColorProperty");
		const iconProperty = this.config.getAsPropertyId(COMMON_VIEW_OPTIONS.iconProperty.key);
		const durationProperty = this.config.getAsPropertyId("durationProperty");
		const textDateFormat = this.getConfigValue<string>("textDateFormat").trim();
		const referenceDate = new Date();
		const data: GanttData = {sections: [], markers: []};
		let taskIndex = 0;
		for (const group of groups) {
			const section: GanttSection = {
				label: hasGrouping ? (group.hasKey() ? group.key?.toString().trim() : "") || "No value" : null,
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
					data.markers.push({id: `vert${data.markers.length}`, label, path: entry.file.path, date: verticalMarkerDate});
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
