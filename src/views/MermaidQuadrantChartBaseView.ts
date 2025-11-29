import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesEntryGroup, BasesPropertyId} from "obsidian";
import {defaultGroupingPalette} from "../core/constants";

type Point = {
	label: string;
	x: number;
	y: number;
	color: string;
};

export class MermaidQuadrantChartBaseView extends MermaidBaseViewBase {
	readonly type = MermaidQuadrantChartBaseView.RegistrationData.id;
	readonly registrationData = MermaidQuadrantChartBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-quadrant-chart",
		name: "Quadrant Chart",
		icon: "scatter-chart",
		options: [
			{
				type: "text",
				displayName: "Title",
				key: "title",
				default: "Title",
			},

			{
				type: "property",
				displayName: "X coordinate property (numeric)",
				key: "xProperty",
				placeholder: "e.g. importance",
			},
			{
				type: "property",
				displayName: "Y coordinate property (numeric)",
				key: "yProperty",
				placeholder: "e.g. urgency",
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
						displayName: "X-min (optional)",
						key: "xMin",
						placeholder: "defaults to automatic from data",
						default: "0",
					},
					{
						type: "text",
						displayName: "X-max (optional)",
						key: "xMax",
						placeholder: "defaults to automatic from data",
						default: "1",
					},
					{
						type: "text",
						displayName: "Y-min (optional)",
						key: "yMin",
						placeholder: "defaults to automatic from data",
						default: "0",
					},
					{
						type: "text",
						displayName: "Y-max (optional)",
						key: "yMax",
						placeholder: "defaults to automatic from data",
						default: "1",
					},
				],
			},

			{
				type: "toggle",
				displayName: "Show property names",
				key: "showPropertyNames",
				default: true,
			},
			{
				type: "multitext",
				displayName: "Grouping palette",
				key: "groupingPalette",
				default: defaultGroupingPalette,
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

		const xPropertyId = this.config.getAsPropertyId("xProperty");
		const yPropertyId = this.config.getAsPropertyId("yProperty");

		const showPropertyNames = this.getConfigValue<boolean>("showPropertyNames");

		if (!xPropertyId || !yPropertyId) {
			this.containerEl.createDiv({text: "Configure numeric X and Y properties in the view settings."});
			return;
		}

		const rawPalette = this.config.get("groupingPalette") as string;

		const palette =
			Array.isArray(rawPalette)
				? rawPalette
					.map((v) => v?.toString().trim())
					.filter((v) => v && v.length > 0)
				: defaultGroupingPalette;

		if (!Array.isArray(rawPalette) || palette.length === 0)
			palette.splice(0, palette.length, ...defaultGroupingPalette);

		const groups = this.data.groupedData;
		const groupingEnabled = groups.length > 1 || (groups.length === 1 && groups[0].key !== undefined);

		const {
			points,
			minX: dataMinX,
			maxX: dataMaxX,
			minY: dataMinY,
			maxY: dataMaxY,
		} = this.collectPointsFromGroups(groups, xPropertyId, yPropertyId, showPropertyNames, palette, groupingEnabled);

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

		await this.renderMermaid(mermaidCode);
	}
	private collectPointsFromGroups(
		groups: BasesEntryGroup[],
		xPropertyId: BasesPropertyId,
		yPropertyId: BasesPropertyId,
		showPropertyNames: boolean,
		palette: string[],
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
			const groupColor = groupingEnabled ? palette[gi % palette.length] : "";

			for (const entry of group.entries) {
				const xValue = entry.getValue(xPropertyId);
				const yValue = entry.getValue(yPropertyId);

				if (!xValue || !yValue)
					continue;

				const xNumber = Number(xValue.toString());
				const yNumber = Number(yValue.toString());
				if (!Number.isFinite(xNumber) || !Number.isFinite(yNumber))
					continue;

				const label = this.getLabelWithProperties(entry.file, showPropertyNames, ", ", "ː");

				points.push({label, x: xNumber, y: yNumber, color: groupColor});

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
	): {minX: number; maxX: number; minY: number; maxY: number} {

		const minXConfigOverride = this.config.get("xMin");
		const maxXConfigOverride = this.config.get("xMax");
		const minYConfigOverride = this.config.get("yMin");
		const maxYConfigOverride = this.config.get("yMax");

		if (typeof minXConfigOverride === "string" && minXConfigOverride.trim().length > 0) {
			const value = Number(minXConfigOverride.trim());
			if (Number.isFinite(value))
				minX = value;
		}
		if (typeof maxXConfigOverride === "string" && maxXConfigOverride.trim().length > 0) {
			const value = Number(maxXConfigOverride.trim());
			if (Number.isFinite(value))
				maxX = value;
		}
		if (typeof minYConfigOverride === "string" && minYConfigOverride.trim().length > 0) {
			const value = Number(minYConfigOverride.trim());
			if (Number.isFinite(value))
				minY = value;
		}
		if (typeof maxYConfigOverride === "string" && maxYConfigOverride.trim().length > 0) {
			const value = Number(maxYConfigOverride.trim());
			if (Number.isFinite(value))
				maxY = value;
		}

		return {minX, maxX, minY, maxY};
	}

	private normalizePoints(points: Point[], minX: number, maxX: number, minY: number, maxY: number): Point[] {
		return points.map((point) => {
			const normalizedX = (point.x - minX) / (maxX - minX);
			const normalizedY = (point.y - minY) / (maxY - minY);

			const clampedX = Math.min(1, Math.max(0, normalizedX));
			const clampedY = Math.min(1, Math.max(0, normalizedY));

			return {
				label: point.label,
				x: clampedX,
				y: clampedY,
				color: point.color,
			};
		});
	}

	private buildMermaidCode(normalizedPoints: Point[]): string {
		const title = this.config.get("title") as string;

		let xAxisLabels: string = "";
		const xAxisLabelLeft = this.config.get("xAxisLabelLeft") as string;
		const xAxisLabelRight = this.config.get("xAxisLabelRight") as string;
		if (xAxisLabelLeft)
			xAxisLabels = xAxisLabelLeft;
		if (xAxisLabelRight && xAxisLabels)
			xAxisLabels += ` --> ${xAxisLabelRight}`;

		let yAxisLabels: string = "";
		const yAxisLabelBottom = this.config.get("yAxisLabelBottom") as string;
		const yAxisLabelTop = this.config.get("yAxisLabelTop") as string;
		if (yAxisLabelBottom)
			yAxisLabels = yAxisLabelBottom;
		if (yAxisLabelTop && yAxisLabels)
			yAxisLabels += ` --> ${yAxisLabelTop}`;

		const quadrantLabelTopLeft = this.config.get("quadrantLabelTopLeft");
		const quadrantLabelTopRight = this.config.get("quadrantLabelTopRight");
		const quadrantLabelBottomLeft = this.config.get("quadrantLabelBottomLeft");
		const quadrantLabelBottomRight = this.config.get("quadrantLabelBottomRight");

		const lines: string[] = [];
		lines.push("quadrantChart");
		if (title)
			lines.push(`    title ${title}`);
		if (xAxisLabels)
			lines.push(`    x-axis ${xAxisLabels}`);
		if (yAxisLabels)
			lines.push(`    y-axis ${yAxisLabels}`);
		if (quadrantLabelTopRight)
			lines.push(`    quadrant-1 "${quadrantLabelTopRight}"`);
		if (quadrantLabelTopLeft)
			lines.push(`    quadrant-2 "${quadrantLabelTopLeft}"`);
		if (quadrantLabelBottomLeft)
			lines.push(`    quadrant-3 "${quadrantLabelBottomLeft}"`);
		if (quadrantLabelBottomRight)
			lines.push(`    quadrant-4 "${quadrantLabelBottomRight}"`);

		for (const point of normalizedPoints) {
			if (point.color)
				lines.push(`    "${point.label}": [${point.x}, ${point.y}] color: ${point.color}`);
			else
				lines.push(`    "${point.label}": [${point.x}, ${point.y}]`);
		}
		return lines.join("\n");
	}
}
