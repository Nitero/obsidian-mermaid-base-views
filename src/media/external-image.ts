/** Accept only absolute web URLs, without embedded credentials or control characters. */
export function getExternalImageUrl(link: string): string | null {
	const embed = /^!\[[^\]\r\n]*\]\((.*)\)$/.exec(link);
	const source = (embed?.[1] ?? link).trim();
	if (!/^https?:\/\//i.test(source) || /[\p{Cc}\\]/u.test(source))
		return null;
	try {
		const url = new URL(source);
		return url.hostname && !url.username && !url.password ? url.href : null;
	} catch {
		return null;
	}
}

export function createExternalImageElement(url: string, alt: string): HTMLImageElement {
	// Set request policies before src, including in previews. Do not retry without CORS.
	const image = createEl("img", {cls: "bases-mermaid-external-image"});
	image.crossOrigin = "anonymous";
	image.referrerPolicy = "no-referrer";
	image.alt = alt;
	image.src = url;
	return image;
}

export function createExternalImage(url: string): SVGElement {
	const label = `Open external image: ${new URL(url).hostname}`;
	const image = createSvg("svg", {
		cls: "bases-mermaid-property-image",
		attr: {"data-image-url": url, "aria-label": label, tabindex: "0", role: "button"},
	});
	// HTML img supports a per-image referrer policy; SVG image does not.
	const content = createSvg("foreignObject", {attr: {width: "100%", height: "100%"}});
	content.appendChild(createExternalImageElement(url, label));
	image.appendChild(content);
	return image;
}
