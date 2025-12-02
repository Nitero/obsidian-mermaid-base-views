import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {parsePropertyId} from "obsidian";
import MermaidBaseViews from "../../main";
import {InferredPropertyType} from "../propertyTypes/InferredPropertyType";

export class MermaidXYChartBaseView extends MermaidBaseViewBase {
	readonly type = MermaidXYChartBaseView.RegistrationData.id;
	readonly registrationData = MermaidXYChartBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-xy-chart",
		name: "XY Chart",
		icon: "line-chart",
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: "Title",
				key: "title",
				default: "Title",
			},
			{
				type: "property",
				displayName: "Y-axis property",
				key: "yValueProperty",
				placeholder: "e.g. file size",
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
				placeholder: "number (defaults to automatic from data)",
			},
			{
				type: "text",
				displayName: "Y-maximum (optional)",
				key: "yMax",
				placeholder: "number (defaults to automatic from data)",
			},
			{
				type: "dropdown",
				displayName: "Chart type",
				key: "chartType",
				default: "bar",
				options: {"bar": "bar", "line": "line", "bar-and-line": "both"},
			},
			// {
			// 	type: "toggle",
			// 	displayName: "Show data labels",
			// 	key: "showDataLabel",
			// 	default: false,
			// },
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
		const yValuePropertyId = this.config.getAsPropertyId("yValueProperty");

		const showPropertyNames = this.getConfigValue<boolean>("showPropertyNames");

		if (!yValuePropertyId) {
			this.containerEl.createDiv({text: "Configure a numeric Y-axis value property in the view settings."});
			return;
		}

		const title = this.getConfigValue<string>("title");
		const yAxisLabel = this.getConfigValue<string>("yAxisLabel", parsePropertyId(yValuePropertyId).name);
		const chartType = this.getConfigValue<"bar" | "line" | "bar-and-line">("chartType");

		const xLabels: string[] = [];
		const yValues: number[] = [];

		let minValue = Number.POSITIVE_INFINITY;
		let maxValue = Number.NEGATIVE_INFINITY;

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {

				const label = this.getLabelWithProperties(entry.file, showPropertyNames, ", ", "ː");

				const yValue = entry.getValue(yValuePropertyId);
				if (yValue == null)
					continue;

				const number = Number(yValue.toString());
				if (!Number.isFinite(number))
					continue;

				xLabels.push(label);
				yValues.push(number);

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

		// Auto range if overrides not set
		let yMin = minValue;
		let yMax = maxValue;

		const yMinConfig = this.getConfigValue("yMin", "");
		if (yMinConfig) {
			const yMinConfigNumber = Number(yMinConfig);
			if (Number.isFinite(yMinConfigNumber))
				yMin = yMinConfigNumber;
		}
		const yMaxConfig = this.getConfigValue("yMax", "");
		if (yMaxConfig) {
			const yMaxConfigNumber = Number(yMaxConfig);
			if (Number.isFinite(yMaxConfigNumber))
				yMax = yMaxConfigNumber;
		}

		const xAxis = `[${xLabels.map((l) => `"${l}"`).join(", ")}]`;
		const valuesArray = `[${yValues.join(", ")}]`;

		const lines: string[] = [];
		lines.push("xychart-beta");
		if (title)
			lines.push(`    title "${title}"`);
		lines.push(`    x-axis ${xAxis}`);
		lines.push(`    y-axis "${yAxisLabel}" ${yMin} --> ${yMax}`);

		if (chartType === "line") {
			lines.push(`    line ${valuesArray}`);
		} else if (chartType === "bar-and-line") {
			lines.push(`    bar ${valuesArray}`);
			lines.push(`    line ${valuesArray}`);
		} else {
			lines.push(`    bar ${valuesArray}`);
		}

		const mermaidCode = lines.join("\n");

		// const showDataLabel = this.getConfigValue<boolean>("showDataLabel");
		// const extraConfig = showDataLabel ? "%%{init: {\"xyChart\": {\"showDataLabel\": \"true\"} }}%%" : "";//TODO: wait for mermaid v11.7.0

		await this.renderMermaid(mermaidCode, this.plugin.settings.XYChartMermaidConfig);
	}
}
