import {QueryController} from "obsidian";
import {MermaidBasesView} from "./mermaid-bases-view";
import {MermaidViewRegistrationData} from "./mermaid-view-registration-data";
import MermaidBaseViews from "../main";
import {FlowchartView} from "../views/flowchart-view";
import {MindmapView} from "../views/mindmap-view";
import {TimelineView} from "../views/timeline-view";
import {SankeyView} from "../views/sankey-view";
import {RadarChartView} from "../views/radar-chart-view";
import {PieChartView} from "../views/pie-chart-view";
import {XYChartView} from "../views/xy-chart-view";
import {QuadrantChartView} from "../views/quadrant-chart-view";

export function registerAllMermaidViews(plugin: MermaidBaseViews): void {
	registerMermaidView(plugin, FlowchartView, FlowchartView.RegistrationData);
	registerMermaidView(plugin, MindmapView, MindmapView.RegistrationData);
	registerMermaidView(plugin, TimelineView, TimelineView.RegistrationData);
	registerMermaidView(plugin, SankeyView, SankeyView.RegistrationData);
	registerMermaidView(plugin, RadarChartView, RadarChartView.RegistrationData);
	registerMermaidView(plugin, PieChartView, PieChartView.RegistrationData);
	registerMermaidView(plugin, XYChartView, XYChartView.RegistrationData);
	registerMermaidView(plugin, QuadrantChartView, QuadrantChartView.RegistrationData);
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
