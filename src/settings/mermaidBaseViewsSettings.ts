export interface MermaidBaseViewsSettings {
	generalMermaidConfig: string;
	flowchartMermaidConfig: string;
	mindmapMermaidConfig: string;
	pieChartMermaidConfig: string;
	quadrantChartMermaidConfig: string;
	radarChartMermaidConfig: string;
	sankeyMermaidConfig: string;
	timelineMermaidConfig: string;
	XYChartMermaidConfig: string;

	flowchartResultLimit: number;
	mindmapResultLimit: number;
	timelineResultLimit: number;

	defaultGroupingPalette: string[];
}

export const DEFAULT_SETTINGS: MermaidBaseViewsSettings = {
	generalMermaidConfig: "",
	flowchartMermaidConfig: "",
	mindmapMermaidConfig: "",
	pieChartMermaidConfig: "",
	quadrantChartMermaidConfig: "",
	radarChartMermaidConfig: "",
	sankeyMermaidConfig: "",
	timelineMermaidConfig: "",
	XYChartMermaidConfig: "",

	flowchartResultLimit: 100,
	mindmapResultLimit: 100,
	timelineResultLimit: 100,

	defaultGroupingPalette: [
		"#4c78a8",
		"#f58518",
		"#54a24b",
		"#e45756",
		"#b279a2",
		"#ff9da6",
		"#9c755f",
		"#bab0ab",
		"#59a14f",
		"#edc948",
	],
}
