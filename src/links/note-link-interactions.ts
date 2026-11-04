import {type App, type Component, type HoverParent, Keymap, Menu, type Workspace} from "obsidian";
import {registerDiagramClick} from "../ui/diagram-click";

type LinkMenuWorkspace = Workspace & {
	handleLinkContextMenu?: (menu: Menu, linktext: string, sourcePath: string) => boolean;
};

function addSvgHoverDimensions(link: Element): void {
	if (link.namespaceURI !== "http://www.w3.org/2000/svg" || "offsetHeight" in link)
		return;
	// Obsidian positions previews using HTML dimensions, which SVG elements lack.
	Object.defineProperties(link, {
		offsetWidth: {configurable: true, get: () => link.getBoundingClientRect().width},
		offsetHeight: {configurable: true, get: () => link.getBoundingClientRect().height},
	});
}

export function registerNoteLinkInteractions(
	component: Component,
	app: App,
	container: HTMLElement,
	hoverSource: string,
	getSourcePath: () => string,
): void {
	const hoverParent: HoverParent = {hoverPopover: null};
	const selector = ".bases-mermaid-note-link[data-href], a.internal-link";
	const getTarget = (target: EventTarget | null): Element | null => {
		const element = target as Element | null;
		if (element?.nodeType !== 1)
			return null;
		if (element.closest(".bases-mermaid-property-image"))
			return null;
		const link = element.closest(selector);
		return link && container.contains(link) ? link : null;
	};
	const getPath = (link: Element) => link.getAttribute("data-href") || link.getAttribute("href") || "";
	const setLinkState = (target: EventTarget | null, state: string, active: boolean) => {
		const link = getTarget(target);
		if (!link)
			return;
		const range = link.getAttribute("data-bases-link-range");
		const fileNameSelector = ".bases-mermaid-file-name-link:not(.bases-mermaid-group-note-link)";
		// Wrapped file names highlight together; group links highlight only their own range.
		const fragmentSelector = range ? `[data-bases-link-range="${range}"]`
			: link.matches(fileNameSelector) ? fileNameSelector : null;
		if (!fragmentSelector)
			return;
		link.closest("text, foreignObject")?.querySelectorAll(fragmentSelector).forEach((fragment) => {
			fragment.classList.toggle(state, active);
		});
	};
	component.registerDomEvent(container, "mouseover", (event) => setLinkState(event.target, "is-hovered", true));
	component.registerDomEvent(container, "mouseout", (event) => setLinkState(event.target, "is-hovered", false));
	component.registerDomEvent(container, "focusin", (event) => {
		if (getTarget(event.target)?.matches(":focus-visible"))
			setLinkState(event.target, "is-focused", true);
	});
	component.registerDomEvent(container, "focusout", (event) => setLinkState(event.target, "is-focused", false));

	const openLink = (event: MouseEvent, target: EventTarget | null = event.target) => {
		if (event.button !== 0 && event.button !== 1)
			return;
		const link = getTarget(target);
		if (!link)
			return;
		event.preventDefault();
		event.stopPropagation();
		void app.workspace.openLinkText(getPath(link), getSourcePath(), event.button === 1 ? "tab" : Keymap.isModEvent(event));
	};
	registerDiagramClick(component, container, openLink);
	component.registerDomEvent(container, "auxclick", openLink);
	component.registerDomEvent(container, "keydown", (event) => {
		const link = getTarget(event.target);
		if (event.key !== "Enter" || !link)
			return;
		event.preventDefault();
		event.stopPropagation();
		void app.workspace.openLinkText(getPath(link), getSourcePath(), Keymap.isModEvent(event));
	});
	component.registerDomEvent(container, "mouseover", (event) => {
		const link = getTarget(event.target);
		if (!link)
			return;
		event.stopPropagation();
		// Each wrapped fragment is a separate anchor and needs its own preview target.
		if (getTarget(event.relatedTarget) === link)
			return;
		addSvgHoverDimensions(link);
		app.workspace.trigger("hover-link", {
			event,
			source: hoverSource,
			hoverParent,
			targetEl: link,
			linktext: getPath(link),
			sourcePath: getSourcePath(),
		});
	});
	component.registerDomEvent(container, "contextmenu", (event) => {
		const link = getTarget(event.target);
		if (!link)
			return;
		event.preventDefault();
		event.stopPropagation();
		const path = getPath(link);
		const sourcePath = getSourcePath();
		const menu = new Menu();
		const workspace = app.workspace as LinkMenuWorkspace;
		if (workspace.handleLinkContextMenu) {
			workspace.handleLinkContextMenu(menu, path, sourcePath);
		} else {
			menu.addItem((item) => item.setTitle("Open in new tab").setIcon("file-plus").onClick(() => {
				void workspace.openLinkText(path, sourcePath, "tab");
			}));
			menu.addItem((item) => item.setTitle("Open to the right").setIcon("separator-vertical").onClick(() => {
				void workspace.openLinkText(path, sourcePath, "split");
			}));
			const file = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
			if (file)
				workspace.trigger("file-menu", menu, file, "link-context-menu");
		}
		menu.showAtMouseEvent(event);
	});
	component.register(() => hoverParent.hoverPopover?.unload());
}
