import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { registerAllMermaidViews } from "src/core/view-registration";

interface MermaidBaseViewsSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MermaidBaseViewsSettings = {
	mySetting: "default"
}

export default class MermaidBaseViews extends Plugin {
	settings: MermaidBaseViewsSettings;

	async onload() {
		await this.loadSettings();

		registerAllMermaidViews(this);

		this.addSettingTab(new GeneralSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class GeneralSettingTab extends PluginSettingTab {
	plugin: MermaidBaseViews;

	constructor(app: App, plugin: MermaidBaseViews) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It\"s a secret")
			.addText(text => text
				.setPlaceholder("Enter your secret")
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
