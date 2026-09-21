import {type BasesViewConfig} from "obsidian";

export function shouldHideShowPropertyNames(defaultNodeLabelContent: string) {
	return (config?: BasesViewConfig): boolean => {
		const nodeLabelContent = config?.get("nodeLabelContent");
		const resolvedNodeLabelContent = typeof nodeLabelContent === "string" && nodeLabelContent.length > 0
			? nodeLabelContent
			: defaultNodeLabelContent;

		return resolvedNodeLabelContent !== "properties";
	};
}
