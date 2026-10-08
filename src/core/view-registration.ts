import {QueryController} from "obsidian";
import { MermaidBasesView } from "../views/MermaidBasesView";
import {MermaidViewRegistrationData} from "./MermaidViewRegistrationData";
import {MermaidFlowchartBasesView} from "../views/MermaidFlowchartBasesView";
import {MermaidMindmapBasesView} from "../views/MermaidMindmapBasesView";
import {MermaidTimelineBasesView} from "../views/MermaidTimelineBasesView";
import {MermaidSankeyBasesView} from "../views/MermaidSankeyBasesView";
import {MermaidRadarChartBasesView} from "../views/MermaidRadarChartBasesView";
import { MermaidPieChartBasesView } from "../views/MermaidPieChartBasesView";
import { MermaidXYChartBasesView } from "../views/MermaidXYChartBasesView";
import {MermaidQuadrantChartBasesView} from "../views/MermaidQuadrantChartBasesView";
import MermaidBaseViews from "../main";

export function registerAllMermaidViews(plugin: MermaidBaseViews): void {
	registerMermaidView(plugin, MermaidFlowchartBasesView, MermaidFlowchartBasesView.RegistrationData);
	registerMermaidView(plugin, MermaidMindmapBasesView, MermaidMindmapBasesView.RegistrationData);
	registerMermaidView(plugin, MermaidTimelineBasesView, MermaidTimelineBasesView.RegistrationData);
	registerMermaidView(plugin, MermaidSankeyBasesView, MermaidSankeyBasesView.RegistrationData);
	registerMermaidView(plugin, MermaidRadarChartBasesView, MermaidRadarChartBasesView.RegistrationData);
	registerMermaidView(plugin, MermaidPieChartBasesView, MermaidPieChartBasesView.RegistrationData);
	registerMermaidView(plugin, MermaidXYChartBasesView, MermaidXYChartBasesView.RegistrationData);
	registerMermaidView(plugin, MermaidQuadrantChartBasesView, MermaidQuadrantChartBasesView.RegistrationData);
}

export function registerMermaidView(
	plugin: MermaidBaseViews,
	View: new (controller: QueryController, containerEl: HTMLElement, plugin: MermaidBaseViews) => MermaidBasesView,
	registrationData: MermaidViewRegistrationData,
): void {
	plugin.registerBasesView(registrationData.id, {
		name: registrationData.name,
		icon: registrationData.icon,
		factory: (controller, containerEl) =>
			new View(controller, containerEl, plugin),
		options: () => registrationData.getOptions(plugin),
	});
}
