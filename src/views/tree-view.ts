import {
	normalizePath, parseYaml, stringifyYaml, type BasesViewConfig, type QueryController,
} from "obsidian";
import MermaidBaseViews from "../main";
import {COMMON_VIEW_OPTIONS, NOTE_LABEL_OPTIONS} from "../core/constants";
import {MermaidBasesView} from "../core/mermaid-bases-view";
import {MERMAID_CONFIG_EXAMPLES} from "../core/mermaid-config-examples";
import {type MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {buildFolderTree, buildGroupedTree} from "../utils/tree-view-tree";
import {buildTreeViewCode, type TreeViewNoteRow} from "../utils/tree-view-code";
import {registerRenderObservers} from "../utils/render-observers";
import {TreeViewFoldState} from "../utils/tree-view-fold-state";
import {TreeViewFolding} from "../ui/tree-view-folding";
import {InferredPropertyType} from "../propertyTypes/inferred-property-type";
import {createNoteMedia} from "../utils/note-media";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class TreeView extends MermaidBasesView {
	readonly type = TreeView.RegistrationData.id;
	readonly registrationData = TreeView.RegistrationData;
	private noteRows: readonly TreeViewNoteRow[] = [];
	private readonly foldState: TreeViewFoldState;
	private readonly folding: TreeViewFolding;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-tree-view",
		name: "Tree view",
		icon: "list-tree",
		getOptions: (plugin: MermaidBaseViews) => [
			{type: "text", ...COMMON_VIEW_OPTIONS.title},
			{
				type: "folder",
				displayName: "Root folder (optional)",
				key: "rootFolder",
				default: "",
				placeholder: "Vault root",
			},
			{
				type: "property",
				...COMMON_VIEW_OPTIONS.iconProperty,
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.String, InferredPropertyType.List),
			},
			{
				type: "property",
				displayName: "Highlight property (optional)",
				key: "highlightProperty",
				placeholder: "Boolean property or formula",
				filter: plugin.propertyTypes.createSourceFilter("note", "formula"),
			},
			{
				type: "toggle",
				displayName: "Show file/folder icons",
				key: "showIcons",
				default: false,
			},
			...NOTE_LABEL_OPTIONS,
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.treeView.directive,
			},
		],
	};

	constructor(controller: QueryController, parentEl: HTMLElement, plugin: MermaidBaseViews) {
		super(controller, parentEl, plugin);
		this.foldState = new TreeViewFoldState(controller);
		this.folding = new TreeViewFolding(this, this.containerEl, (branch) => {
			this.foldState.toggle(branch);
			this.onDataUpdated();
		});
		this.register(() => {
			this.containerEl.empty();
		});
		registerRenderObservers(this, this.containerEl, () => this.enhanceDiagram());
	}

	protected async render(): Promise<void> {
		const target = this.containerEl.createDiv();
		this.noteRows = [];
		this.folding.setRows([]);
		const rootPath = normalizePath(this.getConfigValue<string>("rootFolder"));
		const root = !rootPath || rootPath === "/"
			? this.app.vault.getRoot() : this.app.vault.getFolderByPath(rootPath);
		if (!root) {
			target.createDiv({text: "Root folder not found. Select an existing folder in the view settings."});
			return;
		}
		const groups = this.data.groupedData;
		const nativeConfig = this.config as BasesViewConfig & {groupBy?: unknown};
		const hasGrouping = nativeConfig.groupBy != null;
		const roots = hasGrouping
			? buildGroupedTree(groups, root)
			: [buildFolderTree(this.data.data, root, this.app.vault.getName())];
		if (!roots.some((branch) => branch.children.length > 0)) {
			target.createDiv({text: "No files found in this base within the root folder."});
			return;
		}
		const media = this.getPropertyMedia();
		const {code, rows, branches} = buildTreeViewCode(roots, {
			properties: this.data.properties,
			showPropertyNames: this.getConfigValue<boolean>(COMMON_VIEW_OPTIONS.showPropertyNames.key),
			getDisplayName: (property) => this.config.getDisplayName(property),
			formatValue: (value, file) => media.format(value, file, " ").text,
			highlightProperty: this.config.getAsPropertyId("highlightProperty"),
			iconProperty: this.config.getAsPropertyId(COMMON_VIEW_OPTIONS.iconProperty.key),
			isCollapsed: (branch) => this.foldState.isCollapsed(branch),
		});
		this.noteRows = rows;
		this.folding.setRows(branches);
		try {
			await this.renderMermaid(code, this.getMermaidConfig(), undefined, this.getOptionalTitle(), target);
		} catch (error) {
			if (target.parentElement === this.containerEl)
				throw error;
		}
		if (target.parentElement === this.containerEl)
			this.enhanceDiagram();
	}

	private enhanceDiagram(): void {
		this.hookUpNoteLinks();
		this.folding.render();
	}

	private getMermaidConfig(): string {
		const frontmatter: unknown = parseYaml(this.plugin.settings.treeViewMermaidConfig);
		const config = isRecord(frontmatter) && isRecord(frontmatter.config) ? frontmatter.config : {};
		const treeView = isRecord(config.treeView) ? config.treeView : {};
		return stringifyYaml({config: {
			...config,
			treeView: {...treeView, showIcons: this.getConfigValue<boolean>("showIcons")},
		}});
	}

	private hookUpNoteLinks(): void {
		const nodes = this.containerEl.querySelectorAll(".pele-tree-file");
		if (nodes.length !== this.noteRows.length)
			return;
		nodes.forEach((node, index) => {
			const row = this.noteRows[index];
			if (!row)
				return;
			this.renderIcon(node, row);
			const labels = Array.from(node.children).filter((child) => child.classList.contains("pele-label"));
			const firstLabel = labels[0];
			if (!firstLabel)
				return;
			const link = createSvg("a", {
				attr: {href: row.path, "aria-label": row.label},
			});
			link.classList.add("bases-mermaid-file-name", "bases-mermaid-file-name-link");
			this.markNoteLink(link, row.path, []);
			node.insertBefore(link, firstLabel);
			for (const label of labels)
				link.appendChild(label);
		});
	}

	private renderIcon(node: Element, row: TreeViewNoteRow): void {
		if (!row.media)
			return;
		const icon = node.querySelector<SVGSVGElement>(":scope > .pele-icon");
		if (!icon || icon.classList.contains("bases-mermaid-tree-icon"))
			return;
		const media = createNoteMedia(this.app, row.media, row.path);
		if (!media)
			return;
		media.classList.remove("svg-icon");
		media.classList.add("pele-icon", "bases-mermaid-tree-icon");
		for (const attribute of ["x", "y", "width", "height"])
			media.setAttribute(attribute, icon.getAttribute(attribute) ?? "0");
		media.setAttribute("preserveAspectRatio", "xMidYMid meet");
		if (row.media.type === "icon") {
			this.markNoteLink(media, row.path, []);
			media.setAttribute("aria-label", row.label);
		}
		icon.replaceWith(media);
	}
}
