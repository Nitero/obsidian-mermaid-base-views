import {App, PluginSettingTab, Setting, type SettingDefinition, type SettingDefinitionItem} from "obsidian";
import MermaidBaseViews from "../main";
import {DEFAULT_CONFIG, DEFAULT_SETTINGS, MermaidBaseViewsSettings} from "./mermaidBaseViewsSettings";

type SettingKey = keyof MermaidBaseViewsSettings;
type StringSettingKey = {
	[K in SettingKey]: MermaidBaseViewsSettings[K] extends string ? K : never;
}[SettingKey];
type NumberSettingKey = {
	[K in SettingKey]: MermaidBaseViewsSettings[K] extends number ? K : never;
}[SettingKey];

export class GeneralSettingTab extends PluginSettingTab {
	plugin: MermaidBaseViews;

	constructor(app: App, plugin: MermaidBaseViews) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (!this.isSettingKey(key))
			return;

		(this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
		await this.plugin.saveSettings();
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			this.createGeneralSettingsPage(),
			this.createChartOverrideSettingsPage(),
		];
	}

	private createGeneralSettingsPage(): SettingDefinitionItem {
		return {
			type: "page",
			name: "General",
			desc: "Shared Mermaid configuration and grouping colors.",
			items: [
				this.createMermaidConfigSetting(
					"General mermaid config",
					"The default frontmatter configuration for everything. Can be used to e.g. set a theme.",
					"generalMermaidConfig",
					DEFAULT_CONFIG,
				),
				this.createGroupingPaletteList(),
			],
		};
	}

	private createChartOverrideSettingsPage(): SettingDefinitionItem {
		return {
			type: "page",
			name: "Chart overrides",
			desc: "Chart-specific Mermaid config and result limits.",
			items: [
				this.createChartConfigGroup("Flowchart", "flowchartMermaidConfig", "flowchartResultLimit"),
				this.createChartConfigGroup("Mindmap", "mindmapMermaidConfig", "mindmapResultLimit"),
				this.createChartConfigGroup("Timeline", "timelineMermaidConfig", "timelineResultLimit"),
				this.createChartConfigGroup("Sankey", "sankeyMermaidConfig"),
				this.createChartConfigGroup("Pie chart", "pieChartMermaidConfig"),
				this.createChartConfigGroup("XY chart", "XYChartMermaidConfig"),
				this.createChartConfigGroup("Quadrant chart", "quadrantChartMermaidConfig"),
				this.createChartConfigGroup("Radar chart", "radarChartMermaidConfig"),
			],
		};
	}

	private createChartConfigGroup(
		heading: string,
		mermaidConfigKey: StringSettingKey,
		resultLimitKey?: NumberSettingKey,
	): SettingDefinitionItem {
		return {
			type: "group",
			heading,
			items: [
				this.createMermaidConfigSetting(
					"Mermaid config",
					`The default frontmatter configuration for every ${heading.toLowerCase()} view.`,
					mermaidConfigKey,
					DEFAULT_SETTINGS[mermaidConfigKey],
				),
				...(resultLimitKey ? [
					this.createResultLimitSetting(resultLimitKey),
				] : []),
			],
		};
	}

	private createMermaidConfigSetting(
		name: string,
		desc: string,
		key: StringSettingKey,
		defaultValue: string,
	): SettingDefinition {
		return {
			name,
			desc,
			control: {
				type: "textarea",
				key,
				defaultValue,
				placeholder: "config:\n  theme: 'forest'",
				rows: 4,
			},
		};
	}

	private createResultLimitSetting(key: NumberSettingKey): SettingDefinition {
		return {
			name: "Result limit",
			desc: "The maximum amount of entries to display. Needed because this view type is performance heavy.",
			control: {
				type: "slider",
				key,
				defaultValue: DEFAULT_SETTINGS[key],
				min: 50,
				max: 1000,
				step: 50,
			},
		};
	}

	private createGroupingPaletteList(): SettingDefinitionItem {
		const palette = this.plugin.settings.defaultGroupingPalette;

		return {
			type: "list",
			heading: "Grouping color palette",
			emptyState: "No colors groups defined.",
			addItem: {
				name: "Add color",
				action: () => {
					void this.addPaletteColor(palette);
				},
			},
			onReorder: (oldIndex: number, newIndex: number) => {
				void this.reorderPaletteColor(palette, oldIndex, newIndex);
			},
			onDelete: (idx: number) => {
				void this.deletePaletteColor(palette, idx);
			},
			items: palette.map((colorValue, index) => ({
				name: `Group ${index + 1}`,
				searchable: false,
				render: (setting: Setting) => {
					setting.addColorPicker(color => color
						.setValue(colorValue)
						.onChange(async (value) => {
							this.plugin.settings.defaultGroupingPalette[index] = value;
							await this.plugin.saveSettings();
						}),
					);
				},
			})),
		};
	}

	private isSettingKey(key: string): key is SettingKey {
		return key in DEFAULT_SETTINGS;
	}

	private async addPaletteColor(palette: string[]) {
		palette.push("#ffffff");
		await this.plugin.saveSettings();
		this.update();
	}

	private async reorderPaletteColor(palette: string[], oldIndex: number, newIndex: number) {
		const [moved] = palette.splice(oldIndex, 1);
		if (moved === undefined)
			return;

		palette.splice(newIndex, 0, moved);
		await this.plugin.saveSettings();
		this.update();
	}

	private async deletePaletteColor(palette: string[], index: number) {
		palette.splice(index, 1);
		await this.plugin.saveSettings();
		this.update();
	}
}
