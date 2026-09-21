import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesPropertyId, parsePropertyId} from "obsidian";
import MermaidBaseViews from "../main";
import {COMMON_VIEW_OPTIONS, NUMBER_RANGE_PLACEHOLDER} from "../core/constants";


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
				key: COMMON_VIEW_OPTIONS.title.key,
				default: COMMON_VIEW_OPTIONS.title.default,
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
				type: "dropdown",
				displayName: "Graticule (Shape)",
				key: "graticule",
				default: "circle",
				options: {"circle": "Circle", "polygon": "Polygon"},
			},
			{
				type: "text",
				displayName: "Ticks",
				key: "ticks",
				default: "5",
				placeholder: NUMBER_RANGE_PLACEHOLDER,
			},
			{
				type: "toggle",
				displayName: "Show values on labels",
				key: "showDataLabel",
				default: false,
			},
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: COMMON_VIEW_OPTIONS.mermaidConfigOverride.placeholder,
			},
		],
	};

	protected async render(): Promise<void> {
		const title = this.getConfigValue<string>(COMMON_VIEW_OPTIONS.title.key);
		const graticule = this.getConfigValue<string>("graticule");
		const ticks = this.getConfigValue<string>("ticks");
		const showDataLabel = this.getConfigValue<boolean>("showDataLabel");

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
			showDataLabel,
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
			graticule,
			ticks
		);

		await this.renderMermaid(mermaidCode, this.plugin.settings.radarChartMermaidConfig);
	}

	private generateCurves(
		axes: Axis[],
		showDataLabel: boolean,
		minValue: number,
		maxValue: number,
	): {curves: Curve[]; hasAnyValue: boolean} {

		const curves: Curve[] = [];
		let hasAnyValue = false;

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

				let label = entry.file.basename;
				if(showDataLabel)
					label += ` (${this.getLabelWithProperties(entry.file, true, ", ", "ː")})`

				curves.push({label, values});
				hasAnyValue = true;
			}
		}

		return {curves, hasAnyValue};
	}

	private buildMermaidCode(
		title: string, axes: Axis[], curves: Curve[], minValue: number, maxValue: number, graticule: string, ticks: string,
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

		for (let i = 0; i < curves.length; i++){
			const curve = curves[i]!;
			const values = curve.values.join(", ");
			lines.push(`  curve id${i}["${curve.label}"]{${values}}`);
		}

		lines.push(`  max ${maxValue}`);
		lines.push(`  min ${minValue}`);
		lines.push(`  graticule ${graticule}`);
		lines.push(`  ticks ${ticks}`);

		return lines.join("\n");
	}
}
