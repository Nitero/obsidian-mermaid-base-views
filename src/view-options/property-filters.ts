import {parsePropertyId, type BasesPropertyId, type BasesPropertyType} from "obsidian";

type PropertyValueType = "number" | "boolean" | "date" | "list" | "string";

const FILE_PROPERTY_TYPES: Partial<Record<string, PropertyValueType>> = {
	size: "number",
	ctime: "date",
	mtime: "date",
	name: "string",
	basename: "string",
	path: "string",
	folder: "string",
	ext: "string",
	links: "list",
	backlinks: "list",
	embeds: "list",
	tags: "list",
};

export function createPropertyTypeFilter(...types: PropertyValueType[]): (propertyId: BasesPropertyId) => boolean {
	return (propertyId) => {
		const property = parsePropertyId(propertyId);
		// Note and formula types are unknown here, so leave them selectable.
		if (property.type !== "file" || types.length === 0)
			return true;
		const type = FILE_PROPERTY_TYPES[property.name];
		return type === undefined || types.includes(type);
	};
}

export function createPropertySourceFilter(...sources: BasesPropertyType[]): (propertyId: BasesPropertyId) => boolean {
	return (propertyId) => sources.includes(parsePropertyId(propertyId).type);
}
