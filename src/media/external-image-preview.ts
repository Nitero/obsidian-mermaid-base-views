import {type App, Modal} from "obsidian";
import {createExternalImageElement} from "./external-image";

export class ExternalImagePreview extends Modal {
	constructor(app: App, private readonly url: string) {
		super(app);
	}

	onOpen(): void {
		const host = new URL(this.url).hostname;
		this.setTitle(`External image: ${host}`);
		this.contentEl.addClass("bases-mermaid-external-image-preview");
		this.contentEl.appendChild(createExternalImageElement(this.url, `External image from ${host}`));
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
