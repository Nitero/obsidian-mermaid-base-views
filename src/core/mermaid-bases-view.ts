import {
	TFile,
	BasesView,
	Component,
	QueryController,
	MarkdownRenderer,
	stringifyYaml,
	type BasesEntry,
	type BasesEntryGroup,
	type BasesViewConfig,
} from "obsidian";
import {MermaidViewRegistrationData} from "./mermaid-view-registration-data";
import MermaidBaseViews from "../main";
import {COMMON_VIEW_OPTIONS} from "../view-options/common-options";
import {createNoteFileNameLinks, type NoteLabel} from "../links/note-filename-links";
import {createGroupNoteLinks} from "../links/group-note-links";
import {registerNoteLinkInteractions} from "../links/note-link-interactions";
import {createFilteredNoteEntry} from "../links/filtered-note-entry";
import {includeFilteredNoteGroups} from "../links/filtered-note-groups";
import {NotePropertyMedia} from "../media/note-property-media";
import {parseMermaidConfig} from "./mermaid-config";
import {findConfigOption, readBooleanConfig, readDropdownConfig, readGroupingProperty, readStringConfig, readStringListConfig} from "./view-config";
import {parseFiniteNumber} from "../utils/numeric-values";
import {registerRenderObservers} from "../ui/render-observers";

interface MermaidRenderOptions {
	noteNodes?: ReadonlyMap<string, string>;
	title?: string | null;
	enhance?: (container: HTMLElement) => void;
}

export abstract class MermaidBasesView extends BasesView {
	protected plugin: MermaidBaseViews;
	protected containerEl: HTMLElement;
	private readonly entriesByPath = new Map<string, BasesEntry>();
	private readonly noteLabels = new Map<string, NoteLabel>();
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
		this.noteLabels.clear();
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
		{noteNodes, title, enhance}: MermaidRenderOptions = {},
	): Promise<HTMLElement | null> {
		const component = this.renderComponent;
		if (!component)
			return null;
		const directive = this.getStringConfig(COMMON_VIEW_OPTIONS.mermaidConfigOverride.key, "");
		const frontmatter = stringifyYaml({
			...(title == null ? {} : {title}),
			config: parseMermaidConfig(viewTypeMermaidConfig),
		});
		const configBlock = `---\n${frontmatter}---\n${directive}`;
		mermaidCode = `${configBlock}\n${mermaidCode.trim()}`;

		let fenceLength = 3;
		for (const match of mermaidCode.matchAll(/`+/g))
			fenceLength = Math.max(fenceLength, match[0].length + 1);
		const fence = "`".repeat(fenceLength);
		const markdown = `${fence}mermaid\n${mermaidCode}\n${fence}`;

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
		const enhanceDiagram = () => {
			if (this.renderComponent !== component)
				return;
			this.propertyMedia?.render(container);
			if (noteNodes) {
				for (const [path, nodeId] of noteNodes) {
					container.querySelectorAll(`.bases-mermaid-note-${nodeId}`).forEach((node) => {
						this.markNoteLink(node, path);
					});
				}
			}
			enhance?.(container);
		};
		// Pele can mount later in hidden panes and replace the SVG on resize or theme changes.
		registerRenderObservers(component, container, enhanceDiagram);
		enhanceDiagram();

		return container;
	}

	protected markNoteLink(node: Element, path: string, label: NoteLabel | null | undefined = this.noteLabels.get(path)): void {
		if (label && label.fileNameRanges.length > 0) {
			let labelNode = node;
			while (!labelNode.matches("text, foreignObject") && !labelNode.querySelector("text, foreignObject")) {
				const parent = labelNode.parentElement;
				if (!parent || parent === this.containerEl || parent.localName === "svg")
					break;
				labelNode = parent;
			}
			createNoteFileNameLinks(labelNode, label, path);
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

	protected markGroupNoteLinks(node: Element, group: BasesEntryGroup): void {
		createGroupNoteLinks(this.app, node, group);
	}

	protected markOrderedGroupNoteLinks(selector: string, groups: readonly BasesEntryGroup[]): void {
		const nodes = this.containerEl.querySelectorAll(selector);
		if (nodes.length !== groups.length)
			return;
		nodes.forEach((node, index) => {
			const group = groups[index];
			if (group)
				this.markGroupNoteLinks(node, group);
		});
	}

	protected getLabelWithProperties(file: TFile, showPropertyNames: boolean, newLine: string, colon: string, renderMedia = false): string {
		const media = renderMedia ? this.getPropertyMedia() : null;
		const fileNameRanges: {start: number; end: number}[] = [];
		const lines: string[] = [];
		let labelLength = 0;
		const entry = this.getEntry(file);
		for (const property of this.data.properties) {
			const propertyValue = entry?.getValue(property);
			if (!propertyValue)
				continue;
			const formatted = media
				? media.format(propertyValue, file, newLine)
				: {text: propertyValue.toString(), block: false};
			const value = formatted.text;
			const isFileName = property === "file.name" || property === "file.basename";
			if (isFileName && value.length > 0)
				fileNameRanges.push({start: labelLength, end: labelLength + value.length});
			const line = showPropertyNames && !isFileName
				? `${this.config.getDisplayName(property)}${colon}${formatted.block ? newLine : " "}${value}`
				: value;
			lines.push(line);
			labelLength += line.length + newLine.length;
		}
		let text = lines.join(newLine);
		if (text === "") {
			text = file.basename;
			fileNameRanges.push({start: 0, end: text.length});
		}
		this.noteLabels.set(file.path, {text, fileNameRanges});
		return text;
	};

	private getEntry(file: TFile): BasesEntry | null {
		const entry = this.entriesByPath.get(file.path)
			?? createFilteredNoteEntry(file, this.data.data[0]);
		if (entry)
			this.entriesByPath.set(file.path, entry);
		return entry;
	}

	protected getGroupsWithFilteredNotes(files: Iterable<TFile>): readonly BasesEntryGroup[] {
		return includeFilteredNoteGroups(
			this.data.groupedData, files, readGroupingProperty(this.config), (file) => this.getEntry(file),
		);
	}

	protected getPropertyMedia(): NotePropertyMedia {
		return this.propertyMedia ??= new NotePropertyMedia(this.app, this, this.containerEl,
			() => this.plugin.settings.allowExternalImages === true);
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

	protected getStringConfig(key: string, defaultValue?: string): string {
		return readStringConfig(this.config.get(key), defaultValue ?? this.getConfigDefaultValue(key));
	}

	protected getBooleanConfig(key: string, defaultValue?: boolean): boolean {
		return readBooleanConfig(this.config.get(key), defaultValue ?? this.getConfigDefaultValue(key));
	}

	protected getStringListConfig(key: string, defaultValue?: string[]): string[] {
		return readStringListConfig(this.config.get(key), defaultValue ?? this.getConfigDefaultValue(key));
	}

	protected getDropdownConfig<Choice extends string>(key: string, choices: Record<Choice, string>): Choice {
		return readDropdownConfig(this.config.get(key), choices, this.getConfigDefaultValue(key));
	}

	protected getNumberConfig(key: string): number | null {
		return parseFiniteNumber(this.getStringConfig(key, ""));
	}

	private getConfigDefaultValue(key: string): unknown {
		const option = findConfigOption(this.registrationData.getOptions(), key);
		if (!option || !("default" in option) || option.default === undefined)
			throw new Error(`No default configured for key "${key}".`);
		return option.default;
	}

	protected hasGrouping(): boolean {
		const config = this.config as BasesViewConfig & {groupBy?: unknown};
		const groups = this.data.groupedData;
		return config.groupBy != null || config.get("groupBy") != null
			|| groups.length > 1 || groups.some((group) => group.hasKey());
	}
}
