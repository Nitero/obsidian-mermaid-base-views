import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesPropertyId, parsePropertyId} from "obsidian";
import MermaidBaseViews from "../main";
import {COMMON_VIEW_OPTIONS, NUMBER_RANGE_PLACEHOLDER} from "../core/constants";


type Curve = {
	label: string;
	values: number[]
};

type RawCurve = {
	label: string;
	values: (number | null)[]
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
				displayName: COMMON_VIEW_OPTIONS.title.displayName,
				key: COMMON_VIEW_OPTIONS.title.key,
				default: COMMON_VIEW_OPTIONS.title.default,
			},
			{
				type: "text",
				displayName: "Min value (optional)",
				key: "min",
				placeholder: NUMBER_RANGE_PLACEHOLDER,
			},
			{
				type: "text",
				displayName: "Max value (optional)",
				key: "max",
				placeholder: NUMBER_RANGE_PLACEHOLDER,
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
		const title = this.getOptionalTitle();
		const graticule = this.getConfigValue<string>("graticule");
		const ticks = this.getConfigValue<string>("ticks");
		const showDataLabel = this.getConfigValue<boolean>("showDataLabel");

		const axes: Axis[] = [];
		let axisId = 0;
		for (const property of this.data.properties)
			axes.push({id: `a${axisId++}`, label: parsePropertyId(property).name, propertyId: property});

		if (axes.length === 0) {
			this.containerEl.createDiv({text: "No valid axis properties resolved from the configuration."});
			return;
		}

		const {
			curves: rawCurves,
			minValue: dataMinValue,
			maxValue: dataMaxValue,
		} = this.generateRawCurves(
			axes,
			showDataLabel,
		);

		if (rawCurves.length === 0) {
			this.containerEl.createDiv({text: "No numeric/boolean values found for the selected axis properties."});
			return;
		}

		const minOverride = this.getNumberOverride("min");
		const maxOverride = this.getNumberOverride("max");

		let minValue = minOverride ?? dataMinValue;
		let maxValue = maxOverride ?? dataMaxValue;

		if (minValue === maxValue) {
			minValue -= 1;
			maxValue += 1;
		}

		const curves = this.applyRange(rawCurves, minValue, maxValue);

		const mermaidCode = this.buildMermaidCode(
			title,
			axes,
			curves,
			minOverride !== null || minValue !== 0 ? minValue : null,
			maxOverride !== null || maxValue !== dataMaxValue ? maxValue : null,
			graticule,
			ticks
		);

		await this.renderMermaid(mermaidCode, this.plugin.settings.radarChartMermaidConfig);
	}

	private generateRawCurves(
		axes: Axis[],
		showDataLabel: boolean,
	): {curves: RawCurve[]; minValue: number; maxValue: number} {

		const curves: RawCurve[] = [];
		let minValue = Number.POSITIVE_INFINITY;
		let maxValue = Number.NEGATIVE_INFINITY;

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				const values: (number | null)[] = [];
				let allMissing = true;

				for (const axis of axes) {
					const value = entry.getValue(axis.propertyId);
					if (value === null || value === undefined) {
						values.push(null);
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
						values.push(null);
						continue;
					}

					allMissing = false;

					if (number < minValue)
						minValue = number;
					if (number > maxValue)
						maxValue = number;

					values.push(number);
				}

				if (allMissing)
					continue;

				let label = entry.file.basename;
				if(showDataLabel)
					label += ` (${this.getLabelWithProperties(entry.file, true, ", ", "ː")})`

				curves.push({label, values});
			}
		}

		return {curves, minValue, maxValue};
	}

	private getNumberOverride(key: string): number | null {
		const config = this.getConfigValue<string>(key, "").trim();
		if (config.length === 0)
			return null;

		const value = Number(config);
		if (!Number.isFinite(value))
			return null;

		return value;
	}

	private applyRange(rawCurves: RawCurve[], minValue: number, maxValue: number): Curve[] {
		return rawCurves.map((curve) => ({
			label: curve.label,
			values: curve.values.map((value) => {
				if (value === null)
					return minValue;

				return Math.min(maxValue, Math.max(minValue, value));
			}),
		}));
	}

	private buildMermaidCode(
		title: string | null, axes: Axis[], curves: Curve[], minValue: number | null, maxValue: number | null, graticule: string, ticks: string,
	): string {
		const lines: string[] = [];
		lines.push("radar-beta");
		if (title !== null)
			lines.push(`  title ${title}`);

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

		if (maxValue !== null)
			lines.push(`  max ${maxValue}`);
		if (minValue !== null)
			lines.push(`  min ${minValue}`);
		lines.push(`  graticule ${graticule}`);
		lines.push(`  ticks ${ticks}`);

		return lines.join("\n");
	}
}
