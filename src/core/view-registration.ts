import {Plugin, QueryController} from "obsidian";
import { MermaidBaseViewBase } from "../views/MermaidBaseViewBase";
import {MermaidViewRegistrationData} from "./MermaidViewRegistrationData";
import {MermaidFlowchartBaseView} from "../views/MermaidFlowchartBaseView";
import {MermaidMindmapBaseView} from "../views/MermaidMindmapBaseView";
import {MermaidTimelineBaseView} from "../views/MermaidTimelineBaseView";
import {MermaidSankeyBaseView} from "../views/MermaidSankeyBaseView";
// import {MermaidRadarChartBaseView} from "../views/MermaidRadarChartBaseView";
import { MermaidPieChartBaseView } from "../views/MermaidPieChartBaseView";
import { MermaidXYChartBaseView } from "../views/MermaidXYChartBaseView";
import {MermaidQuadrantChartBaseView} from "../views/MermaidQuadrantChartBaseView";

export function registerAllMermaidViews(plugin: Plugin): void {
	registerMermaidView(plugin, MermaidFlowchartBaseView, MermaidFlowchartBaseView.RegistrationData);
	registerMermaidView(plugin, MermaidMindmapBaseView, MermaidMindmapBaseView.RegistrationData);
	registerMermaidView(plugin, MermaidTimelineBaseView, MermaidTimelineBaseView.RegistrationData);
	registerMermaidView(plugin, MermaidSankeyBaseView, MermaidSankeyBaseView.RegistrationData);
	// registerMermaidView(plugin, MermaidRadarChartBaseView);//requires mermaid v11.6.0+
	registerMermaidView(plugin, MermaidPieChartBaseView, MermaidPieChartBaseView.RegistrationData);
	registerMermaidView(plugin, MermaidXYChartBaseView, MermaidXYChartBaseView.RegistrationData);
	registerMermaidView(plugin, MermaidQuadrantChartBaseView, MermaidQuadrantChartBaseView.RegistrationData);
}

export function registerMermaidView(
	plugin: Plugin,
	View: new (controller: QueryController, containerEl: HTMLElement) => MermaidBaseViewBase,
	registrationData: MermaidViewRegistrationData,
): void {
	plugin.registerBasesView(registrationData.id, {
		name: registrationData.name,
		icon: registrationData.icon,
		factory: (controller, containerEl) =>
			new View(controller, containerEl),
		options: () => registrationData.options,
	});
}
