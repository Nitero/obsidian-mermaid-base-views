export function resolveNumericRange(
	dataMin: number, dataMax: number, configuredMin: number | null, configuredMax: number | null,
): {min: number; max: number} | null {
	let min = configuredMin ?? dataMin;
	let max = configuredMax ?? dataMax;
	if (min === max) {
		// Expand automatic bounds without moving an explicitly configured bound.
		const padding = Math.max(1, Math.abs(min) * 0.01);
		if (configuredMin === null)
			min -= padding;
		if (configuredMax === null)
			max += padding;
	}
	return Number.isFinite(min) && Number.isFinite(max) && min < max ? {min, max} : null;
}
