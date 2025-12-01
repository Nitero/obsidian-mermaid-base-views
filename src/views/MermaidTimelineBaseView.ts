import {MermaidBaseViewBase} from "./MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "../core/MermaidViewRegistrationData";
import {BasesPropertyId} from "obsidian";
import MermaidBaseViews from "../../main";
import {InferredPropertyType} from "../propertyTypes/InferredPropertyType";

type TimeGranularity = "year" | "month" | "day" | "hour" | "minute" | "second";

type Group = {
	label: string;
	date: Date;
	events: string[];
};

export class MermaidTimelineBaseView extends MermaidBaseViewBase {
	readonly type = MermaidTimelineBaseView.RegistrationData.id;
	readonly registrationData = MermaidTimelineBaseView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-timeline",
		name: "Timeline",
		icon: "chart-no-axes-gantt",
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: "Title",
				key: "title",
				default: "Title",
			},
			{
				type: "property",
				displayName: "Date / Time property",
				key: "timeProperty",
				placeholder: "e.g. created or modified",
				filter: plugin.propertyTypes.createFilter(InferredPropertyType.Date),
			},
			{
				type: "dropdown",
				displayName: "Cutoff",
				key: "cutoff",
				default: "day",
				options: {
					"year": "Year",
					"month": "Month",
					"day": "Day",
					"hour": "Hour",
					"minute": "Minute",
					"second": "Second"
				},
			},
			{
				type: "toggle",
				displayName: "Show property names",
				key: "showPropertyNames",
				default: true,
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
		const timePropertyId = this.config.getAsPropertyId("timeProperty");

		const showPropertyNames = this.getConfigValue<boolean>("showPropertyNames");

		if (!timePropertyId) {
			this.containerEl.createDiv({text: "Configure a time property in the view settings."});
			return;
		}

		const title = this.config.get("title") as string;

		const granularity = this.getConfigValue<TimeGranularity>("cutoff");

		const sortedGroups = this.generateGroups(timePropertyId, showPropertyNames, granularity);

		if (sortedGroups.length === 0) {
			this.containerEl.createDiv({text: "No valid time values found for the selected property."});
			return;
		}

		if (sortedGroups.length > this.plugin.settings.timelineResultLimit) {
			this.containerEl.createDiv({text: `Exceeded result limit (${this.plugin.settings.timelineResultLimit}). This can be increased in the settings, but may impact performance.`});
			return;
		}

		const mermaidCode = this.buildMermaidCode(title, sortedGroups);
		await this.renderMermaid(mermaidCode, this.plugin.settings.timelineMermaidConfig);
	}

	private generateGroups(
		timePropertyId: BasesPropertyId,
		showPropertyNames: boolean,
		granularity: TimeGranularity,
	): Group[] {
		const groups = new Map<string, Group>();

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				const timeValue = entry.getValue(timePropertyId);
				if (!timeValue)
					continue;

				const timeText = timeValue.toString().trim();
				if (!timeText)
					continue;

				const date = new Date(timeText);
				if (Number.isNaN(date.getTime()))
					continue;

				const {label, truncatedDate} = this.truncateAndFormatDate(date, granularity);

				const eventLabel = this.getLabelWithProperties(entry.file, showPropertyNames, "<br>", "ː");

				let g = groups.get(label);
				if (!g) {
					g = {label, date: truncatedDate, events: []};
					groups.set(label, g);
				}
				g.events.push(eventLabel);
			}
		}

		return Array.from(groups.values()).sort(
			(a, b) => a.date.getTime() - b.date.getTime(),
		);
	}

	private buildMermaidCode(title: string, groups: Group[]): string {
		const lines: string[] = [];
		lines.push("timeline");
		if (title)
			lines.push(`    title ${title}`);

		for (const g of groups) {
			if (g.events.length === 0)
				continue;

			let line = `    ${g.label} : ${g.events[0]}`;
			for (let i = 1; i < g.events.length; i++)
				line += ` : ${g.events[i]}`;
			lines.push(line);
		}

		return lines.join("\n");
	}

	private truncateAndFormatDate(
		date: Date,
		granularity: TimeGranularity,
	): { label: string; truncatedDate: Date } {
		const year = date.getFullYear();
		const month = date.getMonth();
		const day = date.getDate();
		const hour = date.getHours();
		const minute = date.getMinutes();
		const second = date.getSeconds();

		let truncatedDate: Date;
		let label: string;

		switch (granularity) {
			case "year":
				truncatedDate = new Date(year, 0, 1, 0, 0, 0, 0);
				label = `${year}`;
				break;

			case "month":
				truncatedDate = new Date(year, month, 1, 0, 0, 0, 0);
				label = `${year}-${month + 1}`;
				break;

			case "day":
				truncatedDate = new Date(year, month, day, 0, 0, 0, 0);
				label = `${year}-${month + 1}-${day}`;
				break;

			case "hour":
				truncatedDate = new Date(year, month, day, hour, 0, 0, 0);
				label = `${year}-${month + 1}-${day} ${hour}h`;
				break;

			case "minute":
				truncatedDate = new Date(year, month, day, hour, minute, 0, 0);
				label = `${year}-${month + 1}-${day} ${hour}h${minute}`;
				break;

			case "second":
				truncatedDate = new Date(year, month, day, hour, minute, second, 0);
				label = `${year}-${month + 1}-${day} ${hour}h${minute}m${second}s`;
				break;
		}

		return {label, truncatedDate};
	}
}
