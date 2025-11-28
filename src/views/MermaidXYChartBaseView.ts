import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidXYViewId} from "../core/constants";
import {BasesPropertyId, parsePropertyId} from "obsidian";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";

export class MermaidXYChartBaseView extends MermaidBaseViewBase {
	readonly type = MermaidXYViewId;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: MermaidXYViewId,
		name: "XY Chart",
		icon: "line-chart",
		options: [
			{
				type: "text",
				displayName: "Title",
				key: "title",
				default: "Title",
			},
			{
				type: "property",
				displayName: "Y-axis value property (numeric, e.g. file size)",
				key: "yValueProperty",
				placeholder: "e.g. file size",
			},
			{
				type: "text",
				displayName: "Y-axis label",
				key: "yAxisLabel",
				default: "",
			},
			{
				type: "text",
				displayName: "Y-min override (optional)",
				key: "yMin",
				placeholder: "defaults to automatic from data",
			},
			{
				type: "text",
				displayName: "Y-max override (optional)",
				key: "yMax",
				placeholder: "defaults to automatic from data",
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
				displayName: "Mermaid config (optional)",
				key: "mermaidConfig",
				placeholder: `%%{init: { "theme": "dark" }}%%`,
			},
		],
	};

	protected async render(): Promise<void> {
		const yValuePropertyId = this.config.getAsPropertyId("yValueProperty");

		const showPropertyNames = this.getConfigValue("showPropertyNames", true);//TODO: should be connected to default setting

		if (!yValuePropertyId) {
			this.containerEl.createDiv({text: "Configure a numeric Y-axis value property in the view settings."});
			return;
		}

		const title = this.config.get("title") as string;
		const yAxisLabel = this.getConfigValue("yAxisLabel", parsePropertyId(yValuePropertyId).name);
		const chartType = this.getConfigValue<"bar" | "line" | "bar-and-line">("chartType", "bar");

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
		if(yMinConfig){
			const yMinConfigNumber = Number(yMinConfig);
			if (Number.isFinite(yMinConfigNumber))
				yMin = yMinConfigNumber;
		}
		const yMaxConfig = this.getConfigValue("yMax", "");
		if (yMaxConfig){
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

		// const showDataLabel = this.config.get("showDataLabel") as Boolean;
		// const extraConfig = showDataLabel ? "%%{init: {\"xyChart\": {\"showDataLabel\": \"true\"} }}%%" : "";//TODO: figure out why labels don"t work

		await this.renderMermaid(mermaidCode);
	}
}
