import {MermaidBasesView} from "../core/mermaid-bases-view";
import {escapeCsvField} from "../utils/mermaid-text";
import {parseFiniteNumber} from "../utils/numeric-values";
import {MERMAID_CONFIG_EXAMPLES} from "../view-options/mermaid-config-examples";
import {parsePropertyId, type BasesPropertyId} from "obsidian";
import {MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {COMMON_VIEW_OPTIONS} from "../view-options/common-options";

export class SankeyView extends MermaidBasesView {
	readonly type = SankeyView.RegistrationData.id;
	readonly registrationData = SankeyView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-sankey",
		name: "Sankey",
		icon: "custom-sankey",//shuffle
		getOptions: () => [
			{
				type: "multitext",//TODO: should use property type to select formulas more easily, but currently there is no way to make a list of them?
				displayName: "Flows (source name, target name, value property)",
				key: "flows",
			},
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.sankey.directive,
			},
		],
	};

	protected async render(): Promise<void> {

		const flowItems = this.getStringListConfig("flows", []);

		if (flowItems.length < 3) {
			this.containerEl.createDiv({text: "Add at least one flow triple (source name, target name, value property) in the view settings."});
			return;
		}

		type FlowConfig = {
			source: string;
			target: string;
			propertyName: string;
		};

		const flowConfigs: FlowConfig[] = [];

		for (let i = 0; i + 2 < flowItems.length; i += 3) {
			const source = (flowItems[i] ?? "").trim();
			const target = (flowItems[i + 1] ?? "").trim();
			const propertyName = (flowItems[i + 2] ?? "").trim();

			if (!source || !target || !propertyName)
				continue;

			flowConfigs.push({source, target, propertyName: propertyName});
		}

		if (flowConfigs.length === 0) {
			this.containerEl.createDiv({text: "No complete (source name, target name, value property) triples found in the flow configuration."});
			return;
		}

		type ResolvedFlow = {
			source: string;
			target: string;
			value: number;
		};

		const resolvedFlows: ResolvedFlow[] = [];

		for (const flow of flowConfigs) {
			const matches = this.findPropertyMatches(flow.propertyName);
			const propertyId = matches[0];
			if (!propertyId) {
				this.containerEl.createDiv({text: `Sankey view: Could not resolve property from "${flow.propertyName}".`});
				return;
			}
			if (matches.length > 1) {
				this.containerEl.createDiv({text: `Property "${flow.propertyName}" is ambiguous. Use one of: ${matches.join(", ")}.`});
				return;
			}

			const total = this.aggregateNumericProperty(propertyId);
			if (total === null) {
				this.containerEl.createDiv({text: `Sankey view: Property "${propertyId}" did not produce any numeric/boolean values.`});
				return;
			}

			resolvedFlows.push({
				source: flow.source,
				target: flow.target,
				value: total,
			});
		}

		if (resolvedFlows.length === 0) {
			this.containerEl.createDiv({text: "No flows produced numeric/boolean values. Check your value properties and filters."});
			return;
		}

		const lines: string[] = [];
		lines.push("sankey-beta");
		lines.push("%% source,target,value");

		for (const resolvedFlow of resolvedFlows)
			lines.push(`${escapeCsvField(resolvedFlow.source)},${escapeCsvField(resolvedFlow.target)},${resolvedFlow.value}`);

		const mermaidCode = lines.join("\n");
		await this.renderMermaid(mermaidCode, this.plugin.settings.sankeyMermaidConfig);
	}

	private findPropertyMatches(input: string): BasesPropertyId[] {
		const exact = this.allProperties.find((id) => id === input);
		if (exact)
			return [exact];
		return this.allProperties.filter((id) =>
			parsePropertyId(id).name === input || this.config.getDisplayName(id) === input);
	}

	private aggregateNumericProperty(propertyId: BasesPropertyId): number | null {
		if (!this.data)
			return null;

		let sum = 0;
		let foundAny = false;

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				const number = parseFiniteNumber(entry.getValue(propertyId), true);

				if (number !== null) {
					sum += number;
					foundAny = true;
				}
			}
		}

		return foundAny ? sum : null;
	}
}
