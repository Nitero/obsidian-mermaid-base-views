import {App, PluginSettingTab, type SettingDefinition} from "obsidian";
import MermaidBaseViews from "../main";
import {DEFAULT_SETTINGS, MermaidBaseViewsSettings} from "./mermaid-vase-views-settings";
import {MERMAID_CONFIG_EXAMPLES} from "../core/mermaid-config-examples";

export class GeneralSettingTab extends PluginSettingTab {
	plugin: MermaidBaseViews;

	constructor(app: App, plugin: MermaidBaseViews) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key) || typeof value !== "string")
			return;
		this.plugin.settings[key as keyof MermaidBaseViewsSettings] = value;
		await this.plugin.saveSettings();
	}

	getSettingDefinitions(): SettingDefinition[] {
		return [
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
		key: keyof MermaidBaseViewsSettings,
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
