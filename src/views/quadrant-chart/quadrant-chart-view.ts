import {MermaidBasesView} from "../../core/mermaid-bases-view";
import {type MermaidViewRegistrationData} from "../../core/mermaid-view-registration-data";
import {createPropertyTypeFilter} from "../../view-options/property-filters";
import {COMMON_VIEW_OPTIONS, NUMBER_RANGE_PLACEHOLDER} from "../../view-options/common-options";
import {MERMAID_CONFIG_EXAMPLES} from "../../view-options/mermaid-config-examples";
import {buildQuadrantChartCode, collectQuadrantPoints} from "./quadrant-chart-builder";

export class QuadrantChartView extends MermaidBasesView {
	readonly type = QuadrantChartView.RegistrationData.id;
	readonly registrationData = QuadrantChartView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-quadrant-chart",
		name: "Quadrant Chart",
		icon: "custom-quadrant-chart-2",//custom-quadrant-chart//grid-2x2//square-plus//scatter-chart
		getOptions: () => [
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.title.displayName,
				key: COMMON_VIEW_OPTIONS.title.key,
				default: COMMON_VIEW_OPTIONS.title.default,
			},

			{
				type: "property",
				displayName: "X coordinate property",
				key: "xProperty",
				placeholder: "e.g. importance",
				filter: createPropertyTypeFilter("number"),
			},
			{
				type: "property",
				displayName: "Y coordinate property",
				key: "yProperty",
				placeholder: "e.g. urgency",
				filter: createPropertyTypeFilter("number"),
			},

			{
				type: "group",
				displayName: "Axis labels",
				items: [
					{
						type: "text",
						displayName: "X-axis left label",
						key: "xAxisLabelLeft",
						placeholder: "Empty: property name; space: hide label",
					},
					{
						type: "text",
						displayName: "X-axis right label",
						key: "xAxisLabelRight",
					},
					{
						type: "text",
						displayName: "Y-axis bottom label",
						key: "yAxisLabelBottom",
						placeholder: "Empty: property name; space: hide label",
					},
					{
						type: "text",
						displayName: "Y-axis top label",
						key: "yAxisLabelTop",
					},
				],
			},

			{
				type: "group",
				displayName: "Quadrant labels",
				items: [
					{
						type: "text",
						displayName: "Top-left quadrant label",
						key: "quadrantLabelTopLeft",
					},
					{
						type: "text",
						displayName: "Top-right quadrant label",
						key: "quadrantLabelTopRight",
					},
					{
						type: "text",
						displayName: "Bottom-left quadrant label",
						key: "quadrantLabelBottomLeft",
					},
					{
						type: "text",
						displayName: "Bottom-right quadrant label",
						key: "quadrantLabelBottomRight",
					},
				],
			},

			{
				type: "group",
				displayName: "Axis Ranges",
				items: [
					{
						type: "text",
						displayName: "X-minimum (optional)",
						key: "xMin",
						placeholder: NUMBER_RANGE_PLACEHOLDER,
					},
					{
						type: "text",
						displayName: "X-maximum (optional)",
						key: "xMax",
						placeholder: NUMBER_RANGE_PLACEHOLDER,
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
				],
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
				placeholder: MERMAID_CONFIG_EXAMPLES.quadrantChart.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const xPropertyId = this.config.getAsPropertyId("xProperty");
		const yPropertyId = this.config.getAsPropertyId("yProperty");
		const showPropertyNames = this.getBooleanConfig(COMMON_VIEW_OPTIONS.showPropertyNames.key);
		if (!xPropertyId || !yPropertyId) {
			this.containerEl.createDiv({text: "Configure numeric X and Y properties in the view settings."});
			return;
		}
		const data = collectQuadrantPoints(
			this.data.groupedData, xPropertyId, yPropertyId, this.hasGrouping(),
			(file) => this.getLabelWithProperties(file, showPropertyNames, ", ", "ː", true),
		);
		if (data.points.length === 0) {
			this.containerEl.createDiv({text: "No numeric data found for the selected X/Y properties."});
			return;
		}
		const chart = buildQuadrantChartCode(data, {
			title: this.getOptionalTitle(),
			xMin: this.getNumberConfig("xMin"),
			xMax: this.getNumberConfig("xMax"),
			yMin: this.getNumberConfig("yMin"),
			yMax: this.getNumberConfig("yMax"),
			xAxisLabelLeft: this.getStringConfig("xAxisLabelLeft", this.config.getDisplayName(xPropertyId)),
			xAxisLabelRight: this.getStringConfig("xAxisLabelRight", ""),
			yAxisLabelBottom: this.getStringConfig("yAxisLabelBottom", this.config.getDisplayName(yPropertyId)),
			yAxisLabelTop: this.getStringConfig("yAxisLabelTop", ""),
			quadrantLabelTopLeft: this.getStringConfig("quadrantLabelTopLeft", ""),
			quadrantLabelTopRight: this.getStringConfig("quadrantLabelTopRight", ""),
			quadrantLabelBottomLeft: this.getStringConfig("quadrantLabelBottomLeft", ""),
			quadrantLabelBottomRight: this.getStringConfig("quadrantLabelBottomRight", ""),
		});
		if (!chart) {
			this.containerEl.createDiv({text: "Each axis minimum must be less than its maximum. Check the view settings."});
			return;
		}
		const {code, points} = chart;
		const target = await this.renderMermaid(code, this.plugin.settings.quadrantChartMermaidConfig);
		if (target?.parentElement !== this.containerEl)
			return;
		const paths = points.map((point) => point.path);
		this.markOrderedNoteLinks(".pele-points > .pele-point", paths, true);
		this.markOrderedNoteLinks(".pele-point-labels > text", paths);
	}
}
