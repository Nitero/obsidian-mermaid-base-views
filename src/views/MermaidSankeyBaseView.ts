import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {BasesPropertyId} from "obsidian";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import MermaidBaseViews from "../../main";

export class MermaidSankeyBaseView extends MermaidBaseViewBase {
	readonly type = MermaidSankeyBaseView.RegistrationData.id;
	readonly registrationData = MermaidSankeyBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-sankey",
		name: "Sankey",
		icon: "shuffle",
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "multitext",//TODO: should use property type to select formulas more easily, but currently there is no way to make a list of them?
				displayName: "Flows (source name, target name, value property)",
				key: "flows",
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

		const flowItems = this.getConfigValue<string[]>("flows", []);

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
			const propertyId = this.resolvePropertyIdFromUserInput(flow.propertyName);
			if (!propertyId) {
				this.containerEl.createDiv({text: `Sankey view: Could not resolve property from "${flow.propertyName}".`});
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
			lines.push(`${resolvedFlow.source},${resolvedFlow.target},${resolvedFlow.value}`);

		const mermaidCode = lines.join("\n");
		await this.renderMermaid(mermaidCode, this.plugin.settings.sankeyMermaidConfig);
	}

	private resolvePropertyIdFromUserInput(input: string): BasesPropertyId | null {
		if (!input)
			return null;

		// Direct match on full id (e.g. "formula.bar", "file.size", etc)
		for (const id of this.allProperties) {
			if (id === input)
				return id;
		}

		// Match by bare name (after the first dot)
		for (const id of this.allProperties) {
			const dot = id.indexOf(".");
			const bare = dot >= 0 ? id.substring(dot + 1) : id;
			if (bare === input)
				return id;
		}

		// Match by display name
		for (const id of this.allProperties) {
			const displayName = this.config.getDisplayName(id);
			if (displayName === input)
				return id;
		}

		return null;
	}

	private aggregateNumericProperty(propertyId: BasesPropertyId): number | null {
		if (!this.data)
			return null;

		let sum = 0;
		let foundAny = false;

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				const value = entry.getValue(propertyId);
				if (!value)
					continue;

				const text = value.toString().trim();

				let number: number | null = null;

				if (text === "true")
					number = 1;
				else if (text === "false")
					number = 0;
				else {
					const parsed = Number(text);
					if (Number.isFinite(parsed))
						number = parsed;
				}

				if (number !== null) {
					sum += number;
					foundAny = true;
				}
			}
		}

		return foundAny ? sum : null;
	}
}
