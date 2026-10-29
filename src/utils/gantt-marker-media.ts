import {type App, type Component} from "obsidian";
import {type GanttData, hasGanttMarkerMedia} from "./gantt";
import {createNoteMedia, type NoteMedia} from "./note-media";
import {registerRenderObservers} from "./render-observers";

export class GanttMarkerMedia {
	private readonly mediaByTaskId = new Map<string, {media: NoteMedia; path: string}>();

	constructor(
		component: Component,
		private readonly app: App,
		private readonly container: HTMLElement,
		private readonly markNoteLink: (node: Element, path: string) => void,
	) {
		registerRenderObservers(component, container, () => this.render());
	}

	setData(data: GanttData): void {
		this.mediaByTaskId.clear();
		for (const section of data.sections) {
			for (const task of section.tasks) {
				if (hasGanttMarkerMedia(task))
					this.mediaByTaskId.set(task.id, {media: task.appearance.media, path: task.path});
			}
		}
	}

	render(): void {
		for (const node of Array.from(this.container.querySelectorAll<SVGGElement>(".pele-task.pele-milestone[data-id]"))) {
			const taskMedia = this.mediaByTaskId.get(node.getAttribute("data-id") ?? "");
			if (!taskMedia || node.querySelector(".bases-mermaid-gantt-marker"))
				continue;
			const shape = node.querySelector<SVGPathElement>(":scope > path");
			if (!shape)
				continue;
			let bounds: DOMRect;
			try {
				bounds = shape.getBBox();
			} catch {
				continue;
			}
			if (bounds.width <= 0 || bounds.height <= 0)
				continue;
			const media = createNoteMedia(this.app, taskMedia.media, taskMedia.path);
			if (!media)
				continue;
			media.classList.remove("svg-icon");
			media.classList.add("bases-mermaid-gantt-marker");
			media.setAttribute("x", String(bounds.x));
			media.setAttribute("y", String(bounds.y));
			media.setAttribute("width", String(bounds.width));
			media.setAttribute("height", String(bounds.height));
			media.setAttribute("preserveAspectRatio", "xMidYMid meet");
			if (taskMedia.media.type === "icon") {
				media.setAttribute("color", shape.getAttribute("stroke") ?? "currentColor");
				this.markNoteLink(media, taskMedia.path);
			}
			shape.replaceWith(media);
		}
	}
}
