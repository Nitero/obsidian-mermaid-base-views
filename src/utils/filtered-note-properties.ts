import {BasesEntry, type App, type TFile} from "obsidian";

type EntryContext = {app: App; formulas: unknown};
type EntryWithContext = BasesEntry & {ctx?: EntryContext};
type LinkedEntryConstructor = new (context: EntryContext, file: TFile) => BasesEntry;

export function createFilteredNoteEntry(file: TFile, reference: EntryWithContext | undefined): BasesEntry | null {
	const context = reference?.ctx;
	if (!context?.app || !context.formulas)
		return null;
	const Entry = BasesEntry as unknown as LinkedEntryConstructor;
	return new Entry(context, file);
}
