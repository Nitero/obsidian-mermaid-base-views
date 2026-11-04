import {IconValue, ImageValue, ListValue, StringValue, type Value, getIcon} from "obsidian";
import {getExternalImageUrl} from "./external-image";

export type NoteMedia = { type: "icon"; name: string } | { type: "image"; link: string };

export function getNotePropertyMedia(value: Value): NoteMedia | null {
	if (value instanceof IconValue)
		return {type: "icon", name: value.toString()};
	if (value instanceof ImageValue)
		return {type: "image", link: value.toString()};
	return null;
}

function parseNoteMediaToken(token: string): NoteMedia | null {
	if (/^!\[\[[^\]\r\n]+\]\]$/.test(token))
		return {type: "image", link: token};
	const name = token.toLowerCase().replace(/^icon:/, "");
	return /^[a-z0-9-]+$/.test(name) && getIcon(name) ? {type: "icon", name} : null;
}

export function parseNoteIcon(value: Value | null): NoteMedia | "none" | null {
	const values = value instanceof ListValue
		? Array.from({length: value.length()}, (_, index) => value.get(index))
		: [value];
	for (const item of values) {
		if (!item)
			continue;
		const propertyMedia = getNotePropertyMedia(item);
		if (propertyMedia)
			return propertyMedia;
		if (!(item instanceof StringValue))
			continue;
		// Parse the whole URL first so query strings containing commas stay intact.
		const text = item.toString();
		if (getExternalImageUrl(text))
			return {type: "image", link: text};
		for (const token of text.match(/!\[\[[^\]\r\n]+\]\]|[^\s,]+/g) ?? []) {
			if (token.toLowerCase() === "none" || token.toLowerCase() === "icon:none")
				return "none";
			const media = parseNoteMediaToken(token);
			if (media)
				return media;
		}
	}
	return null;
}
