import {
	App,
	BasesPropertyId,
	BooleanValue,
	DateValue,
	ListValue,
	NullValue,
	NumberValue,
	parsePropertyId,
	Value,
} from "obsidian";
import {InferredPropertyType} from "./InferredPropertyType";
import {MermaidBaseViewBase} from "../views/MermaidBaseViewBase";

export class PropertyTypeRegistry {
	private propertiesToInferredTypes = new Map<BasesPropertyId, InferredPropertyType>();
	private app: App;

	constructor(app: App) {
		this.app = app;
		this.addBuiltinProperties();
	}

	private addBuiltinProperties() {
		this.addType("file.size", InferredPropertyType.Number);
		this.addType("file.ctime", InferredPropertyType.Date);
		this.addType("file.mtime", InferredPropertyType.Date);
	}

	update(baseView: MermaidBaseViewBase) {
		if (baseView.allProperties.length === 0)
			return;

		//TODO: fix this only works when the view that is being configured is/was open
		for (const entry of baseView.data.data) {
			for (const propertyId of baseView.allProperties) {
				const value = entry.getValue(propertyId);
				this.inferTypeFromValue(propertyId, value);
			}
		}
	}

	inferTypeFromValue(propertyId: BasesPropertyId, value: Value | null | undefined) {
		if (value === null || value === undefined || value instanceof NullValue)
			return;

		if (value instanceof NumberValue) {
			this.addType(propertyId, InferredPropertyType.Number);
			return;
		}
		if (value instanceof BooleanValue) {
			this.addType(propertyId, InferredPropertyType.Boolean);
			return;
		}
		if (value instanceof DateValue) {
			this.addType(propertyId, InferredPropertyType.Date);
			return;
		}
		if (value instanceof ListValue) {
			this.addType(propertyId, InferredPropertyType.List);
			return;
		}

		const text = value.toString().trim();
		if (!text)
			return;

		const asNumber = Number(text);
		if (Number.isFinite(asNumber)) {
			this.addType(propertyId, InferredPropertyType.Number);
			return;
		}

		const lower = text.toLowerCase();
		if (lower === "true" || lower === "false") {
			this.addType(propertyId, InferredPropertyType.Boolean);
			return;
		}

		if (!Number.isFinite(asNumber)) {
			const maybeDate = new Date(text);
			if (!Number.isNaN(maybeDate.getTime())) {
				this.addType(propertyId, InferredPropertyType.Date);
				return;
			}
		}

		if (Array.isArray(text)) {
			this.addType(propertyId, InferredPropertyType.Number);
			return;
		}

		this.addType(propertyId, InferredPropertyType.String);
	}

	private isEmpty(): boolean {
		return this.propertiesToInferredTypes.size === 0;
	}

	private addType(propertyId: BasesPropertyId, type: InferredPropertyType) {
		if (type != InferredPropertyType.Unknown)
			this.propertiesToInferredTypes.set(propertyId, type);
	}

	private filter(propertyId: BasesPropertyId, ...propertyTypes: InferredPropertyType[]): boolean {
		for (const propertyType of propertyTypes) {
			const property  = parsePropertyId(propertyId);
			if(property.type === "formula" && !this.propertiesToInferredTypes.has(propertyId))//TODO: currently no way to validate this manually?
				return true;
			if(propertyType == InferredPropertyType.Date && property.type === "file" && (property.name === "created" || property.name === "modified"))
				return true;
			if(propertyType == InferredPropertyType.Number && property.type === "file" && property.name === "size")
				return true;
		}

		this.scanVault();

		if (this.isEmpty())
			return true;
		if (propertyTypes.length === 0)
			return true;

		const inferredPropertyType = this.propertiesToInferredTypes.get(propertyId);
		if(inferredPropertyType === undefined)
			return false;
		for (const type of propertyTypes)
			if (inferredPropertyType === type)
				return true;
		return false;
	}

	private scanVault() {
		for (const file of this.app.vault.getMarkdownFiles()) {
			const fileCache = this.app.metadataCache.getFileCache(file);
			const frontmatterCache = fileCache?.frontmatter;
			if (!frontmatterCache)
				continue;

			for (const [key, value] of Object.entries(frontmatterCache)) {
				const propertyId = `note.${key}` as BasesPropertyId;
				this.inferTypeFromValue(propertyId, value);
			}
		}
	}

	createFilter(...types: InferredPropertyType[]) {
		return (propertyId: BasesPropertyId) => this.filter(propertyId, ...types);
	}
}
