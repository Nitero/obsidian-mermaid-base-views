import {ListValue, StringValue, type Value, getIcon} from "obsidian";
import {getNotePropertyMedia, type NoteMedia} from "./note-media";

const GANTT_TASK_MODIFIERS = ["active", "done", "crit", "milestone"] as const;

export type GanttTaskModifier = typeof GANTT_TASK_MODIFIERS[number];

export type GanttTaskAppearance = {
	modifiers: GanttTaskModifier[];
	media: NoteMedia | null;
};

export function parseGanttTaskAppearance(value: Value | null): GanttTaskAppearance {
	const values = value instanceof ListValue
		? Array.from({length: value.length()}, (_, index) => value.get(index))
		: [value];
	const modifiers = new Set<string>();
	let media: NoteMedia | null = null;
	for (const item of values) {
		if (!item)
			continue;
		const propertyMedia = getNotePropertyMedia(item);
		if (propertyMedia) {
			media ??= propertyMedia;
			continue;
		}
		if (!(item instanceof StringValue))
			continue;
		for (const token of item.toString().match(/!\[\[[^\]\r\n]+\]\]|[^\s,]+/g) ?? []) {
			const modifier = token.toLowerCase();
			if (GANTT_TASK_MODIFIERS.some((candidate) => candidate === modifier)) {
				modifiers.add(modifier);
			} else if (media === null) {
				if (token.startsWith("![[")) {
					media = {type: "image", link: token};
				} else {
					const name = modifier.replace(/^icon:/, "");
					if (/^[a-z0-9-]+$/.test(name) && getIcon(name))
						media = {type: "icon", name};
				}
			}
		}
	}
	return {modifiers: GANTT_TASK_MODIFIERS.filter((modifier) => modifiers.has(modifier)), media};
}
