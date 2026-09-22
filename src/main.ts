import {Plugin} from "obsidian";
import {registerAllMermaidViews} from "./core/view-registration";
import { PropertyTypeRegistry } from "./propertyTypes/PropertyTypeRegistry";
import {MermaidBaseViewsSettings, DEFAULT_SETTINGS} from "./settings/mermaidBaseViewsSettings";
import {GeneralSettingTab} from "./settings/generalSettingTab";
import {MermaidBaseViewBase} from "./views/MermaidBaseViewBase";
import {CustomLucideIcons} from "./utils/lucideIcons";

export default class MermaidBaseViews extends Plugin {
	settings!: MermaidBaseViewsSettings;

	private mermaidViews = new Set<MermaidBaseViewBase>();
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

	registerMermaidView(view: MermaidBaseViewBase) {
		this.mermaidViews.add(view);

		view.register(() => {
			this.mermaidViews.delete(view);
		});
	}
}
