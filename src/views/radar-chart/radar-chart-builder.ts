import {type BasesEntryGroup, type BasesPropertyId, type TFile} from "obsidian";
import {escapeMermaidQuotedLabel} from "../../utils/mermaid-text";
import {parseFiniteNumber} from "../../utils/numeric-values";

type Curve = {
	path: string;
	fileName: string;
	label: string;
	values: number[];
};

type RawCurve = {
	path: string;
	fileName: string;
	label: string;
	values: (number | null)[];
};

export type RadarAxis = {
	id: string;
	label: string;
	propertyId: BasesPropertyId;
};

interface RadarData {
	curves: RawCurve[];
	minValue: number;
	maxValue: number;
}

interface RadarChartOptions {
	title: string | null;
	min: number | null;
	max: number | null;
	graticule: string;
	ticks: string;
	showLegend: boolean;
}

export function collectRadarCurves(
	groups: readonly BasesEntryGroup[],
	axes: readonly RadarAxis[],
	getLabel: (file: TFile) => string,
): RadarData {
	const curves: RawCurve[] = [];
	let minValue = Number.POSITIVE_INFINITY;
	let maxValue = Number.NEGATIVE_INFINITY;

	for (const group of groups) {
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

			const label = getLabel(entry.file);

			curves.push({label, values, path: entry.file.path, fileName: entry.file.basename});
		}
	}

	return {curves, minValue, maxValue};
}


export function buildRadarChartCode(
	axes: readonly RadarAxis[], data: RadarData, options: RadarChartOptions,
): {code: string; curves: Curve[]} {
	let minValue = options.min ?? data.minValue;
	let maxValue = options.max ?? data.maxValue;
	if (minValue === maxValue) {
		minValue -= 1;
		maxValue += 1;
	}
	const curves = applyRange(data.curves, minValue, maxValue);
	const code = formatRadarCode(
		axes, curves, options,
		options.min !== null || minValue !== 0 ? minValue : null,
		options.max !== null || maxValue !== data.maxValue ? maxValue : null,
	);
	return {code, curves};
}

function applyRange(rawCurves: RawCurve[], minValue: number, maxValue: number): Curve[] {
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

function formatRadarCode(
	axes: readonly RadarAxis[], curves: readonly Curve[], options: RadarChartOptions,
	minValue: number | null, maxValue: number | null,
): string {
	const {title, graticule, ticks, showLegend} = options;
	const lines: string[] = [];
	lines.push("radar-beta");
	if (title !== null)
		lines.push(`  title ${title}`);

	const axisChunks: RadarAxis[][] = [];
	const chunkSize = 6;
	for (let index = 0; index < axes.length; index += chunkSize)
		axisChunks.push(axes.slice(index, index + chunkSize));

	for (const chunk of axisChunks) {
		const parts = chunk.map((axis) => {
			return `${axis.id}["${escapeMermaidQuotedLabel(axis.label)}"]`;
		});
		lines.push(`  axis ${parts.join(", ")}`);
	}

	for (let index = 0; index < curves.length; index++) {
		const curve = curves[index]!;
		const values = curve.values.join(", ");
		lines.push(`  curve id${index}["${escapeMermaidQuotedLabel(curve.label)}"]{${values}}`);
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
