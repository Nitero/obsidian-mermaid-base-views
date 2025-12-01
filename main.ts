import {Plugin} from "obsidian";
import {registerAllMermaidViews} from "src/core/view-registration";
import { PropertyTypeRegistry } from "src/propertyTypes/PropertyTypeRegistry";
import {MermaidBaseViewsSettings, DEFAULT_SETTINGS} from "src/settings/mermaidBaseViewsSettings";
import {GeneralSettingTab} from "./src/settings/generalSettingTab";
import {MermaidBaseViewBase} from "./src/views/MermaidBaseViewBase";

export default class MermaidBaseViews extends Plugin {
	settings: MermaidBaseViewsSettings;

	private mermaidViews = new Set<MermaidBaseViewBase>();
	propertyTypes: PropertyTypeRegistry;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new GeneralSettingTab(this.app, this));

		this.propertyTypes = new PropertyTypeRegistry(this.app);
		registerAllMermaidViews(this);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
