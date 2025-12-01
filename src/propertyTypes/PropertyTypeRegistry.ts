import {
	BasesPropertyId,
	parsePropertyId,
} from "obsidian";
import {InferredPropertyType} from "./InferredPropertyType";

export class PropertyTypeRegistry {

    private filter(propertyId: BasesPropertyId, ...propertyTypes: InferredPropertyType[]): boolean {
        const property  = parsePropertyId(propertyId);

        if(property.type === "formula")
            return true;

        for (const propertyType of propertyTypes) {
            if(propertyType == InferredPropertyType.Date && property.type === "file" && (property.name !== "ctime" && property.name !== "mtime"))
                return false;
            if(propertyType == InferredPropertyType.Number && property.type === "file" && property.name !== "size")
                return false;
        }

        //TODO: figure out a safe & performant way to do more sophisticated filtering

        return true;
    }
	createFilter(...types: InferredPropertyType[]) {
		return (propertyId: BasesPropertyId) => this.filter(propertyId, ...types);
	}
}
