import {Plugin} from "obsidian";
import {registerAllMermaidViews} from "./core/view-registration";
import {PropertyTypeRegistry} from "./view-options/property-type-registry";
import {MermaidBaseViewsSettings, DEFAULT_SETTINGS} from "./settings/mermaid-base-views-settings";
import {GeneralSettingTab} from "./settings/general-setting-tab";
import {MermaidBasesView} from "./core/mermaid-bases-view";
import {CustomLucideIcons} from "./ui/view-icons";

export default class MermaidBaseViews extends Plugin {
	settings!: MermaidBaseViewsSettings;

	private mermaidViews = new Set<MermaidBasesView>();
	propertyTypes!: PropertyTypeRegistry;

	async onload() {
		this.registerHoverLinkSource(this.manifest.id, {display: this.manifest.name, defaultMod: true});
		new CustomLucideIcons();

		await this.loadSettings();
		this.addSettingTab(new GeneralSettingTab(this.app, this));

		this.propertyTypes = new PropertyTypeRegistry();
		registerAllMermaidViews(this);
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
