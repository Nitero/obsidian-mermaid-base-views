import {DateValue, DurationValue, NullValue, NumberValue, StringValue, moment, type Value} from "obsidian";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const DURATION_PATTERN = /^(\d+(?:\.\d+)?)\s*(ms|[smhdwMy])$/;

export function isMissingGanttValue(value: Value | null): boolean {
	return value === null || value instanceof NullValue || value.toString().trim() === "";
}

export function parseGanttDate(value: Value | null, referenceDate: Date = new Date(), textDateFormat = ""): Date | null {
	if (!(value instanceof DateValue) && !(value instanceof StringValue))
		return null;
	const text = value.toString().trim();
	if (value instanceof StringValue && textDateFormat) {
		const formatTokens = textDateFormat.replace(/\[[^\]]*\]|\\./g, "");
		const timeOnly = !/[YMDQWwGgdxX]/.test(formatTokens);
		const referenceDay = moment(referenceDate).format("YYYY-MM-DD");
		const customDate = timeOnly
			? moment(`${referenceDay} ${text}`, `YYYY-MM-DD ${textDateFormat}`, true)
			: moment(text, textDateFormat, true);
		if (customDate.isValid())
			return customDate.toDate();
	}
	if (value instanceof StringValue && TIME_PATTERN.test(text)) {
		const referenceDay = moment(referenceDate).format("YYYY-MM-DD");
		const date = moment(`${referenceDay} ${text}`, ["YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mm:ss"], true);
		return date.isValid() ? date.toDate() : null;
	}
	const date = moment(text, moment.ISO_8601, true);
	return date.isValid() ? date.toDate() : null;
}

export function parseGanttDuration(value: Value | null): string | null {
	const text = value instanceof DurationValue
		? `${value.getMilliseconds()}ms`
		: value instanceof StringValue || value instanceof NumberValue ? value.toString().trim() : "";
	if (/^0+(?:\.0+)?$/.test(text))
		return "0ms";
	const match = DURATION_PATTERN.exec(text);
	if (!match || !Number.isFinite(Number(match[1])))
		return null;
	return `${match[1]}${match[2]}`;
}
