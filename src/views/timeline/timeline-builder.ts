import {type BasesEntryGroup, type BasesPropertyId, type TFile} from "obsidian";
import {escapeTimelineLabel} from "../../utils/mermaid-text";
import {getGroupLabel} from "../../links/group-label";

export type TimeGranularity = "year" | "month" | "day" | "hour" | "minute" | "second";

type TimelinePeriod = {
	label: string;
	date: Date;
	events: { label: string; path: string }[];
};

export type TimelineSection = {
	label: string | null;
	group: BasesEntryGroup;
	periods: TimelinePeriod[];
};

export function collectTimelineSections(
	groups: readonly BasesEntryGroup[],
	timePropertyId: BasesPropertyId,
	granularity: TimeGranularity,
	hasGrouping: boolean,
	getLabel: (file: TFile) => string,
): TimelineSection[] {
	const sections: TimelineSection[] = [];

	for (const group of groups) {
		const periods = new Map<string, TimelinePeriod>();
		for (const entry of group.entries) {
			const timeValue = entry.getValue(timePropertyId);
			if (!timeValue)
				continue;

			const timeText = timeValue.toString().trim();
			if (!timeText)
				continue;

			const date = new Date(timeText);
			if (Number.isNaN(date.getTime()))
				continue;

			const {label, truncatedDate} = truncateAndFormatDate(date, granularity);

			const eventLabel = getLabel(entry.file);

			let period = periods.get(label);
			if (!period) {
				period = {label, date: truncatedDate, events: []};
				periods.set(label, period);
			}
			period.events.push({
				label: eventLabel,
				path: entry.file.path,
			});
		}
		if (periods.size > 0) {
			sections.push({
				label: hasGrouping ? getGroupLabel(group) : null,
				group,
				periods: Array.from(periods.values()).sort(
					(first, second) => first.date.getTime() - second.date.getTime(),
				),
			});
		}
	}

	return sections;
}

export function buildTimelineCode(title: string | null, sections: TimelineSection[]): string {
	const lines: string[] = [];
	lines.push("timeline");
	if (title !== null)
		lines.push(`    title ${title}`);

	for (const section of sections) {
		if (section.label !== null)
			lines.push(`    section ${escapeTimelineLabel(section.label.replace(/[\r\n]+/g, " "))}`);
		for (const period of section.periods)
			lines.push(`    ${period.label} : ${period.events.map((event) => escapeTimelineLabel(event.label)).join(" : ")}`);
	}

	return lines.join("\n");
}

function truncateAndFormatDate(
	date: Date,
	granularity: TimeGranularity,
): { label: string; truncatedDate: Date } {
	const year = date.getFullYear();
	const month = date.getMonth();
	const day = date.getDate();
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();

	let truncatedDate: Date;
	let label: string;

	switch (granularity) {
		case "year":
			truncatedDate = new Date(year, 0, 1, 0, 0, 0, 0);
			label = `${year}`;
			break;

		case "month":
			truncatedDate = new Date(year, month, 1, 0, 0, 0, 0);
			label = `${year}-${month + 1}`;
			break;

		case "day":
			truncatedDate = new Date(year, month, day, 0, 0, 0, 0);
			label = `${year}-${month + 1}-${day}`;
			break;

		case "hour":
			truncatedDate = new Date(year, month, day, hour, 0, 0, 0);
			label = `${year}-${month + 1}-${day} ${hour}h`;
			break;

		case "minute":
			truncatedDate = new Date(year, month, day, hour, minute, 0, 0);
			label = `${year}-${month + 1}-${day} ${hour}h${minute}`;
			break;

		case "second":
			truncatedDate = new Date(year, month, day, hour, minute, second, 0);
			label = `${year}-${month + 1}-${day} ${hour}h${minute}m${second}s`;
			break;
	}

	return {label, truncatedDate};
}
