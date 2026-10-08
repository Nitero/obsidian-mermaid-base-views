import {Plugin} from "obsidian";
import {registerAllMermaidViews} from "./core/view-registration";
import {PropertyTypeRegistry} from "./propertyTypes/property-type-registry";
import {MermaidBaseViewsSettings, DEFAULT_SETTINGS} from "./settings/mermaid-vase-views-settings";
import {GeneralSettingTab} from "./settings/general-setting-tab";
import {MermaidBasesView} from "./core/mermaid-bases-view";
import {CustomLucideIcons} from "./utils/lucide-icons";

export default class MermaidBaseViews extends Plugin {
	settings!: MermaidBaseViewsSettings;

	private mermaidViews = new Set<MermaidBasesView>();
	propertyTypes!: PropertyTypeRegistry;

	async onload() {
		new CustomLucideIcons();

		await this.loadSettings();
		this.addSettingTab(new GeneralSettingTab(this.app, this));

		this.propertyTypes = new PropertyTypeRegistry();
		registerAllMermaidViews(this);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MermaidBaseViewsSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);

		for (const view of this.mermaidViews)
			view.onDataUpdated();
	}

	registerMermaidView(view: MermaidBasesView) {
		this.mermaidViews.add(view);

		view.register(() => {
			this.mermaidViews.delete(view);
		});
	}
}
