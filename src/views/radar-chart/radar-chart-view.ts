import {type BasesViewConfig, parsePropertyId} from "obsidian";
import {MermaidBasesView} from "../../core/mermaid-bases-view";
import {type MermaidViewRegistrationData} from "../../core/mermaid-view-registration-data";
import MermaidBaseViews from "../../main";
import {COMMON_VIEW_OPTIONS, NUMBER_RANGE_PLACEHOLDER} from "../../view-options/common-options";
import {MERMAID_CONFIG_EXAMPLES} from "../../view-options/mermaid-config-examples";
import {buildRadarChartCode, collectRadarCurves, type RadarAxis} from "./radar-chart-builder";

const GRATICULE_OPTIONS = {circle: "Circle", polygon: "Polygon"};

function hideDataLabelsWithoutLegend(config?: BasesViewConfig): boolean {
	const showLegend = config?.get("showLegend");
	return typeof showLegend === "boolean" && !showLegend;
}

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
		const axes: RadarAxis[] = this.data.properties.map((property, index) => ({
			id: `a${index}`,
			label: parsePropertyId(property).name,
			propertyId: property,
		}));
		if (axes.length === 0) {
			this.containerEl.createDiv({text: "No valid axis properties resolved from the configuration."});
			return;
		}
		const data = collectRadarCurves(this.data.groupedData, axes, (file) => showDataLabel
			? `${file.basename} (${this.getLabelWithProperties(file, true, ", ", "ː")})` : file.basename);
		if (data.curves.length === 0) {
			this.containerEl.createDiv({text: "No numeric/boolean values found for the selected axis properties."});
			return;
		}
		const {code, curves} = buildRadarChartCode(axes, data, {
			title,
			min: this.getNumberConfig("min"),
			max: this.getNumberConfig("max"),
			graticule,
			ticks,
			showLegend,
		});
		const target = await this.renderMermaid(code, this.plugin.settings.radarChartMermaidConfig);
		if (target?.parentElement !== this.containerEl)
			return;
		const notesById = new Map(curves.map((curve, index) => [`id${index}`, curve]));
		this.containerEl.querySelectorAll(".pele-legend-item[data-id]").forEach((legend) => {
			const curve = notesById.get(legend.getAttribute("data-id") ?? "");
			if (curve)
				this.markNoteLink(legend, curve.path, [curve.fileName]);
		});
	}
}
