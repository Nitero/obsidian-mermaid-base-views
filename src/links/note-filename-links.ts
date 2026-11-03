import {createLabelTextLinks} from "./note-text-links";

export interface NoteLabel {
	text: string;
	fileNameRanges: readonly {start: number; end: number}[];
}

export function createNoteFileNameLinks(node: Element, label: NoteLabel, path: string): void {
	createLabelTextLinks(node, label.text, label.fileNameRanges.map((range) => ({...range, path})));
}
