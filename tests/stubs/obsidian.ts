import type {BasesProperty, BasesPropertyId, BasesPropertyType} from "obsidian";

// Mirrors Obsidian's behavior: the type is everything before the first dot,
// the name is the rest (which may contain further dots).
export function parsePropertyId(propertyId: BasesPropertyId): BasesProperty {
	const separator = propertyId.indexOf(".");
	return {
		type: propertyId.slice(0, separator) as BasesPropertyType,
		name: propertyId.slice(separator + 1),
	};
}
