import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesPropertyId, parsePropertyId} from "obsidian";
import MermaidBaseViews from "../../main";


type Curve = {
	label: string;
	values: number[]
};

type Axis = {
	id: string;
	label: string;
	propertyId: BasesPropertyId
};

export class MermaidRadarChartBaseView extends MermaidBaseViewBase {
	readonly type = MermaidRadarChartBaseView.RegistrationData.id;
	readonly registrationData = MermaidRadarChartBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-radar",
		name: "Radar Chart",
		icon: "radar",//radius
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: "Chart title",
				key: "title",
				default: "Title",
			},
			{
				type: "text",
				displayName: "Min value",
				key: "min",
				default: "0",
			},
			{
				type: "text",
				displayName: "Max value",
				key: "max",
				default: "100",
			},
			{
				type: "property",
				displayName: "Label property (optional)",
				key: "labelProperty",
				placeholder: "defaults to file name",
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
		const title = this.config.get("title") as string;

		const labelPropertyId = this.config.getAsPropertyId("labelProperty");

		let minValue = 0;
		let maxValue = 100;

		const minConfig = this.getConfigValue<string>("min");
		if(minConfig){
			const minConfigNumber = Number(minConfig);
			if (Number.isFinite(minConfigNumber))
				minValue = minConfigNumber;
		}
		const maxConfig = this.getConfigValue<string>("max");
		if(maxConfig){
			const maxConfigNumber = Number(maxConfig);
			if (Number.isFinite(maxConfigNumber))
				maxValue = maxConfigNumber;
		}

		if (minValue === maxValue) {
			minValue -= 1;
			maxValue += 1;
		}

		const axes: Axis[] = [];
		let axisId = 0;
		for (const property of this.data.properties)
			axes.push({id: `a${axisId++}`, label: parsePropertyId(property).name, propertyId: property});

		if (axes.length === 0) {
			this.containerEl.createDiv({text: "No valid axis properties resolved from the configuration."});
			return;
		}

		const {curves, hasAnyValue} = this.generateCurves(
			axes,
			labelPropertyId,
			minValue,
			maxValue,
		);

		if (!hasAnyValue || curves.length === 0) {
			this.containerEl.createDiv({text: "No numeric/boolean values found for the selected axis properties."});
			return;
		}

		const mermaidCode = this.buildMermaidCode(
			title,
			axes,
			curves,
			minValue,
			maxValue,
		);

		await this.renderMermaid(mermaidCode, this.plugin.settings.radarChartMermaidConfig);
	}

	private generateCurves(
		axes: Axis[],
		labelPropertyId: BasesPropertyId | null | undefined,
		minValue: number,
		maxValue: number,
	): {curves: Curve[]; hasAnyValue: boolean} {

		const curves: Curve[] = [];
		let hasAnyValue = false;

		let curveIndex = 0;
		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				const values: number[] = [];
				let allMissing = true;

				for (const axis of axes) {
					const value = entry.getValue(axis.propertyId);
					if (!value) {
						values.push(minValue);
						continue;
					}

					const t = value.toString().trim();
					let number: number | null = null;

					if (t === "true")
						number = 1;
					else if (t === "false")
						number = 0;
					else {
						const parsed = Number(t);
						if (Number.isFinite(parsed))
							number = parsed;
					}

					if (number === null) {
						values.push(minValue);
						continue;
					}

					allMissing = false;

					const clamped = Math.clamp(number, minValue, maxValue);
					values.push(clamped);
				}

				if (allMissing)
					continue;

				let label = "";
				if (labelPropertyId) {
					const labelValue = entry.getValue(labelPropertyId);
					if (labelValue)
						label = labelValue.toString().trim();
				}
				if (!label)
					label = entry.file?.basename ?? `(series ${curveIndex + 1})`;

				curves.push({label, values});
				hasAnyValue = true;
			}
		}

		return {curves, hasAnyValue};
	}

	private buildMermaidCode(
		title: string,
		axes: Axis[],
		curves: Curve[],
		minValue: number,
		maxValue: number,
	): string {
		const lines: string[] = [];
		lines.push("radar-beta");
		if (title)
			lines.push(`  title "${title}"`);

		const axisChunks: Axis[][] = [];
		const chunkSize = 6;
		for (let i = 0; i < axes.length; i += chunkSize)
			axisChunks.push(axes.slice(i, i + chunkSize));

		for (const chunk of axisChunks) {
			const parts = chunk.map((axis) => {
				return `${axis.id}["${axis.label}"]`;
			});
			lines.push(`  axis ${parts.join(", ")}`);
		}

		for (const curve of curves) {
			const values = curve.values.join(", ");
			lines.push(`  curve $["${curve.label}"]{${values}}`);
		}

		lines.push(`  max ${maxValue}`);
		lines.push(`  min ${minValue}`);

		return lines.join("\n");
	}
}
