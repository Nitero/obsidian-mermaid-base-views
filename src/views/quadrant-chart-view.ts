import {MermaidBasesView} from "../core/mermaid-bases-view";
import {escapeMermaidQuotedLabel} from "../core/mermaid-text";
import {parseFiniteNumber} from "../core/numeric-values";
import {MERMAID_CONFIG_EXAMPLES} from "../view-options/mermaid-config-examples";
import {MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {BasesEntryGroup, BasesPropertyId} from "obsidian";
import MermaidBaseViews from "../main";
import {InferredPropertyType} from "../view-options/inferred-property-type";
import {COMMON_VIEW_OPTIONS, NUMBER_RANGE_PLACEHOLDER} from "../view-options/common-options";

type Point = {
	path: string;
	label: string;
	x: number;
	y: number;
	series: number | null;
};

export class QuadrantChartView extends MermaidBasesView {
	readonly type = QuadrantChartView.RegistrationData.id;
	readonly registrationData = QuadrantChartView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-quadrant-chart",
		name: "Quadrant Chart",
		icon: "custom-quadrant-chart-2",//custom-quadrant-chart//grid-2x2//square-plus//scatter-chart
		getOptions: (plugin: MermaidBaseViews) => [
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
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Number),
			},
			{
				type: "property",
				displayName: "Y coordinate property",
				key: "yProperty",
				placeholder: "e.g. urgency",
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Number),
			},

			{
				type: "group",
				displayName: "Axis labels",
				items: [
					{
						type: "text",
						displayName: "X-axis left label",
						key: "xAxisLabelLeft",
					},
					{
						type: "text",
						displayName: "X-axis right label (requires left)",
						key: "xAxisLabelRight",
					},
					{
						type: "text",
						displayName: "Y-axis bottom label",
						key: "yAxisLabelBottom",
					},
					{
						type: "text",
						displayName: "Y-axis top label (requires bottom)",
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

		const groups = this.data.groupedData;
		const groupingEnabled = this.hasGrouping();

		const {
			points,
			minX: dataMinX,
			maxX: dataMaxX,
			minY: dataMinY,
			maxY: dataMaxY,
		} = this.collectPointsFromGroups(groups, xPropertyId, yPropertyId, showPropertyNames, groupingEnabled);

		if (points.length === 0) {
			this.containerEl.createDiv({text: "No numeric data found for the selected X/Y properties."});
			return;
		}

		let {minX, maxX, minY, maxY} = this.applyAxisOverrides(dataMinX, dataMaxX, dataMinY, dataMaxY);

		// Avoid zero range (would cause division by zero when normalizing)
		if (minX === maxX) {
			minX -= 1;
			maxX += 1;
		}
		if (minY === maxY) {
			minY -= 1;
			maxY += 1;
		}

		const normalizedPoints = this.normalizePoints(points, minX, maxX, minY, maxY);

		const mermaidCode = this.buildMermaidCode(normalizedPoints);

		const target = await this.renderMermaid(mermaidCode, this.plugin.settings.quadrantChartMermaidConfig);
		if (target?.parentElement !== this.containerEl)
			return;
		const paths = normalizedPoints.map((point) => point.path);
		this.markOrderedNoteLinks(".pele-points > .pele-point", paths, true);
		this.markOrderedNoteLinks(".pele-point-labels > text", paths);
	}

	private collectPointsFromGroups(
		groups: BasesEntryGroup[],
		xPropertyId: BasesPropertyId,
		yPropertyId: BasesPropertyId,
		showPropertyNames: boolean,
		groupingEnabled: boolean,
	): {
		points: Point[];
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
	} {
		const points: Point[] = [];

		let minX = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (let gi = 0; gi < groups.length; gi++) {
			const group = groups[gi];
			const series = groupingEnabled ? gi % 8 + 1 : null;

			if (!group)
				continue;

			for (const entry of group.entries) {
				const xNumber = parseFiniteNumber(entry.getValue(xPropertyId));
				const yNumber = parseFiniteNumber(entry.getValue(yPropertyId));
				if (xNumber === null || yNumber === null)
					continue;

				const label = this.getLabelWithProperties(entry.file, showPropertyNames, ", ", "ː", true);

				points.push({label, path: entry.file.path, x: xNumber, y: yNumber, series});

				if (xNumber < minX)
					minX = xNumber;
				if (xNumber > maxX)
					maxX = xNumber;
				if (yNumber < minY)
					minY = yNumber;
				if (yNumber > maxY)
					maxY = yNumber;
			}
		}

		return {points, minX, maxX, minY, maxY};
	}

	private applyAxisOverrides(
		minX: number,
		maxX: number,
		minY: number,
		maxY: number,
	): { minX: number; maxX: number; minY: number; maxY: number } {
		return {
			minX: this.getNumberConfig("xMin") ?? minX,
			maxX: this.getNumberConfig("xMax") ?? maxX,
			minY: this.getNumberConfig("yMin") ?? minY,
			maxY: this.getNumberConfig("yMax") ?? maxY,
		};
	}

	private normalizePoints(points: Point[], minX: number, maxX: number, minY: number, maxY: number): Point[] {
		return points.map((point) => {
			const normalizedX = (point.x - minX) / (maxX - minX);
			const normalizedY = (point.y - minY) / (maxY - minY);

			const clampedX = Math.min(1, Math.max(0, normalizedX));
			const clampedY = Math.min(1, Math.max(0, normalizedY));

			return {
				path: point.path,
				label: point.label,
				x: clampedX,
				y: clampedY,
				series: point.series,
			};
		});
	}

	private buildMermaidCode(normalizedPoints: Point[]): string {
		const title = this.getOptionalTitle();

		let xAxisLabels: string = "";
		const xAxisLabelLeft = this.getStringConfig("xAxisLabelLeft", "");
		const xAxisLabelRight = this.getStringConfig("xAxisLabelRight", "");
		if (xAxisLabelLeft)
			xAxisLabels = xAxisLabelLeft;
		if (xAxisLabelRight && xAxisLabels)
			xAxisLabels += ` --> ${xAxisLabelRight}`;

		let yAxisLabels: string = "";
		const yAxisLabelBottom = this.getStringConfig("yAxisLabelBottom", "");
		const yAxisLabelTop = this.getStringConfig("yAxisLabelTop", "");
		if (yAxisLabelBottom)
			yAxisLabels = yAxisLabelBottom;
		if (yAxisLabelTop && yAxisLabels)
			yAxisLabels += ` --> ${yAxisLabelTop}`;

		const quadrantLabelTopLeft = this.getStringConfig("quadrantLabelTopLeft", "");
		const quadrantLabelTopRight = this.getStringConfig("quadrantLabelTopRight", "");
		const quadrantLabelBottomLeft = this.getStringConfig("quadrantLabelBottomLeft", "");
		const quadrantLabelBottomRight = this.getStringConfig("quadrantLabelBottomRight", "");

		const lines: string[] = [];
		lines.push("quadrantChart");
		if (title !== null)
			lines.push(`    title ${title}`);
		if (xAxisLabels)
			lines.push(`    x-axis ${xAxisLabels}`);
		if (yAxisLabels)
			lines.push(`    y-axis ${yAxisLabels}`);
		if (quadrantLabelTopRight)
			lines.push(`    quadrant-1 "${escapeMermaidQuotedLabel(quadrantLabelTopRight)}"`);
		if (quadrantLabelTopLeft)
			lines.push(`    quadrant-2 "${escapeMermaidQuotedLabel(quadrantLabelTopLeft)}"`);
		if (quadrantLabelBottomLeft)
			lines.push(`    quadrant-3 "${escapeMermaidQuotedLabel(quadrantLabelBottomLeft)}"`);
		if (quadrantLabelBottomRight)
			lines.push(`    quadrant-4 "${escapeMermaidQuotedLabel(quadrantLabelBottomRight)}"`);

		for (const point of normalizedPoints) {
			if (point.series !== null)
				lines.push(`    "${escapeMermaidQuotedLabel(point.label)}":::basesMermaidSeries${point.series}: [${point.x}, ${point.y}]`);
			else
				lines.push(`    "${escapeMermaidQuotedLabel(point.label)}": [${point.x}, ${point.y}]`);
		}
		return lines.join("\n");
	}
}
