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

export abstract class MermaidBasesView extends BasesView {
	protected plugin: MermaidBaseViews;
	protected containerEl: HTMLElement;
	private readonly noteFileNames = new Map<string, string[]>();

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
	): Promise<void> {
		const directive = this.getConfigValue<string>(COMMON_VIEW_OPTIONS.mermaidConfigOverride.key, "");
		const configBlock = `---\nconfig:\n${this.trimConfig(viewTypeMermaidConfig)}\n---\n${directive}`;

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

		if (noteNodes) {
			for (const [path, nodeId] of noteNodes) {
				this.containerEl.querySelectorAll(`.bases-mermaid-note-${nodeId}`).forEach((node) => {
					this.markNoteLink(node, path);
				});
			}
		}

	}

	protected markNoteLink(node: Element, path: string): void {
		const linkCount = createNoteFileNameLinks(node, this.noteFileNames.get(path) ?? [], path,
			this.getConfigValue<boolean>(COMMON_VIEW_OPTIONS.renderFileNameAsLink.key, true));
		if (linkCount > 0)
			return;
		node.classList.add("bases-mermaid-note-link");
		node.setAttribute("data-href", path);
		node.setAttribute("role", "link");
		node.setAttribute("tabindex", "0");
	}

	private trimConfig(config: string): string{
		const configRegex = new RegExp(`(^[-config:]*)|([-]*$)`, 'g');
		return config.replaceAll(configRegex, '');
	}


	protected getLabelWithProperties(file: TFile, showPropertyNames: boolean, newLine: string, colon: string): string {
		const fileNames: string[] = [];
		this.noteFileNames.set(file.path, fileNames);
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
						label += `${this.config.getDisplayName(property)}${colon} `;
					label += value.toString();
					if (property === "file.name" || property === "file.basename")
						fileNames.push(value.toString());
				}

				if (label == "") {
					fileNames.push(file.basename);
					return file.basename;
				} else
					return label;
			}
		}
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
