import {MermaidBasesView} from "../core/mermaid-bases-view";
import {escapeMermaidQuotedLabel} from "../core/mermaid-text";
import {parseFiniteNumber} from "../core/numeric-values";
import {MERMAID_CONFIG_EXAMPLES} from "../view-options/mermaid-config-examples";
import {MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {parsePropertyId} from "obsidian";
import MermaidBaseViews from "../main";
import {InferredPropertyType} from "../view-options/inferred-property-type";
import {COMMON_VIEW_OPTIONS, FILE_SIZE_PLACEHOLDER, NUMBER_RANGE_PLACEHOLDER} from "../view-options/common-options";

const CHART_TYPE_OPTIONS = {bar: "bar", line: "line", "bar-and-line": "both"};

export class XYChartView extends MermaidBasesView {
	readonly type = XYChartView.RegistrationData.id;
	readonly registrationData = XYChartView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-xy-chart",
		name: "XY Chart",
		icon: "line-chart",
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.title.displayName,
				key: COMMON_VIEW_OPTIONS.title.key,
				default: COMMON_VIEW_OPTIONS.title.default,
			},
			{
				type: "property",
				displayName: "Y-axis property",
				key: "yValueProperty",
				placeholder: FILE_SIZE_PLACEHOLDER,
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Number),
			},
			{
				type: "text",
				displayName: "Y-axis label",
				key: "yAxisLabel",
				default: "",
			},
			{
				type: "text",
				displayName: "Y-minimum (optional)",
				key: "yMin",
				placeholder: NUMBER_RANGE_PLACEHOLDER,
			},
			{
				type: "text",
				displayName: "Y-maximum (optional)",
				key: "yMax",
				placeholder: NUMBER_RANGE_PLACEHOLDER,
			},
			{
				type: "dropdown",
				displayName: "Chart type",
				key: "chartType",
				default: "bar",
				options: CHART_TYPE_OPTIONS,
			},
			{
				type: "toggle",
				displayName: COMMON_VIEW_OPTIONS.showPropertyNames.displayName,
				key: COMMON_VIEW_OPTIONS.showPropertyNames.key,
				default: COMMON_VIEW_OPTIONS.showPropertyNames.default,
			},
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.xyChart.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const yValuePropertyId = this.config.getAsPropertyId("yValueProperty");

		const showPropertyNames = this.getBooleanConfig(COMMON_VIEW_OPTIONS.showPropertyNames.key);

		if (!yValuePropertyId) {
			this.containerEl.createDiv({text: "Configure a numeric Y-axis value property in the view settings."});
			return;
		}

		const title = this.getOptionalTitle();
		const yAxisLabel = this.getStringConfig("yAxisLabel", parsePropertyId(yValuePropertyId).name);
		const chartType = this.getDropdownConfig("chartType", CHART_TYPE_OPTIONS);

		const xLabels: string[] = [];
		const yValues: number[] = [];
		const paths: string[] = [];

		let minValue = Number.POSITIVE_INFINITY;
		let maxValue = Number.NEGATIVE_INFINITY;

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {

				const label = this.getLabelWithProperties(entry.file, showPropertyNames, ", ", "ː", true);

				const number = parseFiniteNumber(entry.getValue(yValuePropertyId));
				if (number === null)
					continue;

				xLabels.push(label);
				yValues.push(number);
				paths.push(entry.file.path);

				if (number < minValue)
					minValue = number;
				if (number > maxValue)
					maxValue = number;
			}
		}

		if (yValues.length === 0) {
			this.containerEl.createDiv({text: "No numeric data found for the selected Y-axis property."});
			return;
		}

		const yMin = this.getNumberConfig("yMin") ?? minValue;
		const yMax = this.getNumberConfig("yMax") ?? maxValue;

		const xAxis = `[${xLabels.map((label) => `"${escapeMermaidQuotedLabel(label)}"`).join(", ")}]`;
		const valuesArray = `[${yValues.join(", ")}]`;

		const lines: string[] = [];

		lines.push("xychart-beta");
		if (title !== null)
			lines.push(`    title ${title}`);
		lines.push(`    x-axis ${xAxis}`);
		lines.push(`    y-axis "${escapeMermaidQuotedLabel(yAxisLabel)}" ${yMin} --> ${yMax}`);

		if (chartType === "line") {
			lines.push(`    line ${valuesArray}`);
		} else if (chartType === "bar-and-line") {
			lines.push(`    bar ${valuesArray}`);
			lines.push(`    line ${valuesArray}`);
		} else {
			lines.push(`    bar ${valuesArray}`);
		}

		const mermaidCode = lines.join("\n");

		const target = await this.renderMermaid(mermaidCode, this.plugin.settings.XYChartMermaidConfig);
		if (target?.parentElement !== this.containerEl)
			return;
		this.markOrderedNoteLinks(".pele-bars > rect", paths);
		this.markOrderedNoteLinks(".pele-line > circle", paths);
		this.markOrderedNoteLinks('.pele-axis-labels > text[text-anchor="middle"]', paths);
	}
}
