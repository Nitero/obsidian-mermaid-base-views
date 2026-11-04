import {moment} from "./moment";

export function parseIsoDate(text: string): Date | null {
	// Moment keeps date-only values on their local calendar day and respects explicit offsets.
	const date = moment(text.trim(), moment.ISO_8601, true);
	return date.isValid() ? date.toDate() : null;
}
