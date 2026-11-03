export function parseFiniteNumber(value: {toString(): string} | null | undefined, allowBoolean = false): number | null {
	const text = value?.toString().trim();
	if (!text)
		return null;
	if (allowBoolean && text === "true")
		return 1;
	if (allowBoolean && text === "false")
		return 0;
	const number = Number(text);
	return Number.isFinite(number) ? number : null;
}
