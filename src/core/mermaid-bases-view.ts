import {
	TFile,
	BasesView,
	Component,
	QueryController,
	MarkdownRenderer,
	stringifyYaml,
	type BasesAllOptions,
	type BasesEntry,
	type BasesViewConfig,
} from "obsidian";
import {MermaidViewRegistrationData} from "./mermaid-view-registration-data";
import MermaidBaseViews from "../main";
import {COMMON_VIEW_OPTIONS} from "../view-options/common-options";
import {createNoteFileNameLinks} from "../links/note-filename-links";
import {registerNoteLinkInteractions} from "../links/note-link-interactions";
import {createFilteredNoteEntry} from "../links/filtered-note-entry";
import {NotePropertyMedia} from "../media/note-property-media";
import {parseMermaidConfig} from "./mermaid-config";

export abstract class MermaidBasesView extends BasesView {
	protected plugin: MermaidBaseViews;
	protected containerEl: HTMLElement;
	private readonly entriesByPath = new Map<string, BasesEntry>();
	private readonly noteFileNames = new Map<string, string[]>();
	private propertyMedia?: NotePropertyMedia;
	private renderComponent?: Component;
	private unloaded = false;

	abstract registrationData: MermaidViewRegistrationData;

	constructor(controller: QueryController, parentEl: HTMLElement, plugin: MermaidBaseViews) {
		super(controller);
		this.plugin = plugin;
		this.containerEl = parentEl.createDiv("bases-mermaid-view-container");
		plugin.registerMermaidView(this);
		registerNoteLinkInteractions(this, this.app, this.containerEl, plugin.manifest.id,
			() => this.app.workspace.getActiveFile()?.path ?? "");
		this.register(() => {
			this.unloaded = true;
			this.clearRender();
			this.containerEl.empty();
		});
	}

	public onDataUpdated(): void {
		if (this.unloaded)
			return;
		this.clearRender();
		const component = this.addChild(new Component());
		this.renderComponent = component;
		this.entriesByPath.clear();
		for (const entry of this.data.data) {
			const path = entry.file.path;
			if (!this.entriesByPath.has(path))
				this.entriesByPath.set(path, entry);
		}
		this.noteFileNames.clear();
		this.propertyMedia?.clear();
		this.containerEl.empty();
		void this.render().catch((error) => {
			if (this.renderComponent !== component)
				return;
			console.error("Failed to render Mermaid", error);
			this.clearRender();
			this.containerEl.empty();
			this.containerEl.createDiv({text: "Error rendering Mermaid. See console for details."});
		});
	}

	private clearRender(): void {
		const component = this.renderComponent;
		this.renderComponent = undefined;
		if (component)
			this.removeChild(component);
	}

	protected abstract render(): Promise<void>;

	protected async renderMermaid(
		mermaidCode: string,
		viewTypeMermaidConfig: string,
		noteNodes?: ReadonlyMap<string, string>,
		title?: string | null,
	): Promise<HTMLElement | null> {
		const component = this.renderComponent;
		if (!component)
			return null;
		const directive = this.getConfigValue<string>(COMMON_VIEW_OPTIONS.mermaidConfigOverride.key, "");
		const frontmatter = stringifyYaml({
			...(title == null ? {} : {title}),
			config: parseMermaidConfig(viewTypeMermaidConfig),
		});
		const configBlock = `---\n${frontmatter}---\n${directive}`;
		mermaidCode = `${configBlock}\n${mermaidCode.trim()}`;

		const markdown: string = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;

		const sourcePath = this.app.workspace.getActiveFile()?.path ?? "";
		const container = this.containerEl.createDiv();

		await MarkdownRenderer.render(
			this.app,
			markdown,
			container,
			sourcePath,
			component
		);

		if (this.renderComponent !== component)
			return null;
		this.propertyMedia?.render(container);
		if (noteNodes) {
			for (const [path, nodeId] of noteNodes) {
				container.querySelectorAll(`.bases-mermaid-note-${nodeId}`).forEach((node) => {
					this.markNoteLink(node, path);
				});
			}
		}

		return container;
	}

	protected markNoteLink(node: Element, path: string, fileNames = this.noteFileNames.get(path) ?? []): void {
		if (fileNames.length > 0) {
			let labelNode = node;
			while (!labelNode.matches("text, foreignObject") && !labelNode.querySelector("text, foreignObject")) {
				const parent = labelNode.parentElement;
				if (!parent || parent === this.containerEl || parent.localName === "svg")
					break;
				labelNode = parent;
			}
			createNoteFileNameLinks(labelNode, fileNames, path);
			return;
		}
		node.classList.add("bases-mermaid-note-link");
		node.setAttribute("data-href", path);
		node.setAttribute("role", "link");
		node.setAttribute("tabindex", "0");
	}

	protected markOrderedNoteLinks(selector: string, paths: readonly string[], reversed = false): void {
		const nodes = Array.from(this.containerEl.querySelectorAll(selector));
		if (nodes.length !== paths.length)
			return;
		if (reversed)
			nodes.reverse();
		nodes.forEach((node, index) => {
			const path = paths[index];
			if (path !== undefined)
				this.markNoteLink(node, path);
		});
	}

	protected getLabelWithProperties(file: TFile, showPropertyNames: boolean, newLine: string, colon: string, renderMedia = false): string {
		const media = renderMedia ? this.getPropertyMedia() : null;
		const fileNames: string[] = [];
		this.noteFileNames.set(file.path, fileNames);
		const lines: string[] = [];
		const entry = this.entriesByPath.get(file.path)
			?? createFilteredNoteEntry(file, this.data.data[0]);
		for (const property of this.data.properties) {
			const propertyValue = entry?.getValue(property);
			if (!propertyValue)
				continue;
			const formatted = media
				? media.format(propertyValue, file, newLine)
				: {text: propertyValue.toString(), block: false};
			const value = formatted.text;
			const isFileName = property === "file.name" || property === "file.basename";
			if (isFileName)
				fileNames.push(value);
			lines.push(showPropertyNames && !isFileName
				? `${this.config.getDisplayName(property)}${colon}${formatted.block ? newLine : " "}${value}`
				: value);
		}
		const label = lines.join(newLine);
		if (label !== "")
			return label;
		fileNames.push(file.basename);
		return file.basename;
	};

	protected getPropertyMedia(): NotePropertyMedia {
		return this.propertyMedia ??= new NotePropertyMedia(this.app, this, this.containerEl);
	}

	protected getOptionalTitle(key: string = COMMON_VIEW_OPTIONS.title.key): string | null {
		const rawValue = this.config.get(key);
		const title = typeof rawValue === "string" ? rawValue : "";

		if (title.length === 0)
			return this.config.name;
		if (title.trim().length === 0)
			return null;
		return title;
	}

	protected getConfigValue<T>(key: string, defaultValue?: T): T {
		if (defaultValue === null || defaultValue === undefined)
			defaultValue = this.getConfigDefaultValue<T>(key);
		const rawValue = this.config.get(key);

		if (rawValue === null || rawValue === undefined)
			return defaultValue;

		if (typeof defaultValue === "string") {
			const value = rawValue as string;
			if (value.length > 0)
				return rawValue as T;
			return defaultValue;
		}

		if (typeof defaultValue === "boolean") {
			if (typeof rawValue === "boolean")
				return rawValue as unknown as T;
			return defaultValue;
		}

		if (Array.isArray(defaultValue)) {
			if (Array.isArray(rawValue))
				return rawValue as unknown as T;
			return defaultValue;
		}

		return rawValue as T;
	}

	private getConfigDefaultValue<T>(key: string): T {
		const options = this.findConfigOptionWithDefault<T>(this.registrationData.getOptions(this.plugin), key);

		if (!options || options.default === undefined)
			throw new Error(`No default configured for key "${key}".`);

		return options.default;
	}

	private findConfigOptionWithDefault<T>(
		options: BasesAllOptions[],
		key: string,
	): { default?: T } | undefined {
		for (const option of options) {
			if ("key" in option && option.key === key)
				return option as { default?: T };

			if (option.type === "group") {
				const nestedOption = this.findConfigOptionWithDefault<T>(option.items, key);
				if (nestedOption)
					return nestedOption;
			}
		}

		return undefined;
	}

	protected hasGrouping(): boolean {
		const config = this.config as BasesViewConfig & {groupBy?: unknown};
		const groups = this.data.groupedData;
		return config.groupBy != null || config.get("groupBy") != null
			|| groups.length > 1 || groups.some((group) => group.hasKey());
	}

	protected collectBaseFilesByPath(): Map<string, TFile> {
		const fileByPath = new Map<string, TFile>();

		for (const group of this.data.groupedData) {
			if (!group)
				continue;

			for (const entry of group.entries) {
				if (!entry.file)
					continue;

				if (!fileByPath.has(entry.file.path))
					fileByPath.set(entry.file.path, entry.file);
			}
		}

		return fileByPath;
	}

	protected shouldShowLinkedTarget(
		target: TFile,
		baseFilesByPath: Map<string, TFile>,
		showLinksToFilteredOutNotes: boolean,
	): boolean {
		return showLinksToFilteredOutNotes || baseFilesByPath.has(target.path);
	}

	protected getLinkedFileIfVisible(
		linkpath: string,
		sourcePath: string,
		baseFilesByPath: Map<string, TFile>,
		showLinksToFilteredOutNotes: boolean,
	): TFile | null {
		const target = this.app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
		if (!target)
			return null;

		if (!this.shouldShowLinkedTarget(target, baseFilesByPath, showLinksToFilteredOutNotes))
			return null;

		return target;
	}
}
