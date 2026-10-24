import {App, Component, MarkdownPreviewRenderer} from "obsidian";
import {registerDiagramClick} from "../utils/diagram-click";

type MediaClickHandler = (
	this: {sections: {el: HTMLElement}[]},
	event: MouseEvent | KeyboardEvent,
	image: HTMLImageElement,
) => void;

type NativeMediaPreview = {handleMediaClick?: MediaClickHandler};

export function registerImagePreviewInteractions(component: Component, app: App, container: HTMLElement): void {
	const openPreview = (event: MouseEvent | KeyboardEvent, originalTarget: EventTarget | null = event.target): void => {
		const target = originalTarget as Element | null;
		if (target?.nodeType !== 1)
			return;
		const image = target.closest(".bases-mermaid-property-image[data-image-path]");
		if (!image || !container.contains(image))
			return;
		event.preventDefault();
		event.stopPropagation();
		const file = app.vault.getFileByPath(image.getAttribute("data-image-path") ?? "");
		if (!file)
			return;
		const handler = (MarkdownPreviewRenderer.prototype as NativeMediaPreview).handleMediaClick;
		if (typeof handler !== "function") {
			void app.workspace.openLinkText(file.path, "", "tab");
			return;
		}
		const gallery = createDiv();
		const thumbnail = gallery.createEl("img", {attr: {
			src: app.vault.getResourcePath(file),
			alt: file.basename,
			title: file.name,
		}});
		thumbnail.getBoundingClientRect = () => image.getBoundingClientRect();
		thumbnail.focus = () => (image as SVGElement).focus();
		handler.call({sections: [{el: gallery}]}, event, thumbnail);
	};
	registerDiagramClick(component, container, openPreview);
	component.registerDomEvent(container, "keydown", (event) => {
		if (!event.repeat && (event.key === "Enter" || event.key === " "))
			openPreview(event);
	}, {capture: true});
}
