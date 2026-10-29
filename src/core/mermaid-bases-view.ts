import {
	TFile,
	BasesView,
	QueryController,
	MarkdownRenderer,
	type BasesAllOptions,
} from "obsidian";
import {MermaidViewRegistrationData} from "./mermaid-view-registration-data";
import MermaidBaseViews from "../main";
import {COMMON_VIEW_OPTIONS} from "./constants";
import {createNoteFileNameLinks} from "../utils/note-link-label";
import {registerNoteLinkInteractions} from "./note-link-interactions";
import {createFilteredNoteEntry} from "../utils/filtered-note-properties";
import {NotePropertyMedia} from "../utils/note-property-media";

export abstract class MermaidBasesView extends BasesView {
	protected plugin: MermaidBaseViews;
	protected containerEl: HTMLElement;
	private readonly noteFileNames = new Map<string, string[]>();
	private propertyMedia?: NotePropertyMedia;

	abstract registrationData: MermaidViewRegistrationData;

	constructor(controller: QueryController, parentEl: HTMLElement, plugin: MermaidBaseViews) {
		super(controller);
		this.plugin = plugin;
		this.containerEl = parentEl.createDiv("bases-mermaid-view-container");
		plugin.registerMermaidView(this);
		registerNoteLinkInteractions(this, this.app, this.containerEl, plugin.manifest.id,
			() => this.app.workspace.getActiveFile()?.path ?? "");
	}

	public onDataUpdated(): void {
		this.noteFileNames.clear();
		this.propertyMedia?.clear();
		this.containerEl.empty();
		void this.render().catch((error) => {
			console.error("Failed to render Mermaid", error);
			this.containerEl.empty();
			this.containerEl.createDiv({text: "Error rendering Mermaid. See console for details."});
		});
	}

	protected abstract render(): Promise<void>;

	protected async renderMermaid(
		mermaidCode: string,
		viewTypeMermaidConfig: string,
		noteNodes?: ReadonlyMap<string, string>,
		title?: string | null,
	): Promise<void> {
		const directive = this.getConfigValue<string>(COMMON_VIEW_OPTIONS.mermaidConfigOverride.key, "");
		const titleConfig = title == null ? "" : `title: ${JSON.stringify(title)}\n`;
		const configBlock = `---\n${titleConfig}config:\n${this.trimConfig(viewTypeMermaidConfig)}\n---\n${directive}`;

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

		this.propertyMedia?.render(this.containerEl);
		if (noteNodes) {
			for (const [path, nodeId] of noteNodes) {
				this.containerEl.querySelectorAll(`.bases-mermaid-note-${nodeId}`).forEach((node) => {
					this.markNoteLink(node, path);
				});
			}
		}

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

	private trimConfig(config: string): string{
		const configRegex = new RegExp(`(^[-config:]*)|([-]*$)`, 'g');
		return config.replaceAll(configRegex, '');
	}


	protected getLabelWithProperties(file: TFile, showPropertyNames: boolean, newLine: string, colon: string, renderMedia = false): string {
		if (renderMedia)
			this.propertyMedia ??= new NotePropertyMedia(this.app, this, this.containerEl);
		const fileNames: string[] = [];
		this.noteFileNames.set(file.path, fileNames);
		const lines: string[] = [];
		const entry = this.data.data.find((entry) => entry.file.path === file.path)
			?? createFilteredNoteEntry(file, this.data.data[0]);
		for (const property of this.data.properties) {
			const propertyValue = entry?.getValue(property);
			if (!propertyValue)
				continue;
			const formatted = renderMedia && this.propertyMedia
				? this.propertyMedia.format(propertyValue, file, newLine)
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
