import {type App, getIcon} from "obsidian";
import {type NoteMedia} from "./note-media";

export function createNoteMedia(app: App, media: NoteMedia, sourcePath: string): SVGElement | null {
	if (media.type === "icon") {
		const icon = getIcon(media.name);
		icon?.setAttribute("aria-label", media.name);
		icon?.setAttribute("role", "img");
		return icon ?? null;
	}
	const match = /^!\[\[([^\]]+)\]\]$/.exec(media.link);
	if (!match)
		return null;
	const path = match[1]!.split("|")[0]!;
	const imageFile = app.metadataCache.getFirstLinkpathDest(path, sourcePath);
	if (!imageFile || !/^(png|jpe?g|gif|webp|svg|avif|bmp|ico|apng)$/i.test(imageFile.extension))
		return null;
	return createSvg("image", {
		cls: "bases-mermaid-property-image", attr: {
			href: app.vault.getResourcePath(imageFile),
			"preserveAspectRatio": "xMidYMid meet",
			"aria-label": `Open image: ${imageFile.basename}`,
			"data-image-path": imageFile.path,
			tabindex: "0",
			role: "button",
		}
	});
}
