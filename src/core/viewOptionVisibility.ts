import {type BasesViewConfig} from "obsidian";
import {COMMON_VIEW_OPTIONS, NODE_LABEL_CONTENT_VALUES} from "./constants";

export function shouldHideShowPropertyNames(defaultNodeLabelContent: string) {
	return (config?: BasesViewConfig): boolean => {
		const nodeLabelContent = config?.get(COMMON_VIEW_OPTIONS.nodeLabelContent.key);
		const resolvedNodeLabelContent = typeof nodeLabelContent === "string" && nodeLabelContent.length > 0
			? nodeLabelContent
			: defaultNodeLabelContent;

		return resolvedNodeLabelContent !== NODE_LABEL_CONTENT_VALUES.properties;
	};
}
