import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from "./MermaidBaseViewBase";
import { MermaidXYViewId } from "../core/constants";
import { parsePropertyId } from "obsidian";
export class MermaidXYChartBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidXYViewId;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            const yValuePropertyId = this.config.getAsPropertyId('yValueProperty');
            const showPropertyNames = this.config.get('showPropertyNames');
            if (!yValuePropertyId) {
                this.containerEl.createDiv({
                    text: 'Configure a numeric Y-axis value property in the view settings.',
                });
                return;
            }
            const title = this.config.get('title');
            const rawYAxisLabel = this.config.get('yAxisLabel');
            const yAxisLabel = typeof rawYAxisLabel === 'string' && rawYAxisLabel.trim().length > 0
                ? rawYAxisLabel.trim()
                : parsePropertyId(yValuePropertyId).name;
            const rawChartType = this.config.get('chartType');
            const chartType = (typeof rawChartType === 'string'
                ? rawChartType.trim().toLowerCase()
                : 'bar');
            const rawYMin = this.config.get('yMin');
            const rawYMax = this.config.get('yMax');
            const xLabels = [];
            const yValues = [];
            let minVal = Number.POSITIVE_INFINITY;
            let maxVal = Number.NEGATIVE_INFINITY;
            for (const group of this.data.groupedData) {
                for (const entry of group.entries) {
                    const label = this.getLabelWithProperties(entry.file, showPropertyNames, ", ", "ː");
                    const yVal = entry.getValue(yValuePropertyId);
                    if (yVal == null)
                        continue;
                    const num = Number(yVal.toString());
                    if (!Number.isFinite(num))
                        continue;
                    xLabels.push(label);
                    yValues.push(num);
                    if (num < minVal)
                        minVal = num;
                    if (num > maxVal)
                        maxVal = num;
                }
            }
            if (yValues.length === 0) {
                this.containerEl.createDiv({
                    text: 'No numeric data found for the selected Y-axis property.',
                });
                return;
            }
            // Auto range if overrides not set
            let yMin = minVal;
            let yMax = maxVal;
            if (typeof rawYMin === 'string' && rawYMin.trim().length > 0) {
                const parsed = Number(rawYMin.trim());
                if (Number.isFinite(parsed))
                    yMin = parsed;
            }
            if (typeof rawYMax === 'string' && rawYMax.trim().length > 0) {
                const parsed = Number(rawYMax.trim());
                if (Number.isFinite(parsed))
                    yMax = parsed;
            }
            // If all values are equal, widen the range a bit so Mermaid has something to draw
            if (yMin === yMax) {
                yMin -= 1;
                yMax += 1;
            }
            // Build x-axis and data arrays
            const escapedLabels = xLabels.map((label) => label.replace(/"/g, '\\"'));
            const xAxis = `[${escapedLabels
                .map((l) => `"${l}"`)
                .join(', ')}]`;
            const valuesArray = `[${yValues.join(', ')}]`;
            // Build xychart mermaidCode
            const lines = [];
            lines.push('xychart-beta');
            if (title)
                lines.push(`    title "${title}"`);
            lines.push(`    x-axis ${xAxis}`);
            lines.push(`    y-axis "${yAxisLabel}" ${yMin} --> ${yMax}`);
            if (chartType === 'line') {
                lines.push(`    line ${valuesArray}`);
            }
            else if (chartType === 'bar-and-line') {
                lines.push(`    bar ${valuesArray}`);
                lines.push(`    line ${valuesArray}`);
            }
            else {
                lines.push(`    bar ${valuesArray}`);
            }
            const mermaidCode = lines.join('\n');
            // const showDataLabel = this.config.get('showDataLabel') as Boolean;
            // const extraConfig = showDataLabel ? "%%{init: {\"xyChart\": {\"showDataLabel\": \"true\"} }}%%" : "";//TODO: figure out why labels don't work
            yield this.renderMermaid(mermaidCode);
        });
    }
}
MermaidXYChartBaseView.RegistrationData = {
    id: MermaidXYViewId,
    name: 'XY Chart',
    icon: 'line-chart',
    options: [
        {
            type: 'text',
            displayName: 'Title',
            key: 'title',
            default: 'Title',
        },
        {
            type: 'property',
            displayName: 'Y-axis value property (numeric, e.g. file size)',
            key: 'yValueProperty',
            placeholder: 'e.g. size',
        },
        {
            type: 'text',
            displayName: 'Y-axis label',
            key: 'yAxisLabel',
            default: '',
        },
        {
            type: 'text',
            displayName: 'Y-min override (optional)',
            key: 'yMin',
            placeholder: 'auto from data',
        },
        {
            type: 'text',
            displayName: 'Y-max override (optional)',
            key: 'yMax',
            placeholder: 'auto from data',
        },
        {
            type: 'dropdown',
            displayName: 'Chart type',
            key: 'chartType',
            default: 'bar',
            options: { "bar": "bar", "line": "line", "bar-and-line": "both" },
        },
        // {
        // 	type: 'toggle',
        // 	displayName: 'Show data labels',
        // 	key: 'showDataLabel',
        // 	default: false,
        // },
        {
            type: 'toggle',
            displayName: 'Show property names',
            key: 'showPropertyNames',
            default: true,
        },
        {
            type: 'text',
            displayName: 'Mermaid config (optional)',
            key: 'mermaidConfig',
            placeholder: `%%{init: { 'theme': 'dark' }}%%`,
        },
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZFhZQ2hhcnRCYXNlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1lcm1haWRYWUNoYXJ0QmFzZVZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR3pDLE1BQU0sT0FBTyxzQkFBdUIsU0FBUSxtQkFBbUI7SUFBL0Q7O1FBQ1UsU0FBSSxHQUFHLGVBQWUsQ0FBQztJQWlMakMsQ0FBQztJQWhIZ0IsTUFBTTs7WUFDckIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQVksQ0FBQztZQUUxRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO29CQUMxQixJQUFJLEVBQUUsaUVBQWlFO2lCQUN2RSxDQUFDLENBQUM7Z0JBQ0gsT0FBTzthQUNQO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdkMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDcEQsTUFBTSxVQUFVLEdBQ2YsT0FBTyxhQUFhLEtBQUssUUFBUSxJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDbkUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3RCLENBQUMsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFFM0MsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbEQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxPQUFPLFlBQVksS0FBSyxRQUFRO2dCQUNsRCxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtnQkFDbkMsQ0FBQyxDQUFDLEtBQUssQ0FBb0MsQ0FBQztZQUU3QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV4QyxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7WUFDN0IsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1lBRTdCLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztZQUN0QyxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUM7WUFFdEMsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDMUMsS0FBSyxNQUFNLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO29CQUVsQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBRXBGLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDOUMsSUFBSSxJQUFJLElBQUksSUFBSTt3QkFBRSxTQUFTO29CQUUzQixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQzt3QkFBRSxTQUFTO29CQUVwQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUVsQixJQUFJLEdBQUcsR0FBRyxNQUFNO3dCQUFFLE1BQU0sR0FBRyxHQUFHLENBQUM7b0JBQy9CLElBQUksR0FBRyxHQUFHLE1BQU07d0JBQUUsTUFBTSxHQUFHLEdBQUcsQ0FBQztpQkFDL0I7YUFDRDtZQUVELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO29CQUMxQixJQUFJLEVBQUUseURBQXlEO2lCQUMvRCxDQUFDLENBQUM7Z0JBQ0gsT0FBTzthQUNQO1lBRUQsa0NBQWtDO1lBQ2xDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQztZQUNsQixJQUFJLElBQUksR0FBRyxNQUFNLENBQUM7WUFFbEIsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzdELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztvQkFBRSxJQUFJLEdBQUcsTUFBTSxDQUFDO2FBQzNDO1lBQ0QsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzdELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztvQkFBRSxJQUFJLEdBQUcsTUFBTSxDQUFDO2FBQzNDO1lBRUQsa0ZBQWtGO1lBQ2xGLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtnQkFDbEIsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDVixJQUFJLElBQUksQ0FBQyxDQUFDO2FBQ1Y7WUFFRCwrQkFBK0I7WUFDL0IsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQzNDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUMxQixDQUFDO1lBQ0YsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFhO2lCQUM3QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7aUJBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBRWhCLE1BQU0sV0FBVyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBRTlDLDRCQUE0QjtZQUM1QixNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7WUFDM0IsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUMzQixJQUFJLEtBQUs7Z0JBQ1IsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDbEMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLFVBQVUsS0FBSyxJQUFJLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU3RCxJQUFJLFNBQVMsS0FBSyxNQUFNLEVBQUU7Z0JBQ3pCLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQ3RDO2lCQUFNLElBQUksU0FBUyxLQUFLLGNBQWMsRUFBRTtnQkFDeEMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLFdBQVcsRUFBRSxDQUFDLENBQUM7Z0JBQ3JDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQ3RDO2lCQUFNO2dCQUNOLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQ3JDO1lBRUQsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVyQyxxRUFBcUU7WUFDckUsZ0pBQWdKO1lBRWhKLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDO0tBQUE7O0FBOUtlLHVDQUFnQixHQUFnQztJQUMvRCxFQUFFLEVBQUUsZUFBZTtJQUNuQixJQUFJLEVBQUUsVUFBVTtJQUNoQixJQUFJLEVBQUUsWUFBWTtJQUNsQixPQUFPLEVBQUU7UUFDUjtZQUNDLElBQUksRUFBRSxNQUFNO1lBQ1osV0FBVyxFQUFFLE9BQU87WUFDcEIsR0FBRyxFQUFFLE9BQU87WUFDWixPQUFPLEVBQUUsT0FBTztTQUNoQjtRQUNEO1lBQ0MsSUFBSSxFQUFFLFVBQVU7WUFDaEIsV0FBVyxFQUFFLGlEQUFpRDtZQUM5RCxHQUFHLEVBQUUsZ0JBQWdCO1lBQ3JCLFdBQVcsRUFBRSxXQUFXO1NBQ3hCO1FBQ0Q7WUFDQyxJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRSxjQUFjO1lBQzNCLEdBQUcsRUFBRSxZQUFZO1lBQ2pCLE9BQU8sRUFBRSxFQUFFO1NBQ1g7UUFDRDtZQUNDLElBQUksRUFBRSxNQUFNO1lBQ1osV0FBVyxFQUFFLDJCQUEyQjtZQUN4QyxHQUFHLEVBQUUsTUFBTTtZQUNYLFdBQVcsRUFBRSxnQkFBZ0I7U0FDN0I7UUFDRDtZQUNDLElBQUksRUFBRSxNQUFNO1lBQ1osV0FBVyxFQUFFLDJCQUEyQjtZQUN4QyxHQUFHLEVBQUUsTUFBTTtZQUNYLFdBQVcsRUFBRSxnQkFBZ0I7U0FDN0I7UUFDRDtZQUNDLElBQUksRUFBRSxVQUFVO1lBQ2hCLFdBQVcsRUFBRSxZQUFZO1lBQ3pCLEdBQUcsRUFBRSxXQUFXO1lBQ2hCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUM7U0FDL0Q7UUFDRCxJQUFJO1FBQ0osbUJBQW1CO1FBQ25CLG9DQUFvQztRQUNwQyx5QkFBeUI7UUFDekIsbUJBQW1CO1FBQ25CLEtBQUs7UUFDTDtZQUNDLElBQUksRUFBRSxRQUFRO1lBQ2QsV0FBVyxFQUFFLHFCQUFxQjtZQUNsQyxHQUFHLEVBQUUsbUJBQW1CO1lBQ3hCLE9BQU8sRUFBRSxJQUFJO1NBQ2I7UUFDRDtZQUNDLElBQUksRUFBRSxNQUFNO1lBQ1osV0FBVyxFQUFFLDJCQUEyQjtZQUN4QyxHQUFHLEVBQUUsZUFBZTtZQUNwQixXQUFXLEVBQUUsaUNBQWlDO1NBQzlDO0tBQ0Q7Q0FDRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNZXJtYWlkQmFzZVZpZXdCYXNlfSBmcm9tIFwiLi9NZXJtYWlkQmFzZVZpZXdCYXNlXCI7XG5pbXBvcnQge01lcm1haWRYWVZpZXdJZH0gZnJvbSBcIi4uL2NvcmUvY29uc3RhbnRzXCI7XG5pbXBvcnQge3BhcnNlUHJvcGVydHlJZH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge01lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YX0gZnJvbSBcIi4uL2NvcmUvTWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhXCI7XG5cbmV4cG9ydCBjbGFzcyBNZXJtYWlkWFlDaGFydEJhc2VWaWV3IGV4dGVuZHMgTWVybWFpZEJhc2VWaWV3QmFzZSB7XG5cdHJlYWRvbmx5IHR5cGUgPSBNZXJtYWlkWFlWaWV3SWQ7XG5cblx0c3RhdGljIHJlYWRvbmx5IFJlZ2lzdHJhdGlvbkRhdGE6IE1lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YSA9IHtcblx0XHRpZDogTWVybWFpZFhZVmlld0lkLFxuXHRcdG5hbWU6ICdYWSBDaGFydCcsXG5cdFx0aWNvbjogJ2xpbmUtY2hhcnQnLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1RpdGxlJyxcblx0XHRcdFx0a2V5OiAndGl0bGUnLFxuXHRcdFx0XHRkZWZhdWx0OiAnVGl0bGUnLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3Byb3BlcnR5Jyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdZLWF4aXMgdmFsdWUgcHJvcGVydHkgKG51bWVyaWMsIGUuZy4gZmlsZSBzaXplKScsXG5cdFx0XHRcdGtleTogJ3lWYWx1ZVByb3BlcnR5Jyxcblx0XHRcdFx0cGxhY2Vob2xkZXI6ICdlLmcuIHNpemUnLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1ktYXhpcyBsYWJlbCcsXG5cdFx0XHRcdGtleTogJ3lBeGlzTGFiZWwnLFxuXHRcdFx0XHRkZWZhdWx0OiAnJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdZLW1pbiBvdmVycmlkZSAob3B0aW9uYWwpJyxcblx0XHRcdFx0a2V5OiAneU1pbicsXG5cdFx0XHRcdHBsYWNlaG9sZGVyOiAnYXV0byBmcm9tIGRhdGEnLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1ktbWF4IG92ZXJyaWRlIChvcHRpb25hbCknLFxuXHRcdFx0XHRrZXk6ICd5TWF4Jyxcblx0XHRcdFx0cGxhY2Vob2xkZXI6ICdhdXRvIGZyb20gZGF0YScsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAnZHJvcGRvd24nLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ0NoYXJ0IHR5cGUnLFxuXHRcdFx0XHRrZXk6ICdjaGFydFR5cGUnLFxuXHRcdFx0XHRkZWZhdWx0OiAnYmFyJyxcblx0XHRcdFx0b3B0aW9uczoge1wiYmFyXCI6IFwiYmFyXCIsIFwibGluZVwiOiBcImxpbmVcIiwgXCJiYXItYW5kLWxpbmVcIjogXCJib3RoXCJ9LFxuXHRcdFx0fSxcblx0XHRcdC8vIHtcblx0XHRcdC8vIFx0dHlwZTogJ3RvZ2dsZScsXG5cdFx0XHQvLyBcdGRpc3BsYXlOYW1lOiAnU2hvdyBkYXRhIGxhYmVscycsXG5cdFx0XHQvLyBcdGtleTogJ3Nob3dEYXRhTGFiZWwnLFxuXHRcdFx0Ly8gXHRkZWZhdWx0OiBmYWxzZSxcblx0XHRcdC8vIH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0b2dnbGUnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1Nob3cgcHJvcGVydHkgbmFtZXMnLFxuXHRcdFx0XHRrZXk6ICdzaG93UHJvcGVydHlOYW1lcycsXG5cdFx0XHRcdGRlZmF1bHQ6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnTWVybWFpZCBjb25maWcgKG9wdGlvbmFsKScsXG5cdFx0XHRcdGtleTogJ21lcm1haWRDb25maWcnLFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogYCUle2luaXQ6IHsgJ3RoZW1lJzogJ2RhcmsnIH19JSVgLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9O1xuXG5cdHByb3RlY3RlZCBhc3luYyByZW5kZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgeVZhbHVlUHJvcGVydHlJZCA9IHRoaXMuY29uZmlnLmdldEFzUHJvcGVydHlJZCgneVZhbHVlUHJvcGVydHknKTtcblx0XHRjb25zdCBzaG93UHJvcGVydHlOYW1lcyA9IHRoaXMuY29uZmlnLmdldCgnc2hvd1Byb3BlcnR5TmFtZXMnKSBhcyBCb29sZWFuO1xuXG5cdFx0aWYgKCF5VmFsdWVQcm9wZXJ0eUlkKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6ICdDb25maWd1cmUgYSBudW1lcmljIFktYXhpcyB2YWx1ZSBwcm9wZXJ0eSBpbiB0aGUgdmlldyBzZXR0aW5ncy4nLFxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGl0bGUgPSB0aGlzLmNvbmZpZy5nZXQoJ3RpdGxlJyk7XG5cblx0XHRjb25zdCByYXdZQXhpc0xhYmVsID0gdGhpcy5jb25maWcuZ2V0KCd5QXhpc0xhYmVsJyk7XG5cdFx0Y29uc3QgeUF4aXNMYWJlbCA9XG5cdFx0XHR0eXBlb2YgcmF3WUF4aXNMYWJlbCA9PT0gJ3N0cmluZycgJiYgcmF3WUF4aXNMYWJlbC50cmltKCkubGVuZ3RoID4gMFxuXHRcdFx0XHQ/IHJhd1lBeGlzTGFiZWwudHJpbSgpXG5cdFx0XHRcdDogcGFyc2VQcm9wZXJ0eUlkKHlWYWx1ZVByb3BlcnR5SWQpLm5hbWU7XG5cblx0XHRjb25zdCByYXdDaGFydFR5cGUgPSB0aGlzLmNvbmZpZy5nZXQoJ2NoYXJ0VHlwZScpO1xuXHRcdGNvbnN0IGNoYXJ0VHlwZSA9ICh0eXBlb2YgcmF3Q2hhcnRUeXBlID09PSAnc3RyaW5nJ1xuXHRcdFx0PyByYXdDaGFydFR5cGUudHJpbSgpLnRvTG93ZXJDYXNlKClcblx0XHRcdDogJ2JhcicpIGFzICdiYXInIHwgJ2xpbmUnIHwgJ2Jhci1hbmQtbGluZSc7XG5cblx0XHRjb25zdCByYXdZTWluID0gdGhpcy5jb25maWcuZ2V0KCd5TWluJyk7XG5cdFx0Y29uc3QgcmF3WU1heCA9IHRoaXMuY29uZmlnLmdldCgneU1heCcpO1xuXG5cdFx0Y29uc3QgeExhYmVsczogc3RyaW5nW10gPSBbXTtcblx0XHRjb25zdCB5VmFsdWVzOiBudW1iZXJbXSA9IFtdO1xuXG5cdFx0bGV0IG1pblZhbCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcblx0XHRsZXQgbWF4VmFsID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuXG5cdFx0Zm9yIChjb25zdCBncm91cCBvZiB0aGlzLmRhdGEuZ3JvdXBlZERhdGEpIHtcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZ3JvdXAuZW50cmllcykge1xuXG5cdFx0XHRcdGNvbnN0IGxhYmVsID0gdGhpcy5nZXRMYWJlbFdpdGhQcm9wZXJ0aWVzKGVudHJ5LmZpbGUsIHNob3dQcm9wZXJ0eU5hbWVzLCBcIiwgXCIsIFwiy5BcIik7XG5cblx0XHRcdFx0Y29uc3QgeVZhbCA9IGVudHJ5LmdldFZhbHVlKHlWYWx1ZVByb3BlcnR5SWQpO1xuXHRcdFx0XHRpZiAoeVZhbCA9PSBudWxsKSBjb250aW51ZTtcblxuXHRcdFx0XHRjb25zdCBudW0gPSBOdW1iZXIoeVZhbC50b1N0cmluZygpKTtcblx0XHRcdFx0aWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtKSkgY29udGludWU7XG5cblx0XHRcdFx0eExhYmVscy5wdXNoKGxhYmVsKTtcblx0XHRcdFx0eVZhbHVlcy5wdXNoKG51bSk7XG5cblx0XHRcdFx0aWYgKG51bSA8IG1pblZhbCkgbWluVmFsID0gbnVtO1xuXHRcdFx0XHRpZiAobnVtID4gbWF4VmFsKSBtYXhWYWwgPSBudW07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHlWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6ICdObyBudW1lcmljIGRhdGEgZm91bmQgZm9yIHRoZSBzZWxlY3RlZCBZLWF4aXMgcHJvcGVydHkuJyxcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEF1dG8gcmFuZ2UgaWYgb3ZlcnJpZGVzIG5vdCBzZXRcblx0XHRsZXQgeU1pbiA9IG1pblZhbDtcblx0XHRsZXQgeU1heCA9IG1heFZhbDtcblxuXHRcdGlmICh0eXBlb2YgcmF3WU1pbiA9PT0gJ3N0cmluZycgJiYgcmF3WU1pbi50cmltKCkubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgcGFyc2VkID0gTnVtYmVyKHJhd1lNaW4udHJpbSgpKTtcblx0XHRcdGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSkgeU1pbiA9IHBhcnNlZDtcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiByYXdZTWF4ID09PSAnc3RyaW5nJyAmJiByYXdZTWF4LnRyaW0oKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCBwYXJzZWQgPSBOdW1iZXIocmF3WU1heC50cmltKCkpO1xuXHRcdFx0aWYgKE51bWJlci5pc0Zpbml0ZShwYXJzZWQpKSB5TWF4ID0gcGFyc2VkO1xuXHRcdH1cblxuXHRcdC8vIElmIGFsbCB2YWx1ZXMgYXJlIGVxdWFsLCB3aWRlbiB0aGUgcmFuZ2UgYSBiaXQgc28gTWVybWFpZCBoYXMgc29tZXRoaW5nIHRvIGRyYXdcblx0XHRpZiAoeU1pbiA9PT0geU1heCkge1xuXHRcdFx0eU1pbiAtPSAxO1xuXHRcdFx0eU1heCArPSAxO1xuXHRcdH1cblxuXHRcdC8vIEJ1aWxkIHgtYXhpcyBhbmQgZGF0YSBhcnJheXNcblx0XHRjb25zdCBlc2NhcGVkTGFiZWxzID0geExhYmVscy5tYXAoKGxhYmVsKSA9PlxuXHRcdFx0bGFiZWwucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpLFxuXHRcdCk7XG5cdFx0Y29uc3QgeEF4aXMgPSBgWyR7ZXNjYXBlZExhYmVsc1xuXHRcdFx0Lm1hcCgobCkgPT4gYFwiJHtsfVwiYClcblx0XHRcdC5qb2luKCcsICcpfV1gO1xuXG5cdFx0Y29uc3QgdmFsdWVzQXJyYXkgPSBgWyR7eVZhbHVlcy5qb2luKCcsICcpfV1gO1xuXG5cdFx0Ly8gQnVpbGQgeHljaGFydCBtZXJtYWlkQ29kZVxuXHRcdGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGxpbmVzLnB1c2goJ3h5Y2hhcnQtYmV0YScpO1xuXHRcdGlmICh0aXRsZSlcblx0XHRcdGxpbmVzLnB1c2goYCAgICB0aXRsZSBcIiR7dGl0bGV9XCJgKTtcblx0XHRsaW5lcy5wdXNoKGAgICAgeC1heGlzICR7eEF4aXN9YCk7XG5cdFx0bGluZXMucHVzaChgICAgIHktYXhpcyBcIiR7eUF4aXNMYWJlbH1cIiAke3lNaW59IC0tPiAke3lNYXh9YCk7XG5cblx0XHRpZiAoY2hhcnRUeXBlID09PSAnbGluZScpIHtcblx0XHRcdGxpbmVzLnB1c2goYCAgICBsaW5lICR7dmFsdWVzQXJyYXl9YCk7XG5cdFx0fSBlbHNlIGlmIChjaGFydFR5cGUgPT09ICdiYXItYW5kLWxpbmUnKSB7XG5cdFx0XHRsaW5lcy5wdXNoKGAgICAgYmFyICR7dmFsdWVzQXJyYXl9YCk7XG5cdFx0XHRsaW5lcy5wdXNoKGAgICAgbGluZSAke3ZhbHVlc0FycmF5fWApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsaW5lcy5wdXNoKGAgICAgYmFyICR7dmFsdWVzQXJyYXl9YCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVybWFpZENvZGUgPSBsaW5lcy5qb2luKCdcXG4nKTtcblxuXHRcdC8vIGNvbnN0IHNob3dEYXRhTGFiZWwgPSB0aGlzLmNvbmZpZy5nZXQoJ3Nob3dEYXRhTGFiZWwnKSBhcyBCb29sZWFuO1xuXHRcdC8vIGNvbnN0IGV4dHJhQ29uZmlnID0gc2hvd0RhdGFMYWJlbCA/IFwiJSV7aW5pdDoge1xcXCJ4eUNoYXJ0XFxcIjoge1xcXCJzaG93RGF0YUxhYmVsXFxcIjogXFxcInRydWVcXFwifSB9fSUlXCIgOiBcIlwiOy8vVE9ETzogZmlndXJlIG91dCB3aHkgbGFiZWxzIGRvbid0IHdvcmtcblxuXHRcdGF3YWl0IHRoaXMucmVuZGVyTWVybWFpZChtZXJtYWlkQ29kZSk7XG5cdH1cbn1cbiJdfQ==