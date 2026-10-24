import {App, Component, IconValue, ImageValue, TFile, Value, getIcon} from "obsidian";
import {registerImagePreviewInteractions} from "../ui/image-preview";

const MEDIA_MARKER_START = 0xe000;
const MEDIA_MARKER_COUNT = 6400;
const IMAGE_ROWS = 4;
const IMAGE_COLUMNS = 6;

export class NotePropertyMedia {
	private readonly media = new Map<string, SVGElement>();

	constructor(private readonly app: App, component: Component, container: HTMLElement) {
		registerImagePreviewInteractions(component, app, container);
		const observer = new MutationObserver(() => this.render(container));
		const resizeObserver = new ResizeObserver(() => this.render(container));
		observer.observe(container, {childList: true, subtree: true});
		resizeObserver.observe(container);
		component.register(() => observer.disconnect());
		component.register(() => resizeObserver.disconnect());
	}

	clear(): void {
		this.media.clear();
	}

	format(value: Value, file: TFile, newLine: string): {text: string; block: boolean} {
		const element = this.createMedia(value, file);
		if (!element || this.media.size >= MEDIA_MARKER_COUNT)
			return {text: value.toString(), block: false};
		const marker = String.fromCharCode(MEDIA_MARKER_START + this.media.size);
		const image = value instanceof ImageValue;
		const block = image && (newLine === "<br>" || newLine === "\n");
		this.media.set(marker, element);
		return {
			text: block ? Array<string>(IMAGE_ROWS).fill(marker.repeat(IMAGE_COLUMNS)).join(newLine) : marker.repeat(image ? 2 : 1),
			block,
		};
	}

	render(container: HTMLElement): void {
		if (this.media.size === 0)
			return;
		for (const text of Array.from(container.querySelectorAll<SVGTextElement>("svg text"))) {
			if (text.hasAttribute("data-bases-media"))
				continue;
			const content = text.textContent ?? "";
			const markers = Array.from(new Set(content)).filter((character) => this.media.has(character));
			if (markers.length === 0 || text.getNumberOfChars() === 0 || text.getBBox().width === 0)
				continue;
			text.setAttribute("data-bases-media", "");
			for (const marker of markers)
				this.renderMedia(text, content, marker);
			this.hideMarkers(text);
		}
	}

	private createMedia(value: Value, file: TFile): SVGElement | null {
		if (value instanceof IconValue) {
			const icon = getIcon(value.toString());
			icon?.setAttribute("aria-label", value.toString());
			icon?.setAttribute("role", "img");
			return icon ?? null;
		}
		if (!(value instanceof ImageValue))
			return null;
		const match = /^!\[\[([^\]]+)\]\]$/.exec(value.toString());
		if (!match)
			return null;
		const path = match[1]!.split("|")[0]!;
		const imageFile = this.app.metadataCache.getFirstLinkpathDest(path, file.path);
		if (!imageFile || !/^(png|jpe?g|gif|webp|svg|avif|bmp|ico|apng)$/i.test(imageFile.extension))
			return null;
		return createSvg("image", {cls: "bases-mermaid-property-image", attr: {
			href: this.app.vault.getResourcePath(imageFile),
			"preserveAspectRatio": "xMidYMid meet",
			"aria-label": `Open image: ${imageFile.basename}`,
			"data-image-path": imageFile.path,
			tabindex: "0",
			role: "button",
		}});
	}

	private renderMedia(text: SVGTextElement, content: string, marker: string): void {
		const media = this.media.get(marker)!;
		const boxes: DOMRect[] = [];
		for (let index = 0; index < content.length; index++) {
			if (content[index] === marker && index < text.getNumberOfChars())
				boxes.push(text.getExtentOfChar(index));
		}
		if (boxes.length === 0)
			return;
		const left = Math.min(...boxes.map((box) => box.x));
		const top = Math.min(...boxes.map((box) => box.y));
		const width = Math.max(...boxes.map((box) => box.x + box.width)) - left;
		const height = Math.max(...boxes.map((box) => box.y + box.height)) - top;
		const element = media.cloneNode(true) as SVGElement;
		const iconSize = Math.min(width, height);
		element.classList.remove("svg-icon");
		element.classList.add("bases-mermaid-property-media");
		element.setAttribute("x", String(left));
		element.setAttribute("y", String(element.localName === "image" ? top : top + (height - iconSize) / 2));
		element.setAttribute("width", String(element.localName === "image" ? width : iconSize));
		element.setAttribute("height", String(element.localName === "image" ? height : iconSize));
		const transform = text.getAttribute("transform");
		if (transform)
			element.setAttribute("transform", transform);
		text.parentElement?.appendChild(element);
	}

	private hideMarkers(text: SVGTextElement): void {
		const walker = text.ownerDocument.createTreeWalker(text, 4);
		const textNodes: Text[] = [];
		while (walker.nextNode())
			textNodes.push(walker.currentNode as Text);
		for (const textNode of textNodes) {
			for (let index = textNode.length - 1; index >= 0; index--) {
				if (!this.media.has(textNode.data[index]!))
					continue;
				const end = index + 1;
				while (index > 0 && this.media.has(textNode.data[index - 1]!))
					index--;
				const markerNode = textNode.splitText(index);
				markerNode.splitText(end - index);
				const hidden = createSvg("tspan", {attr: {opacity: "0", "aria-hidden": "true"}});
				markerNode.replaceWith(hidden);
				hidden.appendChild(markerNode);
			}
		}
	}
}
