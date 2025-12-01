import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import MermaidBaseViews from "../../main";
import {InferredPropertyType} from "../propertyTypes/InferredPropertyType";

export class MermaidPieChartBaseView extends MermaidBaseViewBase {
	readonly type = MermaidPieChartBaseView.RegistrationData.id;
	readonly registrationData = MermaidPieChartBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-pie-chart",
		name: "Pie Chart",
		icon: "pie-chart",
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: "Title",
				key: "title",
				default: "Title",
			},
			{
				type: "property",
				displayName: "Category property",
				key: "categoryProperty",
				placeholder: "e.g. tag or folder",
			},
			{
				type: "property",
				displayName: "Value property (optional)",
				key: "valueProperty",
				placeholder: "e.g. file size",
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Number),
			},
			{
				type: "toggle",
				displayName: "Show values on labels",
				key: "showDataLabel",
				default: false,
			},
			{
				type: "text",
				displayName: "Mermaid Config Override Directive (optional)",
				key: "mermaidConfigOverrideDirective",
				placeholder: `%%{init: { "look": "handDrawn", "theme": "neutral" }}%%`,
			},
		],
	};

	protected async render(): Promise<void> {
		const categoryPropertyId = this.config.getAsPropertyId("categoryProperty");
		const valuePropertyId = this.config.getAsPropertyId("valueProperty");
		const title = this.getConfigValue<string>("title");
		const showDataLabel = this.getConfigValue<boolean>("showDataLabel");

		if (!categoryPropertyId) {
			this.containerEl.createDiv({text: "Configure a category property in the view settings."});
			return;
		}

		const categoryTotals = new Map<string, number>();

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				const categoryValue = entry.getValue(categoryPropertyId);
				if (categoryValue == null)
					continue;

				const label = categoryValue.toString();
				if (!label)
					continue;

				let amount = 1;
				if (valuePropertyId) {
					const value = entry.getValue(valuePropertyId);
					if (value != null) {
						const number = Number(value.toString());
						if (!Number.isNaN(number))
							amount = number;
					}
				}

				categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + amount);
			}
		}

		if (categoryTotals.size === 0) {
			this.containerEl.createDiv({text: "No data to display for the current filter and configuration."});
			return;
		}

		let mermaidCode = `pie ${showDataLabel ? "showData" : ""} title ${title}\n`;
		for (const [label, amount] of categoryTotals)
			mermaidCode += `    "${label}" : ${amount}\n`;

		await this.renderMermaid(mermaidCode, this.plugin.settings.pieChartMermaidConfig);
	}
}
