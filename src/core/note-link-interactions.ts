import {type App, type Component, type HoverParent, Keymap, Menu, type Workspace} from "obsidian";

type LinkMenuWorkspace = Workspace & {
	handleLinkContextMenu?: (menu: Menu, linktext: string, sourcePath: string) => boolean;
};

export function registerNoteLinkInteractions(
	component: Component,
	app: App,
	container: HTMLElement,
	hoverSource: string,
	getSourcePath: () => string,
): void {
	const hoverParent: HoverParent = {hoverPopover: null};
	const selector = ".bases-mermaid-note-link[data-href], a.internal-link";
	const getTarget = (target: EventTarget | null): HTMLElement | null => {
		const element = target as Element | null;
		if (element?.nodeType !== 1)
			return null;
		if (element.closest(".bases-mermaid-property-image"))
			return null;
		const link = element.closest<HTMLElement>(selector);
		return link && container.contains(link) ? link : null;
	};
	const getPath = (link: Element) => link.getAttribute("data-href") || link.getAttribute("href") || "";

	const openLink = (event: MouseEvent) => {
		if (event.button !== 0 && event.button !== 1)
			return;
		const link = getTarget(event.target);
		if (!link)
			return;
		event.preventDefault();
		event.stopPropagation();
		void app.workspace.openLinkText(getPath(link), getSourcePath(), event.button === 1 ? "tab" : Keymap.isModEvent(event));
	};
	component.registerDomEvent(container, "click", openLink);
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
		const previousLink = getTarget(event.relatedTarget);
		if (previousLink && getPath(previousLink) === getPath(link))
			return;
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
