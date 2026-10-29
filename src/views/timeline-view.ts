import {MermaidBasesView} from "../core/mermaid-bases-view";
import {MERMAID_CONFIG_EXAMPLES} from "../core/mermaid-config-examples";
import {MermaidViewRegistrationData} from "../core/mermaid-view-registration-data";
import {BasesPropertyId} from "obsidian";
import MermaidBaseViews from "../main";
import {InferredPropertyType} from "../propertyTypes/inferred-property-type";
import {COMMON_VIEW_OPTIONS, NOTE_LABEL_OPTIONS} from "../core/constants";

type TimeGranularity = "year" | "month" | "day" | "hour" | "minute" | "second";

type Period = {
	label: string;
	date: Date;
	events: {label: string; path: string}[];
};

type Section = {
	label: string | null;
	periods: Period[];
};

export class TimelineView extends MermaidBasesView {
	readonly type = TimelineView.RegistrationData.id;
	readonly registrationData = TimelineView.RegistrationData;

	static readonly RegistrationData: MermaidViewRegistrationData = {
		id: "mermaid-timeline",
		name: "Timeline",
		icon: "custom-timeline",//timeline//chart-no-axes-gantt
		getOptions: (plugin: MermaidBaseViews) => [
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.title.displayName,
				key: COMMON_VIEW_OPTIONS.title.key,
				default: COMMON_VIEW_OPTIONS.title.default,
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
			...NOTE_LABEL_OPTIONS,
			{
				type: "text",
				displayName: COMMON_VIEW_OPTIONS.mermaidConfigOverride.displayName,
				key: COMMON_VIEW_OPTIONS.mermaidConfigOverride.key,
				placeholder: MERMAID_CONFIG_EXAMPLES.timeline.directive,
			},
		],
	};

	protected async render(): Promise<void> {
		const timePropertyId = this.config.getAsPropertyId("timeProperty");

		const showPropertyNames = this.getConfigValue<boolean>(COMMON_VIEW_OPTIONS.showPropertyNames.key);

		if (!timePropertyId) {
			this.containerEl.createDiv({text: "Configure a time property in the view settings."});
			return;
		}

		const title = this.getOptionalTitle();

		const granularity = this.getConfigValue<TimeGranularity>("cutoff");

		const sections = this.generateSections(timePropertyId, showPropertyNames, granularity);

		if (sections.length === 0) {
			this.containerEl.createDiv({text: "No valid time values found for the selected property."});
			return;
		}

		const mermaidCode = this.buildMermaidCode(title, sections);
		await this.renderMermaid(mermaidCode, this.plugin.settings.timelineMermaidConfig);
		this.hookUpEventLinks(sections);
	}

	private hookUpEventLinks(sections: Section[]): void {
		const paths = sections.flatMap((section) =>
			section.periods.flatMap((period) => period.events.map((event) => event.path)));
		this.markOrderedNoteLinks(".pele-period .pele-event", paths);
	}

	private generateSections(
		timePropertyId: BasesPropertyId,
		showPropertyNames: boolean,
		granularity: TimeGranularity,
	): Section[] {
		const groups = this.data.groupedData;
		const hasGrouping = this.config.get("groupBy") != null
			|| groups.length > 1 || groups.some((group) => group.hasKey());
		const sections: Section[] = [];

		for (const group of groups) {
			const periods = new Map<string, Period>();
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

				const eventLabel = this.getLabelWithProperties(entry.file, showPropertyNames, "<br>", "ː", true);

				let period = periods.get(label);
				if (!period) {
					period = {label, date: truncatedDate, events: []};
					periods.set(label, period);
				}
				period.events.push({
					label: eventLabel,
					path: entry.file.path,
				});
			}
			if (periods.size > 0) {
				sections.push({
					label: hasGrouping ? (group.hasKey() ? group.key?.toString().trim() : "") || "No value" : null,
					periods: Array.from(periods.values()).sort(
						(first, second) => first.date.getTime() - second.date.getTime(),
					),
				});
			}
		}

		return sections;
	}

	private buildMermaidCode(title: string | null, sections: Section[]): string {
		const lines: string[] = [];
		lines.push("timeline");
		if (title !== null)
			lines.push(`    title ${title}`);

		for (const section of sections) {
			if (section.label !== null)
				lines.push(`    section ${section.label.replace(/[\r\n]+/g, " ")}`);
			for (const period of section.periods)
				lines.push(`    ${period.label} : ${period.events.map((event) => event.label).join(" : ")}`);
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
