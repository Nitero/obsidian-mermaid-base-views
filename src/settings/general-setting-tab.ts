import {App, PluginSettingTab, type SettingDefinition} from "obsidian";
import MermaidBaseViews from "../main";
import {DEFAULT_SETTINGS, MermaidBaseViewsSettings} from "./mermaid-base-views-settings";
import {MERMAID_CONFIG_EXAMPLES} from "../view-options/mermaid-config-examples";

export class GeneralSettingTab extends PluginSettingTab {
	plugin: MermaidBaseViews;

	constructor(app: App, plugin: MermaidBaseViews) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)
			|| typeof value !== typeof DEFAULT_SETTINGS[key as keyof MermaidBaseViewsSettings])
			return;
		Object.assign(this.plugin.settings, {[key]: value});
		await this.plugin.saveSettings();
	}

	getSettingDefinitions(): SettingDefinition[] {
		return [
			{
				name: "Allow external images",
				desc: "Load HTTP(S) images from properties and formulas. Image hosts receive your IP address and the URL. Cookies and referrers are omitted. Hosts must allow cross-origin image requests.",
				control: {type: "toggle", key: "allowExternalImages", defaultValue: DEFAULT_SETTINGS.allowExternalImages},
			},
			this.createConfigSetting("Flowchart", "flowchartMermaidConfig", "flowchart"),
			this.createConfigSetting("Mindmap", "mindmapMermaidConfig", "mindmap"),
			this.createConfigSetting("Tree view", "treeViewMermaidConfig", "treeView"),
			this.createConfigSetting("Timeline", "timelineMermaidConfig", "timeline"),
			this.createConfigSetting("Gantt", "ganttMermaidConfig", "gantt"),
			this.createConfigSetting("Sankey", "sankeyMermaidConfig", "sankey"),
			this.createConfigSetting("Pie chart", "pieChartMermaidConfig", "pie"),
			this.createConfigSetting("XY chart", "XYChartMermaidConfig", "xyChart"),
			this.createConfigSetting("Quadrant chart", "quadrantChartMermaidConfig", "quadrantChart"),
			this.createConfigSetting("Radar chart", "radarChartMermaidConfig", "radar"),
		];
	}

	private createConfigSetting(
		name: string,
		key: Exclude<keyof MermaidBaseViewsSettings, "allowExternalImages">,
		exampleKey: keyof typeof MERMAID_CONFIG_EXAMPLES,
	): SettingDefinition {
		return {
			name: `${name} mermaid config`,
			desc: `Default frontmatter configuration for ${name.toLowerCase()} views. Individual bases can override it.`,
			control: {
				type: "textarea",
				key,
				defaultValue: DEFAULT_SETTINGS[key],
				placeholder: MERMAID_CONFIG_EXAMPLES[exampleKey].frontmatter,
				rows: 4,
			},
		};
	}
}
