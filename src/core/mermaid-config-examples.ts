function createExample(config: Record<string, Record<string, string | number | boolean>>) {
	const lines = ["config:"];
	for (const [diagram, options] of Object.entries(config)) {
		lines.push(`  ${diagram}:`);
		for (const [key, value] of Object.entries(options))
			lines.push(`    ${key}: ${JSON.stringify(value)}`);
	}
	return {
		frontmatter: lines.join("\n"),
		directive: `%%{init: ${JSON.stringify(config)} }%%`,
	};
}

export const MERMAID_CONFIG_EXAMPLES = {
	flowchart: createExample({flowchart: {curve: "linear"}}),
	mindmap: createExample({mindmap: {maxNodeWidth: 240}}),
	timeline: createExample({timeline: {disableMulticolor: true}}),
	sankey: createExample({sankey: {showValues: false}}),
	pie: createExample({pie: {textPosition: 0.6}}),
	xyChart: createExample({xyChart: {showDataLabel: true}}),
	quadrantChart: createExample({quadrantChart: {pointRadius: 8}}),
	radar: createExample({radar: {axisLabelFactor: 1.2}}),
};
