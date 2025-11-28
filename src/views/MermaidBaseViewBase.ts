import {
	TFile,
	BasesView,
	QueryController,
	MarkdownRenderer,
	parsePropertyId,
	Keymap, Menu, Notice,
} from "obsidian";

export abstract class MermaidBaseViewBase extends BasesView {
	protected containerEl: HTMLElement;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = parentEl.createDiv("base-mermaid-view");
	}

	public onDataUpdated(): void {
		this.containerEl.empty();
		this.render().catch((error) => {
			console.error("Failed to render Mermaid", error);
			this.containerEl.empty();
			this.containerEl.createDiv({text: "Error rendering Mermaid. See console for details."});
		});
	}

	protected abstract render(): Promise<void>;

	protected async renderMermaid(mermaidCode: string): Promise<void> {
		const configBlock = this.getConfigValue("mermaidConfig", "");

		mermaidCode = mermaidCode.trim();
		if (configBlock.length > 0)
			mermaidCode = `${configBlock}\n${mermaidCode}`;

		const markdown: string = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;

		const sourcePath = this.app.workspace.getActiveFile()?.path ?? "";

		await MarkdownRenderer.render(
			this.app,
			markdown,
			this.containerEl,
			sourcePath,
			this
		);

		this.hookUpInternalLinks(this.containerEl, sourcePath);
	}

	protected hookUpInternalLinks(containerEl: HTMLElement, sourcePath: string) {

		containerEl
			.querySelectorAll<HTMLAnchorElement>("a.internal-link")
			.forEach((el) => {
				const getLinkText = () => el.getAttribute("data-href") || el.getAttribute("href");

				// Hover preview
				this.registerDomEvent(el, "mouseover", (evt: MouseEvent) => {
					const linkText = getLinkText();
					if (!linkText)
						return;

					this.app.workspace.trigger("hover-link", {
						event: evt,
						source: "preview",
						hoverParent: {hoverPopover: null},
						targetEl: el,
						linktext: linkText,
						sourcePath,
					});
				});

				// Left click
				this.registerDomEvent(el, "click", (evt: MouseEvent) => {
					if (evt.button !== 0)
						return;

					const linkText = getLinkText();
					if (!linkText)
						return;

					evt.preventDefault();

					this.app.workspace.openLinkText(
						linkText,
						sourcePath,
						Keymap.isModEvent(evt)
					);
				});

				// Middle click
				this.registerDomEvent(el, "auxclick", (evt: MouseEvent) => {
					if (evt.button !== 1)
						return;

					const linkText = getLinkText();
					if (!linkText)
						return;

					evt.preventDefault();
					this.app.workspace.openLinkText(linkText, sourcePath, "tab");
				});

				// Right click
				this.registerDomEvent(el, "contextmenu", async (evt: MouseEvent) => {
					const linkText = getLinkText();
					if (!linkText)
						return;

					evt.preventDefault();
					evt.stopPropagation();

					const file = this.app.metadataCache.getFirstLinkpathDest(linkText, sourcePath);
					if (!file) {
						new Notice(`File not found for link: ${linkText}`);
						return;
					}

					const menu = new Menu();
					menu.addItem((item) =>
						item
							.setTitle("Open in new tab")
							.setIcon("file-plus")
							.setSection("open")
							.onClick(() => {
								this.app.workspace.openLinkText(linkText, sourcePath, "tab");
							}),
					);
					menu.addItem((item) =>
						item
							.setTitle("Open to the right")
							.setIcon("separator-vertical")
							.setSection("open")
							.onClick(() => {
								this.app.workspace.openLinkText(linkText, sourcePath, "split");
							}),
					);
					menu.addItem((item) =>
						item
							.setTitle("Rename...")
							.setIcon("pencil-line")
							.setSection("action")
							.onClick(() => {
								this.app.workspace.trigger("rename", file);//TODO: fix this not working (why have to reimplement it anyways?)
							}),
					);

					//TODO: add "Copy - copy" that copies not name to section "clipboard"
					//TODO: remove merge entire file with...

					this.app.workspace.trigger("file-menu", menu, file);
					menu.showAtMouseEvent(evt);
				});
			});
	}

	protected getLabelWithProperties(file: TFile, showPropertyNames: Boolean, newLine: string, colon: string): string {
		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {

				if (entry.file != file)
					continue;

				let label = "";
				let isFirst = true;

				for (const property of this.data.properties) {
					const value = entry.getValue(property);
					if (!value)
						continue;

					if (isFirst)
						isFirst = false;
					else
						label += newLine;

					if (showPropertyNames && property != "file.name" && property != "file.basename")
						label += `${parsePropertyId(property).name}${colon} `;
					label += value;
				}

				if (label == "")
					return file.basename;
				else
					return label;
			}
		}
		return file.basename;
	};

	protected getConfigValue<T>(key: string, defaultValue: T): T {
		const rawValue = this.config.get(key);

		if (rawValue === null || rawValue === undefined)
			return defaultValue;

		if (typeof defaultValue === "string") {
			if (typeof rawValue !== "string")
				return defaultValue;

			const value = rawValue;
			if (value.length === 0)
				return defaultValue;
			return (value as unknown) as T;
		}

		if (typeof defaultValue === "boolean")
			return (typeof rawValue === "boolean" ? (rawValue as unknown) : defaultValue) as T;

		if (Array.isArray(defaultValue))
			return (Array.isArray(rawValue) ? ((rawValue as unknown) as T) : defaultValue) as T;

		return (rawValue as T) ?? defaultValue;
	}
}
