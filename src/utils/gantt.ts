import {moment} from "obsidian";
import {type GanttTaskAppearance} from "./gantt-appearance";
import {type NoteMedia} from "./note-media";

export type GanttTask = {
	id: string;
	label: string;
	path: string;
	start: Date;
	end: Date | null;
	duration: string | null;
	appearance: GanttTaskAppearance;
};

export type GanttSection = {
	label: string | null;
	tasks: GanttTask[];
};

export type GanttMarker = {
	id: string;
	label: string;
	path: string;
	date: Date;
};

export type GanttData = {
	sections: GanttSection[];
	markers: GanttMarker[];
};

export type GanttOptions = {
	axisFormat: string;
	tickInterval: string;
	excludes: string;
	showTodayMarker: boolean;
	includeTodayInRange: boolean;
};

export function isZeroLengthGanttTask(task: Pick<GanttTask, "start" | "end" | "duration">): boolean {
	return task.end !== null
		? task.end.getTime() === task.start.getTime()
		: task.duration === null || Number.parseFloat(task.duration) === 0;
}

export function hasGanttMarkerMedia(
	task: GanttTask,
): task is GanttTask & {appearance: GanttTaskAppearance & {media: NoteMedia}} {
	return isZeroLengthGanttTask(task) && task.appearance.media !== null;
}

export function escapeGanttLabel(label: string): string {
	return label.replace(/[&:#;\r\n]/g, (character) => {
		switch (character) {
			case "&": return "#38;";
			case ":": return "#58;";
			case "#": return "#35;";
			case ";": return "#59;";
			default: return " ";
		}
	});
}

export function buildGanttCode(
	title: string | null,
	data: GanttData,
	options: GanttOptions,
): string {
	const {tickInterval, showTodayMarker} = options;
	const dateFormat = "YYYY-MM-DD HH:mm:ss.SSS";
	const lines = ["gantt", `    dateFormat ${dateFormat}`];
	const axisFormat = options.axisFormat.trim();
	if (axisFormat)
		lines.push(`    axisFormat ${axisFormat}`);
	if (title !== null)
		lines.push(`    title ${escapeGanttLabel(title)}`);
	if (tickInterval !== "auto")
		lines.push(`    tickInterval ${tickInterval}`);
	const excludes = options.excludes.replace(/[\r\n]+/g, " ").trim();
	if (excludes)
		lines.push(`    excludes ${excludes}`);
	if (!showTodayMarker)
		lines.push("    todayMarker off");

	const formatDate = (date: Date) => moment(date).locale("en").format(dateFormat);
	for (const section of data.sections) {
		if (section.tasks.length === 0)
			continue;
		if (section.label !== null)
			lines.push(`    section ${escapeGanttLabel(section.label)}`);
		for (const task of section.tasks) {
			const modifiers = [...task.appearance.modifiers];
			if (hasGanttMarkerMedia(task) && !modifiers.includes("milestone"))
				modifiers.push("milestone");
			const endOrDuration = task.end === null ? task.duration ?? "0d" : formatDate(task.end);
			const fields = [...modifiers, task.id, formatDate(task.start), endOrDuration];
			lines.push(`    ${escapeGanttLabel(task.label)} : ${fields.join(", ")}`);
		}
	}
	for (const marker of data.markers)
		lines.push(`    ${escapeGanttLabel(marker.label)} : vert, ${marker.id}, ${formatDate(marker.date)}, 0d`);
	if (options.includeTodayInRange) {
		const today = moment().startOf("day");
		lines.push(`    Today : vert, bases-mermaid-today-range-start, ${today.toISOString()}, 0d`);
		lines.push(`    Today : vert, bases-mermaid-today-range-end, ${today.add(1, "day").toISOString()}, 0d`);
	}
	return lines.join("\n");
}
