import {type BasesViewConfig} from "obsidian";

export function shouldHideShowDataLabel(key: string, defaultValue: boolean) {
	return (config?: BasesViewConfig): boolean => {
		const showLegendContent = config?.get(key);
		const resolvedNodeLabelContent = typeof showLegendContent === "boolean"
			? showLegendContent
			: defaultValue;

		return !resolvedNodeLabelContent;
	};
}
