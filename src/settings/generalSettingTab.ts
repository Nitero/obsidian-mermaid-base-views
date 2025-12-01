import {App, PluginSettingTab, Setting} from "obsidian";
import MermaidBaseViews from "../../main";
import {DEFAULT_SETTINGS} from "./mermaidBaseViewsSettings";

export class GeneralSettingTab extends PluginSettingTab {
	plugin: MermaidBaseViews;

	private paletteCollapsed: boolean = false;

	constructor(app: App, plugin: MermaidBaseViews) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"General Mermaid Frontmatter Config",
			"The default configuration for everything. Can be used to e.g. set a theme.",
			() => this.plugin.settings.generalMermaidConfig,
			value => {
				this.plugin.settings.generalMermaidConfig = value
			},
			DEFAULT_SETTINGS.generalMermaidConfig
		);

		this.addGroupingColorSettings(containerEl);


		new Setting(containerEl).setName("Flowchart").setHeading();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"Flowchart Mermaid Frontmatter Config",
			"The default configuration for every flowchart view.",
			() => this.plugin.settings.flowchartMermaidConfig,
			value => {
				this.plugin.settings.flowchartMermaidConfig = value
			},
			DEFAULT_SETTINGS.flowchartMermaidConfig
		);

		this.addEntryLimitConfigSetting(
			containerEl,
			"Result Limit",
			"The maximum amount of entries to display. Needed because this view type is performance heavy.",
			() => this.plugin.settings.flowchartResultLimit,
			value => {
				this.plugin.settings.flowchartResultLimit = value
			},
			DEFAULT_SETTINGS.flowchartResultLimit
		);


		new Setting(containerEl).setName("Mindmap").setHeading();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"Mermaid Frontmatter Config",
			"The default configuration for every mindmap view.",
			() => this.plugin.settings.mindmapMermaidConfig,
			value => {
				this.plugin.settings.mindmapMermaidConfig = value
			},
			DEFAULT_SETTINGS.mindmapMermaidConfig
		);

		this.addEntryLimitConfigSetting(
			containerEl,
			"Result Limit",
			"The maximum amount of entries to display. Needed because this view type is performance heavy.",
			() => this.plugin.settings.mindmapResultLimit,
			value => {
				this.plugin.settings.mindmapResultLimit = value
			},
			DEFAULT_SETTINGS.mindmapResultLimit
		);


		new Setting(containerEl).setName("Timeline").setHeading();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"Mermaid Frontmatter Config",
			"The default configuration for every timeline view.",
			() => this.plugin.settings.timelineMermaidConfig,
			value => {
				this.plugin.settings.timelineMermaidConfig = value
			},
			DEFAULT_SETTINGS.timelineMermaidConfig
		);

		this.addEntryLimitConfigSetting(
			containerEl,
			"Result Limit",
			"The maximum amount of entries to display. Needed because this view type is performance heavy.",
			() => this.plugin.settings.timelineResultLimit,
			value => {
				this.plugin.settings.timelineResultLimit = value
			},
			DEFAULT_SETTINGS.timelineResultLimit
		);


		new Setting(containerEl).setName("Sankey").setHeading();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"Mermaid Frontmatter Config",
			"The default configuration for every sankey view.",
			() => this.plugin.settings.sankeyMermaidConfig,
			value => {
				this.plugin.settings.sankeyMermaidConfig = value
			},
			DEFAULT_SETTINGS.sankeyMermaidConfig
		);


		new Setting(containerEl).setName("Pie Chart").setHeading();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"Mermaid Frontmatter Config",
			"The default configuration for every pie chart view.",
			() => this.plugin.settings.pieChartMermaidConfig,
			value => {
				this.plugin.settings.pieChartMermaidConfig = value
			},
			DEFAULT_SETTINGS.pieChartMermaidConfig
		);


		new Setting(containerEl).setName("XY Chart").setHeading();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"Mermaid Frontmatter Config",
			"The default configuration for every XY chart view.",
			() => this.plugin.settings.XYChartMermaidConfig,
			value => {
				this.plugin.settings.XYChartMermaidConfig = value
			},
			DEFAULT_SETTINGS.XYChartMermaidConfig
		);


		new Setting(containerEl).setName("Quadrant Chart").setHeading();

		this.addMermaidFrontmatterConfigSetting(
			containerEl,
			"Mermaid Frontmatter Config",
			"The default configuration for every quadrant chart view.",
			() => this.plugin.settings.quadrantChartMermaidConfig,
			value => {
				this.plugin.settings.quadrantChartMermaidConfig = value
			},
			DEFAULT_SETTINGS.quadrantChartMermaidConfig
		);
	}

	private addMermaidFrontmatterConfigSetting(
		containerEl: HTMLElement,
		name: string,
		description: string,
		getConfigValue: () => string,
		setConfigValue: (value: string) => void | Promise<void>,
		configDefaultValue: string
	) {
		new Setting(containerEl)
			.setName(name)
			.setDesc(description)
			.addTextArea(text => text
				.setPlaceholder(`config:\n  theme: 'forest'`)
				.setValue(getConfigValue())
				.onChange(async (value) => {
					await setConfigValue(value);
					await this.plugin.saveSettings();
				})
			)
			.addExtraButton(button => button
				.setIcon("reset")
				.setTooltip("Reset to default")
				.onClick(async () => {
					await setConfigValue(configDefaultValue);
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}

	private addEntryLimitConfigSetting(
		containerEl: HTMLElement,
		name: string,
		description: string,
		getConfigValue: () => number,
		setConfigValue: (value: number) => void | Promise<void>,
		configDefaultValue: number
	) {
		new Setting(containerEl)
			.setName(name)
			.setDesc(description)
			.addSlider(slider => slider
				.setDynamicTooltip()
				.setLimits(50, 1000, 50)
				.setValue(getConfigValue())
				.onChange(async (value) => {
					await setConfigValue(value);
					await this.plugin.saveSettings();
				})
			)
			.addExtraButton((button) => button
				.setIcon("reset")
				.setTooltip("Reset to default")
				.onClick(async () => {
					await setConfigValue(configDefaultValue);
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}

	private addGroupingColorSettings(containerEl: HTMLElement) {
		const section = containerEl.createDiv();

		const header = new Setting(section)
			.setName("Grouping Color Palette")
			.setDesc("The default palette for coloring files when grouped. If there are more groups than colors it will loop around to the first color.")
			.setHeading();

		const bodyElement = section.createDiv();

		header.addExtraButton(button => button
			.setIcon("reset")
			.setTooltip("Reset to default")
			.onClick(async () => {
				this.plugin.settings.defaultGroupingPalette = [...DEFAULT_SETTINGS.defaultGroupingPalette];
				await this.plugin.saveSettings();
				this.display();
			})
		)
			.addExtraButton(button => {
				const setIconForState = () => {
					button.setIcon(this.paletteCollapsed ? "chevron-right" : "chevron-down");
				};
				setIconForState();

				button.setTooltip("Show / hide section")
					.onClick(() => {
						this.paletteCollapsed = !this.paletteCollapsed;
						setIconForState();
						this.updateGroupingColorSettingsBodyVisibility(bodyElement);
					});
			});

		this.updateGroupingColorSettingsBodyVisibility(bodyElement);
		this.renderGroupingColorSettingsList(bodyElement);
	}

	private updateGroupingColorSettingsBodyVisibility(bodyEl: HTMLElement) {
		bodyEl.style.display = this.paletteCollapsed ? "none" : "";
	}

	private renderGroupingColorSettingsList(bodyElement: HTMLElement) {
		bodyElement.empty();

		const palette = this.plugin.settings.defaultGroupingPalette;
		const listElement = bodyElement.createDiv();

		palette.forEach((colorValue, index) => {
			new Setting(listElement).setName(`Group ${index + 1}`)
				.addColorPicker(color => color
					.setValue(colorValue)
					.onChange(async (value) => {
						this.plugin.settings.defaultGroupingPalette[index] = value;
						await this.plugin.saveSettings();
					})
				)
				.addExtraButton(button => button
					.setIcon("arrow-up")
					.setTooltip("Move up")
					.setDisabled(index === 0)
					.onClick(async () => {
						if (index === 0)
							return;

						const arr = this.plugin.settings.defaultGroupingPalette;
						[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];

						await this.plugin.saveSettings();
						this.renderGroupingColorSettingsList(bodyElement);
					})
				)
				.addExtraButton(button => button
					.setIcon("arrow-down")
					.setTooltip("Move down")
					.setDisabled(index === palette.length - 1)
					.onClick(async () => {
						if (index === palette.length - 1)
							return;

						const arr = this.plugin.settings.defaultGroupingPalette;
						[arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];

						await this.plugin.saveSettings();
						this.renderGroupingColorSettingsList(bodyElement);
					})
				)
				.addExtraButton(button => button
					.setIcon("trash")
					.setTooltip("Remove color")
					.onClick(async () => {
						this.plugin.settings.defaultGroupingPalette.splice(index, 1);
						await this.plugin.saveSettings();
						this.renderGroupingColorSettingsList(bodyElement);
					})
				);
		});

		new Setting(listElement).addButton(button => button
			.setButtonText("Add color")
			.setTooltip("Add a new color to the palette")
			.onClick(async () => {
				this.plugin.settings.defaultGroupingPalette.push("#ffffff");
				await this.plugin.saveSettings();
				this.renderGroupingColorSettingsList(bodyElement);
			})
		);
	}
}
