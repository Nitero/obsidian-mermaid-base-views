import {NullValue, Value, type BasesEntry, type BasesEntryGroup, type BasesPropertyId, type TFile} from "obsidian";

export function includeFilteredNoteGroups(
	groups: readonly BasesEntryGroup[],
	files: Iterable<TFile>,
	property: BasesPropertyId | null,
	getEntry: (file: TFile) => BasesEntry | null,
): readonly BasesEntryGroup[] {
	if (!property)
		return groups;
	const result = groups.map((group) => ({
		key: group.key,
		entries: [...group.entries],
		hasKey: () => group.hasKey(),
	}));
	const includedPaths = new Set(groups.flatMap((group) => group.entries.map((entry) => entry.file.path)));
	for (const file of files) {
		if (includedPaths.has(file.path))
			continue;
		const entry = getEntry(file);
		if (!entry)
			continue;
		const key = entry.getValue(property) ?? NullValue.value;
		let group = result.find((candidate) => Value.equals(candidate.key ?? NullValue.value, key));
		if (!group) {
			group = {key, entries: [], hasKey: () => !Value.equals(key, NullValue.value)};
			result.push(group);
		}
		group.entries.push(entry);
		includedPaths.add(file.path);
	}
	return result;
}
