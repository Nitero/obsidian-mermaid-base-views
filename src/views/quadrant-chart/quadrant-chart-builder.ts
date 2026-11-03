import {type BasesEntryGroup, type BasesPropertyId, type TFile} from "obsidian";
import {escapeMermaidQuotedLabel} from "../../utils/mermaid-text";
import {parseFiniteNumber} from "../../utils/numeric-values";

type Point = {
	path: string;
	label: string;
	x: number;
	y: number;
	series: number | null;
};

interface QuadrantData {
	points: Point[];
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

interface QuadrantChartOptions {
	title: string | null;
	xMin: number | null;
	xMax: number | null;
	yMin: number | null;
	yMax: number | null;
	xAxisLabelLeft: string;
	xAxisLabelRight: string;
	yAxisLabelBottom: string;
	yAxisLabelTop: string;
	quadrantLabelTopLeft: string;
	quadrantLabelTopRight: string;
	quadrantLabelBottomLeft: string;
	quadrantLabelBottomRight: string;
}

export function collectQuadrantPoints(
	groups: readonly BasesEntryGroup[],
	xPropertyId: BasesPropertyId,
	yPropertyId: BasesPropertyId,
	groupingEnabled: boolean,
	getLabel: (file: TFile) => string,
): QuadrantData {
	const points: Point[] = [];

	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
		const group = groups[groupIndex];
		const series = groupingEnabled ? groupIndex % 8 + 1 : null;

		if (!group)
			continue;

		for (const entry of group.entries) {
			const xNumber = parseFiniteNumber(entry.getValue(xPropertyId));
			const yNumber = parseFiniteNumber(entry.getValue(yPropertyId));
			if (xNumber === null || yNumber === null)
				continue;

			const label = getLabel(entry.file);

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

export function buildQuadrantChartCode(
	data: QuadrantData, options: QuadrantChartOptions,
): {code: string; points: Point[]} {
	let minX = options.xMin ?? data.minX;
	let maxX = options.xMax ?? data.maxX;
	let minY = options.yMin ?? data.minY;
	let maxY = options.yMax ?? data.maxY;
	if (minX === maxX) {
		minX -= 1;
		maxX += 1;
	}
	if (minY === maxY) {
		minY -= 1;
		maxY += 1;
	}
	const points = normalizePoints(data.points, minX, maxX, minY, maxY);
	return {code: formatQuadrantCode(points, options), points};
}

function normalizePoints(points: Point[], minX: number, maxX: number, minY: number, maxY: number): Point[] {
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

function formatQuadrantCode(normalizedPoints: Point[], options: QuadrantChartOptions): string {
	const {title} = options;

	let xAxisLabels: string = "";
	const xAxisLabelLeft = options.xAxisLabelLeft;
	const xAxisLabelRight = options.xAxisLabelRight;
	if (xAxisLabelLeft)
		xAxisLabels = xAxisLabelLeft;
	if (xAxisLabelRight && xAxisLabels)
		xAxisLabels += ` --> ${xAxisLabelRight}`;

	let yAxisLabels: string = "";
	const yAxisLabelBottom = options.yAxisLabelBottom;
	const yAxisLabelTop = options.yAxisLabelTop;
	if (yAxisLabelBottom)
		yAxisLabels = yAxisLabelBottom;
	if (yAxisLabelTop && yAxisLabels)
		yAxisLabels += ` --> ${yAxisLabelTop}`;

	const quadrantLabelTopLeft = options.quadrantLabelTopLeft;
	const quadrantLabelTopRight = options.quadrantLabelTopRight;
	const quadrantLabelBottomLeft = options.quadrantLabelBottomLeft;
	const quadrantLabelBottomRight = options.quadrantLabelBottomRight;

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
