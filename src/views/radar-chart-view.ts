import {MermaidBasesView} from "../core/mermaid-bases-view";
import {escapeMermaidQuotedLabel} from "../core/mermaid-text";
import {parseFiniteNumber} from "../core/numeric-values";
import {MERMAID_CONFIG_EXAMPLES} from "../view-options/mermaid-config-examples";
import {MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {BasesPropertyId, type BasesViewConfig, parsePropertyId} from "obsidian";
import MermaidBaseViews from "../main";
import {COMMON_VIEW_OPTIONS, NUMBER_RANGE_PLACEHOLDER} from "../view-options/common-options";

const GRATICULE_OPTIONS = {circle: "Circle", polygon: "Polygon"};

function hideDataLabelsWithoutLegend(config?: BasesViewConfig): boolean {
	const showLegend = config?.get("showLegend");
	return typeof showLegend === "boolean" && !showLegend;
}

type Curve = {
	path: string;
	fileName: string;
	label: string;
	values: number[]
};

type RawCurve = {
	path: string;
	fileName: string;
	label: string;
	values: (number | null)[]
};

type Axis = {
	id: string;
	label: string;
	propertyId: BasesPropertyId
};

export class RadarChartView extends MermaidBasesView {
	readonly type = RadarChartView.RegistrationData.id;
	readonly registrationData = RadarChartView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-radar",
		name: "Radar Chart",
		icon: "custom-radar-chart",//life-buoy//ship-wheel//radar//radius
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
				options: GRATICULE_OPTIONS,
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
				displayName: "Show Legend",
				key: "showLegend",
				default: true,
			},
			{
				type: "toggle",
				displayName: COMMON_VIEW_OPTIONS.showDataLabel.displayName,
				key: COMMON_VIEW_OPTIONS.showDataLabel.key,
				default: COMMON_VIEW_OPTIONS.showDataLabel.default,
				shouldHide: hideDataLabelsWithoutLegend,
			},
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.radar.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const title = this.getOptionalTitle();
		const graticule = this.getDropdownConfig("graticule", GRATICULE_OPTIONS);
		const ticks = this.getStringConfig("ticks");
		const showLegend = this.getBooleanConfig("showLegend");
		const showDataLabel = this.getBooleanConfig("showDataLabel");

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

		const minOverride = this.getNumberConfig("min");
		const maxOverride = this.getNumberConfig("max");

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
			ticks,
			showLegend
		);

		const target = await this.renderMermaid(mermaidCode, this.plugin.settings.radarChartMermaidConfig);
		if (target?.parentElement !== this.containerEl)
			return;
		const notesById = new Map(curves.map((curve, index) => [`id${index}`, curve]));
		this.containerEl.querySelectorAll(".pele-legend-item[data-id]").forEach((legend) => {
			const curve = notesById.get(legend.getAttribute("data-id") ?? "");
			if (curve)
				this.markNoteLink(legend, curve.path, [curve.fileName]);
		});
	}

	private generateRawCurves(
		axes: Axis[],
		showDataLabel: boolean,
	): { curves: RawCurve[]; minValue: number; maxValue: number } {

		const curves: RawCurve[] = [];
		let minValue = Number.POSITIVE_INFINITY;
		let maxValue = Number.NEGATIVE_INFINITY;

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				const values: (number | null)[] = [];
				let allMissing = true;

				for (const axis of axes) {
					const number = parseFiniteNumber(entry.getValue(axis.propertyId), true);

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
				if (showDataLabel)
					label += ` (${this.getLabelWithProperties(entry.file, true, ", ", "ː")})`

				curves.push({label, values, path: entry.file.path, fileName: entry.file.basename});
			}
		}

		return {curves, minValue, maxValue};
	}

	private applyRange(rawCurves: RawCurve[], minValue: number, maxValue: number): Curve[] {
		return rawCurves.map((curve) => ({
			path: curve.path,
			fileName: curve.fileName,
			label: curve.label,
			values: curve.values.map((value) => {
				if (value === null)
					return minValue;

				return Math.min(maxValue, Math.max(minValue, value));
			}),
		}));
	}

	private buildMermaidCode(
		title: string | null, axes: Axis[], curves: Curve[], minValue: number | null, maxValue: number | null, graticule: string, ticks: string, showLegend: boolean | null,
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
				return `${axis.id}["${escapeMermaidQuotedLabel(axis.label)}"]`;
			});
			lines.push(`  axis ${parts.join(", ")}`);
		}

		for (let i = 0; i < curves.length; i++) {
			const curve = curves[i]!;
			const values = curve.values.join(", ");
			lines.push(`  curve id${i}["${escapeMermaidQuotedLabel(curve.label)}"]{${values}}`);
		}

		if (maxValue !== null)
			lines.push(`  max ${maxValue}`);
		if (minValue !== null)
			lines.push(`  min ${minValue}`);
		lines.push(`  graticule ${graticule}`);
		lines.push(`  ticks ${ticks}`);
		lines.push(`  showLegend ${showLegend}`);

		return lines.join("\n");
	}
}
