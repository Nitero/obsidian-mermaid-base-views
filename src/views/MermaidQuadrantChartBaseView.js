import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from "./MermaidBaseViewBase";
import { defaultGroupingPalette, MermaidQuadrantViewId } from "../core/constants";
export class MermaidQuadrantChartBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidQuadrantViewId;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            const xPropertyId = this.config.getAsPropertyId('xProperty');
            const yPropertyId = this.config.getAsPropertyId('yProperty');
            const showPropertyNames = this.config.get('showPropertyNames');
            if (!xPropertyId || !yPropertyId) {
                this.containerEl.createDiv({
                    text: 'Configure numeric X and Y properties in the view settings.',
                });
                return;
            }
            const title = this.config.get('title');
            let xAxisLabels = "";
            const xAxisLabelLeft = this.config.get('xAxisLabelLeft');
            const xAxisLabelRight = this.config.get('xAxisLabelRight');
            if (xAxisLabelLeft)
                xAxisLabels = xAxisLabelLeft;
            if (xAxisLabelRight && xAxisLabels)
                xAxisLabels += ` --> ${xAxisLabelRight}`;
            let yAxisLabels = "";
            const yAxisLabelBottom = this.config.get('yAxisLabelBottom');
            const yAxisLabelTop = this.config.get('yAxisLabelTop');
            if (yAxisLabelBottom)
                yAxisLabels = yAxisLabelBottom;
            if (yAxisLabelTop && yAxisLabels)
                yAxisLabels += ` --> ${yAxisLabelTop}`;
            const qTopLeft = this.config.get('qTopLeft');
            const qTopRight = this.config.get('qTopRight');
            const qBottomLeft = this.config.get('qBottomLeft');
            const qBottomRight = this.config.get('qBottomRight');
            const points = [];
            let minX = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            const rawPalette = this.config.get('groupingPalette');
            const palette = Array.isArray(rawPalette)
                ? rawPalette
                    .map((v) => v === null || v === void 0 ? void 0 : v.toString().trim())
                    .filter((v) => v && v.length > 0)
                : defaultGroupingPalette;
            if (!Array.isArray(rawPalette) || palette.length === 0) {
                palette.splice(0, palette.length, ...defaultGroupingPalette);
            }
            const groups = this.data.groupedData;
            const groupingEnabled = groups.length > 1 || (groups.length === 1 && groups[0].key !== undefined);
            for (let gi = 0; gi < groups.length; gi++) {
                const group = groups[gi];
                const groupColor = groupingEnabled ? palette[gi % palette.length] : null;
                for (const entry of group.entries) {
                    const xVal = entry.getValue(xPropertyId);
                    const yVal = entry.getValue(yPropertyId);
                    if (!xVal || xVal == null || !yVal || yVal == null) {
                        continue;
                    }
                    const xNum = Number(xVal.toString());
                    const yNum = Number(yVal.toString());
                    if (!Number.isFinite(xNum) || !Number.isFinite(yNum))
                        continue;
                    const label = this.getLabelWithProperties(entry.file, showPropertyNames, ", ", "ː");
                    points.push({ label, x: xNum, y: yNum, color: groupColor });
                    if (xNum < minX)
                        minX = xNum;
                    if (xNum > maxX)
                        maxX = xNum;
                    if (yNum < minY)
                        minY = yNum;
                    if (yNum > maxY)
                        maxY = yNum;
                }
            }
            if (points.length === 0) {
                this.containerEl.createDiv({
                    text: 'No numeric data found for the selected X/Y properties.',
                });
                return;
            }
            // Read optional overrides from config
            const rawXMinCfg = this.config.get('xMin');
            const rawXMaxCfg = this.config.get('xMax');
            const rawYMinCfg = this.config.get('yMin');
            const rawYMaxCfg = this.config.get('yMax');
            let xMin = minX;
            let xMax = maxX;
            let yMin = minY;
            let yMax = maxY;
            if (typeof rawXMinCfg === 'string' && rawXMinCfg.trim().length > 0) {
                const v = Number(rawXMinCfg.trim());
                if (Number.isFinite(v))
                    xMin = v;
            }
            if (typeof rawXMaxCfg === 'string' && rawXMaxCfg.trim().length > 0) {
                const v = Number(rawXMaxCfg.trim());
                if (Number.isFinite(v))
                    xMax = v;
            }
            if (typeof rawYMinCfg === 'string' && rawYMinCfg.trim().length > 0) {
                const v = Number(rawYMinCfg.trim());
                if (Number.isFinite(v))
                    yMin = v;
            }
            if (typeof rawYMaxCfg === 'string' && rawYMaxCfg.trim().length > 0) {
                const v = Number(rawYMaxCfg.trim());
                if (Number.isFinite(v))
                    yMax = v;
            }
            // Avoid zero range (would cause division by zero when normalizing)
            if (xMin === xMax) {
                xMin -= 1;
                xMax += 1;
            }
            if (yMin === yMax) {
                yMin -= 1;
                yMax += 1;
            }
            // Normalize points to [0, 1] in both axes
            const normPoints = points.map((p) => {
                const normX = (p.x - xMin) / (xMax - xMin);
                const normY = (p.y - yMin) / (yMax - yMin);
                // Optionally clamp just in case overrides are weird
                const clampedX = Math.min(1, Math.max(0, normX));
                const clampedY = Math.min(1, Math.max(0, normY));
                return {
                    label: p.label,
                    x: clampedX,
                    y: clampedY,
                    color: p.color,
                };
            });
            const lines = [];
            lines.push('quadrantChart');
            if (title)
                lines.push(`    title ${title}`);
            if (xAxisLabels)
                lines.push(`    x-axis ${xAxisLabels}`);
            if (yAxisLabels)
                lines.push(`    y-axis ${yAxisLabels}`);
            if (qTopRight)
                lines.push(`    quadrant-1 "${qTopRight}"`);
            if (qTopLeft)
                lines.push(`    quadrant-2 "${qTopLeft}"`);
            if (qBottomLeft)
                lines.push(`    quadrant-3 "${qBottomLeft}"`);
            if (qBottomRight)
                lines.push(`    quadrant-4 "${qBottomRight}"`);
            // Points (normalized)
            for (const p of normPoints) {
                const safeLabel = p.label.replace(/"/g, '\\"');
                if (p.color)
                    lines.push(`    "${safeLabel}": [${p.x}, ${p.y}] color: ${p.color}`);
                else
                    lines.push(`    "${safeLabel}": [${p.x}, ${p.y}]`);
            }
            // Make each point clickable as an internal link
            // Obsidian uses the node's text as the link target.
            // lines.push('    %% internal-link classes for points');
            // for (const p of normPoints) {
            // 	const safeLabel = p.label.replace(/"/g, '\\"');
            // 	// Note: label text must match the note name (or alias) for the link to resolve.
            // 	lines.push(`    class "${safeLabel}" internal-link;`);
            // }
            const mermaidCode = lines.join('\n');
            yield this.renderMermaid(mermaidCode);
        });
    }
}
MermaidQuadrantChartBaseView.RegistrationData = {
    id: MermaidQuadrantViewId,
    name: 'Quadrant Chart',
    icon: 'scatter-chart',
    options: [
        {
            type: 'text',
            displayName: 'Title',
            key: 'title',
            default: 'Title',
        },
        {
            type: 'property',
            displayName: 'X coordinate property (numeric)',
            key: 'xProperty',
            placeholder: 'e.g. importance',
        },
        {
            type: 'property',
            displayName: 'Y coordinate property (numeric)',
            key: 'yProperty',
            placeholder: 'e.g. urgency',
        },
        {
            type: 'group',
            displayName: 'Axis labels',
            items: [
                {
                    type: 'text',
                    displayName: 'X-axis left label',
                    key: 'xAxisLabelLeft',
                },
                {
                    type: 'text',
                    displayName: 'X-axis right label (requires left)',
                    key: 'xAxisLabelRight',
                },
                {
                    type: 'text',
                    displayName: 'Y-axis bottom label',
                    key: 'yAxisLabelBottom',
                },
                {
                    type: 'text',
                    displayName: 'Y-axis top label (requires bottom)',
                    key: 'yAxisLabelTop',
                },
            ],
        },
        {
            type: 'group',
            displayName: 'Quadrant labels',
            items: [
                {
                    type: 'text',
                    displayName: 'Top-left quadrant label',
                    key: 'qTopLeft',
                },
                {
                    type: 'text',
                    displayName: 'Top-right quadrant label',
                    key: 'qTopRight',
                },
                {
                    type: 'text',
                    displayName: 'Bottom-left quadrant label',
                    key: 'qBottomLeft',
                },
                {
                    type: 'text',
                    displayName: 'Bottom-right quadrant label',
                    key: 'qBottomRight',
                },
            ],
        },
        {
            type: 'group',
            displayName: 'Axis Ranges',
            items: [
                {
                    type: 'text',
                    displayName: 'X-min (optional)',
                    key: 'xMin',
                    placeholder: 'auto from data',
                    default: '0',
                },
                {
                    type: 'text',
                    displayName: 'X-max (optional)',
                    key: 'xMax',
                    placeholder: 'auto from data',
                    default: '1',
                },
                {
                    type: 'text',
                    displayName: 'Y-min (optional)',
                    key: 'yMin',
                    placeholder: 'auto from data',
                    default: '0',
                },
                {
                    type: 'text',
                    displayName: 'Y-max (optional)',
                    key: 'yMax',
                    placeholder: 'auto from data',
                    default: '1',
                },
            ],
        },
        {
            type: 'toggle',
            displayName: 'Show property names',
            key: 'showPropertyNames',
            default: true,
        },
        {
            type: 'multitext',
            displayName: 'Grouping palette',
            key: 'groupingPalette',
            default: defaultGroupingPalette,
        },
        {
            type: 'text',
            displayName: 'Mermaid config (optional)',
            key: 'mermaidConfig',
            placeholder: `%%{init: { 'theme': 'dark' }}%%`,
        },
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZFF1YWRyYW50Q2hhcnRCYXNlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1lcm1haWRRdWFkcmFudENoYXJ0QmFzZVZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR2hGLE1BQU0sT0FBTyw0QkFBNkIsU0FBUSxtQkFBbUI7SUFBckU7O1FBQ1UsU0FBSSxHQUFHLHFCQUFxQixDQUFDO0lBMFV2QyxDQUFDO0lBak1nQixNQUFNOztZQUVyQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3RCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFZLENBQUM7WUFFMUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUM7b0JBQzFCLElBQUksRUFBRSw0REFBNEQ7aUJBQ2xFLENBQUMsQ0FBQztnQkFDSCxPQUFPO2FBQ1A7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV2QyxJQUFJLFdBQVcsR0FBVyxFQUFFLENBQUM7WUFDN0IsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQVcsQ0FBQztZQUNuRSxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBVyxD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bnRlbnQiOlsiaW1wb3J0IHtNZXJtYWlkQmFzZVZpZXdCYXNlfSBmcm9tIFwiLi9NZXJtYWlkQmFzZVZpZXdCYXNlXCI7XG5pbXBvcnQge2RlZmF1bHRHcm91cGluZ1BhbGV0dGUsIE1lcm1haWRRdWFkcmFudFZpZXdJZH0gZnJvbSBcIi4uL2NvcmUvY29uc3RhbnRzXCI7XG5pbXBvcnQge01lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YX0gZnJvbSBcIi4uL2NvcmUvTWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhXCI7XG5cbmV4cG9ydCBjbGFzcyBNZXJtYWlkUXVhZHJhbnRDaGFydEJhc2VWaWV3IGV4dGVuZHMgTWVybWFpZEJhc2VWaWV3QmFzZSB7XG5cdHJlYWRvbmx5IHR5cGUgPSBNZXJtYWlkUXVhZHJhbnRWaWV3SWQ7XG5cblx0c3RhdGljIHJlYWRvbmx5IFJlZ2lzdHJhdGlvbkRhdGE6IE1lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YSA9IHtcblx0XHRpZDogTWVybWFpZFF1YWRyYW50Vmlld0lkLFxuXHRcdG5hbWU6ICdRdWFkcmFudCBDaGFydCcsXG5cdFx0aWNvbjogJ3NjYXR0ZXItY2hhcnQnLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1RpdGxlJyxcblx0XHRcdFx0a2V5OiAndGl0bGUnLFxuXHRcdFx0XHRkZWZhdWx0OiAnVGl0bGUnLFxuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAncHJvcGVydHknLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1ggY29vcmRpbmF0ZSBwcm9wZXJ0eSAobnVtZXJpYyknLFxuXHRcdFx0XHRrZXk6ICd4UHJvcGVydHknLFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogJ2UuZy4gaW1wb3J0YW5jZScsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAncHJvcGVydHknLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1kgY29vcmRpbmF0ZSBwcm9wZXJ0eSAobnVtZXJpYyknLFxuXHRcdFx0XHRrZXk6ICd5UHJvcGVydHknLFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogJ2UuZy4gdXJnZW5jeScsXG5cdFx0XHR9LFxuXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICdncm91cCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnQXhpcyBsYWJlbHMnLFxuXHRcdFx0XHRpdGVtczogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0XHRcdGRpc3BsYXlOYW1lOiAnWC1heGlzIGxlZnQgbGFiZWwnLFxuXHRcdFx0XHRcdFx0a2V5OiAneEF4aXNMYWJlbExlZnQnLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRcdFx0ZGlzcGxheU5hbWU6ICdYLWF4aXMgcmlnaHQgbGFiZWwgKHJlcXVpcmVzIGxlZnQpJyxcblx0XHRcdFx0XHRcdGtleTogJ3hBeGlzTGFiZWxSaWdodCcsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdFx0XHRkaXNwbGF5TmFtZTogJ1ktYXhpcyBib3R0b20gbGFiZWwnLFxuXHRcdFx0XHRcdFx0a2V5OiAneUF4aXNMYWJlbEJvdHRvbScsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdFx0XHRkaXNwbGF5TmFtZTogJ1ktYXhpcyB0b3AgbGFiZWwgKHJlcXVpcmVzIGJvdHRvbSknLFxuXHRcdFx0XHRcdFx0a2V5OiAneUF4aXNMYWJlbFRvcCcsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0sXG5cblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ2dyb3VwJyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdRdWFkcmFudCBsYWJlbHMnLFxuXHRcdFx0XHRpdGVtczogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0XHRcdGRpc3BsYXlOYW1lOiAnVG9wLWxlZnQgcXVhZHJhbnQgbGFiZWwnLFxuXHRcdFx0XHRcdFx0a2V5OiAncVRvcExlZnQnLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRcdFx0ZGlzcGxheU5hbWU6ICdUb3AtcmlnaHQgcXVhZHJhbnQgbGFiZWwnLFxuXHRcdFx0XHRcdFx0a2V5OiAncVRvcFJpZ2h0Jyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0XHRcdGRpc3BsYXlOYW1lOiAnQm90dG9tLWxlZnQgcXVhZHJhbnQgbGFiZWwnLFxuXHRcdFx0XHRcdFx0a2V5OiAncUJvdHRvbUxlZnQnLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRcdFx0ZGlzcGxheU5hbWU6ICdCb3R0b20tcmlnaHQgcXVhZHJhbnQgbGFiZWwnLFxuXHRcdFx0XHRcdFx0a2V5OiAncUJvdHRvbVJpZ2h0Jyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRdLFxuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAnZ3JvdXAnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ0F4aXMgUmFuZ2VzJyxcblx0XHRcdFx0aXRlbXM6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdFx0XHRkaXNwbGF5TmFtZTogJ1gtbWluIChvcHRpb25hbCknLFxuXHRcdFx0XHRcdFx0a2V5OiAneE1pbicsXG5cdFx0XHRcdFx0XHRwbGFjZWhvbGRlcjogJ2F1dG8gZnJvbSBkYXRhJyxcblx0XHRcdFx0XHRcdGRlZmF1bHQ6ICcwJyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0XHRcdGRpc3BsYXlOYW1lOiAnWC1tYXggKG9wdGlvbmFsKScsXG5cdFx0XHRcdFx0XHRrZXk6ICd4TWF4Jyxcblx0XHRcdFx0XHRcdHBsYWNlaG9sZGVyOiAnYXV0byBmcm9tIGRhdGEnLFxuXHRcdFx0XHRcdFx0ZGVmYXVsdDogJzEnLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRcdFx0ZGlzcGxheU5hbWU6ICdZLW1pbiAob3B0aW9uYWwpJyxcblx0XHRcdFx0XHRcdGtleTogJ3lNaW4nLFxuXHRcdFx0XHRcdFx0cGxhY2Vob2xkZXI6ICdhdXRvIGZyb20gZGF0YScsXG5cdFx0XHRcdFx0XHRkZWZhdWx0OiAnMCcsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdFx0XHRkaXNwbGF5TmFtZTogJ1ktbWF4IChvcHRpb25hbCknLFxuXHRcdFx0XHRcdFx0a2V5OiAneU1heCcsXG5cdFx0XHRcdFx0XHRwbGFjZWhvbGRlcjogJ2F1dG8gZnJvbSBkYXRhJyxcblx0XHRcdFx0XHRcdGRlZmF1bHQ6ICcxJyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRdLFxuXHRcdFx0fSxcblxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndG9nZ2xlJyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdTaG93IHByb3BlcnR5IG5hbWVzJyxcblx0XHRcdFx0a2V5OiAnc2hvd1Byb3BlcnR5TmFtZXMnLFxuXHRcdFx0XHRkZWZhdWx0OiB0cnVlLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ211bHRpdGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnR3JvdXBpbmcgcGFsZXR0ZScsXG5cdFx0XHRcdGtleTogJ2dyb3VwaW5nUGFsZXR0ZScsXG5cdFx0XHRcdGRlZmF1bHQ6IGRlZmF1bHRHcm91cGluZ1BhbGV0dGUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnTWVybWFpZCBjb25maWcgKG9wdGlvbmFsKScsXG5cdFx0XHRcdGtleTogJ21lcm1haWRDb25maWcnLFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogYCUle2luaXQ6IHsgJ3RoZW1lJzogJ2RhcmsnIH19JSVgLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9O1xuXG5cdHByb3RlY3RlZCBhc3luYyByZW5kZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cblx0XHRjb25zdCB4UHJvcGVydHlJZCA9IHRoaXMuY29uZmlnLmdldEFzUHJvcGVydHlJZCgneFByb3BlcnR5Jyk7XG5cdFx0Y29uc3QgeVByb3BlcnR5SWQgPSB0aGlzLmNvbmZpZy5nZXRBc1Byb3BlcnR5SWQoJ3lQcm9wZXJ0eScpO1xuXHRcdGNvbnN0IHNob3dQcm9wZXJ0eU5hbWVzID0gdGhpcy5jb25maWcuZ2V0KCdzaG93UHJvcGVydHlOYW1lcycpIGFzIEJvb2xlYW47XG5cblx0XHRpZiAoIXhQcm9wZXJ0eUlkIHx8ICF5UHJvcGVydHlJZCkge1xuXHRcdFx0dGhpcy5jb250YWluZXJFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHR0ZXh0OiAnQ29uZmlndXJlIG51bWVyaWMgWCBhbmQgWSBwcm9wZXJ0aWVzIGluIHRoZSB2aWV3IHNldHRpbmdzLicsXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB0aXRsZSA9IHRoaXMuY29uZmlnLmdldCgndGl0bGUnKTtcblxuXHRcdGxldCB4QXhpc0xhYmVsczogc3RyaW5nID0gXCJcIjtcblx0XHRjb25zdCB4QXhpc0xhYmVsTGVmdCA9IHRoaXMuY29uZmlnLmdldCgneEF4aXNMYWJlbExlZnQnKSBhcyBzdHJpbmc7XG5cdFx0Y29uc3QgeEF4aXNMYWJlbFJpZ2h0ID0gdGhpcy5jb25maWcuZ2V0KCd4QXhpc0xhYmVsUmlnaHQnKSBhcyBzdHJpbmc7XG5cdFx0aWYgKHhBeGlzTGFiZWxMZWZ0KVxuXHRcdFx0eEF4aXNMYWJlbHMgPSB4QXhpc0xhYmVsTGVmdDtcblx0XHRpZiAoeEF4aXNMYWJlbFJpZ2h0ICYmIHhBeGlzTGFiZWxzKVxuXHRcdFx0eEF4aXNMYWJlbHMgKz0gYCAtLT4gJHt4QXhpc0xhYmVsUmlnaHR9YDtcblxuXHRcdGxldCB5QXhpc0xhYmVsczogc3RyaW5nID0gXCJcIjtcblx0XHRjb25zdCB5QXhpc0xhYmVsQm90dG9tID0gdGhpcy5jb25maWcuZ2V0KCd5QXhpc0xhYmVsQm90dG9tJykgYXMgc3RyaW5nO1xuXHRcdGNvbnN0IHlBeGlzTGFiZWxUb3AgPSB0aGlzLmNvbmZpZy5nZXQoJ3lBeGlzTGFiZWxUb3AnKSBhcyBzdHJpbmc7XG5cdFx0aWYgKHlBeGlzTGFiZWxCb3R0b20pXG5cdFx0XHR5QXhpc0xhYmVscyA9IHlBeGlzTGFiZWxCb3R0b207XG5cdFx0aWYgKHlBeGlzTGFiZWxUb3AgJiYgeUF4aXNMYWJlbHMpXG5cdFx0XHR5QXhpc0xhYmVscyArPSBgIC0tPiAke3lBeGlzTGFiZWxUb3B9YDtcblxuXHRcdGNvbnN0IHFUb3BMZWZ0ID0gdGhpcy5jb25maWcuZ2V0KCdxVG9wTGVmdCcpO1xuXHRcdGNvbnN0IHFUb3BSaWdodCA9IHRoaXMuY29uZmlnLmdldCgncVRvcFJpZ2h0Jyk7XG5cdFx0Y29uc3QgcUJvdHRvbUxlZnQgPSB0aGlzLmNvbmZpZy5nZXQoJ3FCb3R0b21MZWZ0Jyk7XG5cdFx0Y29uc3QgcUJvdHRvbVJpZ2h0ID0gdGhpcy5jb25maWcuZ2V0KCdxQm90dG9tUmlnaHQnKTtcblxuXHRcdHR5cGUgUG9pbnQgPSB7XG5cdFx0XHRsYWJlbDogc3RyaW5nO1xuXHRcdFx0eDogbnVtYmVyO1xuXHRcdFx0eTogbnVtYmVyO1xuXHRcdFx0Y29sb3I6IHN0cmluZztcblx0XHR9O1xuXG5cdFx0Y29uc3QgcG9pbnRzOiBQb2ludFtdID0gW107XG5cblx0XHRsZXQgbWluWCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcblx0XHRsZXQgbWF4WCA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcblx0XHRsZXQgbWluWSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcblx0XHRsZXQgbWF4WSA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcblxuXHRcdGNvbnN0IHJhd1BhbGV0dGUgPSB0aGlzLmNvbmZpZy5nZXQoJ2dyb3VwaW5nUGFsZXR0ZScpIGFzIHVua25vd247XG5cblx0XHRjb25zdCBwYWxldHRlID1cblx0XHRcdEFycmF5LmlzQXJyYXkocmF3UGFsZXR0ZSlcblx0XHRcdFx0PyByYXdQYWxldHRlXG5cdFx0XHRcdFx0Lm1hcCgodikgPT4gdj8udG9TdHJpbmcoKS50cmltKCkpXG5cdFx0XHRcdFx0LmZpbHRlcigodikgPT4gdiAmJiB2Lmxlbmd0aCA+IDApXG5cdFx0XHRcdDogZGVmYXVsdEdyb3VwaW5nUGFsZXR0ZTtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheShyYXdQYWxldHRlKSB8fCBwYWxldHRlLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cGFsZXR0ZS5zcGxpY2UoMCwgcGFsZXR0ZS5sZW5ndGgsIC4uLmRlZmF1bHRHcm91cGluZ1BhbGV0dGUpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGdyb3VwcyA9IHRoaXMuZGF0YS5ncm91cGVkRGF0YTtcblx0XHRjb25zdCBncm91cGluZ0VuYWJsZWQgPSBncm91cHMubGVuZ3RoID4gMSB8fCAoZ3JvdXBzLmxlbmd0aCA9PT0gMSAmJiBncm91cHNbMF0ua2V5ICE9PSB1bmRlZmluZWQpO1xuXG5cdFx0Zm9yIChsZXQgZ2kgPSAwOyBnaSA8IGdyb3Vwcy5sZW5ndGg7IGdpKyspIHtcblx0XHRcdGNvbnN0IGdyb3VwID0gZ3JvdXBzW2dpXTtcblx0XHRcdGNvbnN0IGdyb3VwQ29sb3IgPSBncm91cGluZ0VuYWJsZWQgPyBwYWxldHRlW2dpICUgcGFsZXR0ZS5sZW5ndGhdIDogbnVsbDtcblxuXHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiBncm91cC5lbnRyaWVzKSB7XG5cdFx0XHRcdGNvbnN0IHhWYWwgPSBlbnRyeS5nZXRWYWx1ZSh4UHJvcGVydHlJZCk7XG5cdFx0XHRcdGNvbnN0IHlWYWwgPSBlbnRyeS5nZXRWYWx1ZSh5UHJvcGVydHlJZCk7XG5cblx0XHRcdFx0aWYgKCF4VmFsIHx8IHhWYWwgPT0gbnVsbCB8fCAheVZhbCB8fCB5VmFsID09IG51bGwpIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHhOdW0gPSBOdW1iZXIoeFZhbC50b1N0cmluZygpKTtcblx0XHRcdFx0Y29uc3QgeU51bSA9IE51bWJlcih5VmFsLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRpZiAoIU51bWJlci5pc0Zpbml0ZSh4TnVtKSB8fCAhTnVtYmVyLmlzRmluaXRlKHlOdW0pKSBjb250aW51ZTtcblxuXHRcdFx0XHRjb25zdCBsYWJlbCA9IHRoaXMuZ2V0TGFiZWxXaXRoUHJvcGVydGllcyhlbnRyeS5maWxlLCBzaG93UHJvcGVydHlOYW1lcywgXCIsIFwiLCBcIsuQXCIpO1xuXG5cdFx0XHRcdHBvaW50cy5wdXNoKHtsYWJlbCwgeDogeE51bSwgeTogeU51bSwgY29sb3I6IGdyb3VwQ29sb3J9KTtcblxuXHRcdFx0XHRpZiAoeE51bSA8IG1pblgpIG1pblggPSB4TnVtO1xuXHRcdFx0XHRpZiAoeE51bSA+IG1heFgpIG1heFggPSB4TnVtO1xuXHRcdFx0XHRpZiAoeU51bSA8IG1pblkpIG1pblkgPSB5TnVtO1xuXHRcdFx0XHRpZiAoeU51bSA+IG1heFkpIG1heFkgPSB5TnVtO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChwb2ludHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6ICdObyBudW1lcmljIGRhdGEgZm91bmQgZm9yIHRoZSBzZWxlY3RlZCBYL1kgcHJvcGVydGllcy4nLFxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gUmVhZCBvcHRpb25hbCBvdmVycmlkZXMgZnJvbSBjb25maWdcblx0XHRjb25zdCByYXdYTWluQ2ZnID0gdGhpcy5jb25maWcuZ2V0KCd4TWluJyk7XG5cdFx0Y29uc3QgcmF3WE1heENmZyA9IHRoaXMuY29uZmlnLmdldCgneE1heCcpO1xuXHRcdGNvbnN0IHJhd1lNaW5DZmcgPSB0aGlzLmNvbmZpZy5nZXQoJ3lNaW4nKTtcblx0XHRjb25zdCByYXdZTWF4Q2ZnID0gdGhpcy5jb25maWcuZ2V0KCd5TWF4Jyk7XG5cblx0XHRsZXQgeE1pbiA9IG1pblg7XG5cdFx0bGV0IHhNYXggPSBtYXhYO1xuXHRcdGxldCB5TWluID0gbWluWTtcblx0XHRsZXQgeU1heCA9IG1heFk7XG5cblx0XHRpZiAodHlwZW9mIHJhd1hNaW5DZmcgPT09ICdzdHJpbmcnICYmIHJhd1hNaW5DZmcudHJpbSgpLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IHYgPSBOdW1iZXIocmF3WE1pbkNmZy50cmltKCkpO1xuXHRcdFx0aWYgKE51bWJlci5pc0Zpbml0ZSh2KSkgeE1pbiA9IHY7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgcmF3WE1heENmZyA9PT0gJ3N0cmluZycgJiYgcmF3WE1heENmZy50cmltKCkubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgdiA9IE51bWJlcihyYXdYTWF4Q2ZnLnRyaW0oKSk7XG5cdFx0XHRpZiAoTnVtYmVyLmlzRmluaXRlKHYpKSB4TWF4ID0gdjtcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiByYXdZTWluQ2ZnID09PSAnc3RyaW5nJyAmJiByYXdZTWluQ2ZnLnRyaW0oKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCB2ID0gTnVtYmVyKHJhd1lNaW5DZmcudHJpbSgpKTtcblx0XHRcdGlmIChOdW1iZXIuaXNGaW5pdGUodikpIHlNaW4gPSB2O1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIHJhd1lNYXhDZmcgPT09ICdzdHJpbmcnICYmIHJhd1lNYXhDZmcudHJpbSgpLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IHYgPSBOdW1iZXIocmF3WU1heENmZy50cmltKCkpO1xuXHRcdFx0aWYgKE51bWJlci5pc0Zpbml0ZSh2KSkgeU1heCA9IHY7XG5cdFx0fVxuXG5cdFx0Ly8gQXZvaWQgemVybyByYW5nZSAod291bGQgY2F1c2UgZGl2aXNpb24gYnkgemVybyB3aGVuIG5vcm1hbGl6aW5nKVxuXHRcdGlmICh4TWluID09PSB4TWF4KSB7XG5cdFx0XHR4TWluIC09IDE7XG5cdFx0XHR4TWF4ICs9IDE7XG5cdFx0fVxuXHRcdGlmICh5TWluID09PSB5TWF4KSB7XG5cdFx0XHR5TWluIC09IDE7XG5cdFx0XHR5TWF4ICs9IDE7XG5cdFx0fVxuXG5cdFx0Ly8gTm9ybWFsaXplIHBvaW50cyB0byBbMCwgMV0gaW4gYm90aCBheGVzXG5cdFx0Y29uc3Qgbm9ybVBvaW50cyA9IHBvaW50cy5tYXAoKHApID0+IHtcblx0XHRcdGNvbnN0IG5vcm1YID0gKHAueCAtIHhNaW4pIC8gKHhNYXggLSB4TWluKTtcblx0XHRcdGNvbnN0IG5vcm1ZID0gKHAueSAtIHlNaW4pIC8gKHlNYXggLSB5TWluKTtcblxuXHRcdFx0Ly8gT3B0aW9uYWxseSBjbGFtcCBqdXN0IGluIGNhc2Ugb3ZlcnJpZGVzIGFyZSB3ZWlyZFxuXHRcdFx0Y29uc3QgY2xhbXBlZFggPSBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCBub3JtWCkpO1xuXHRcdFx0Y29uc3QgY2xhbXBlZFkgPSBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCBub3JtWSkpO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRsYWJlbDogcC5sYWJlbCxcblx0XHRcdFx0eDogY2xhbXBlZFgsXG5cdFx0XHRcdHk6IGNsYW1wZWRZLFxuXHRcdFx0XHRjb2xvcjogcC5jb2xvcixcblx0XHRcdH07XG5cdFx0fSk7XG5cblx0XHRjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblx0XHRsaW5lcy5wdXNoKCdxdWFkcmFudENoYXJ0Jyk7XG5cdFx0aWYgKHRpdGxlKVxuXHRcdFx0bGluZXMucHVzaChgICAgIHRpdGxlICR7dGl0bGV9YCk7XG5cdFx0aWYgKHhBeGlzTGFiZWxzKVxuXHRcdFx0bGluZXMucHVzaChgICAgIHgtYXhpcyAke3hBeGlzTGFiZWxzfWApO1xuXHRcdGlmICh5QXhpc0xhYmVscylcblx0XHRcdGxpbmVzLnB1c2goYCAgICB5LWF4aXMgJHt5QXhpc0xhYmVsc31gKTtcblx0XHRpZiAocVRvcFJpZ2h0KVxuXHRcdFx0bGluZXMucHVzaChgICAgIHF1YWRyYW50LTEgXCIke3FUb3BSaWdodH1cImApO1xuXHRcdGlmIChxVG9wTGVmdClcblx0XHRcdGxpbmVzLnB1c2goYCAgICBxdWFkcmFudC0yIFwiJHtxVG9wTGVmdH1cImApO1xuXHRcdGlmIChxQm90dG9tTGVmdClcblx0XHRcdGxpbmVzLnB1c2goYCAgICBxdWFkcmFudC0zIFwiJHtxQm90dG9tTGVmdH1cImApO1xuXHRcdGlmIChxQm90dG9tUmlnaHQpXG5cdFx0XHRsaW5lcy5wdXNoKGAgICAgcXVhZHJhbnQtNCBcIiR7cUJvdHRvbVJpZ2h0fVwiYCk7XG5cblx0XHQvLyBQb2ludHMgKG5vcm1hbGl6ZWQpXG5cdFx0Zm9yIChjb25zdCBwIG9mIG5vcm1Qb2ludHMpIHtcblx0XHRcdGNvbnN0IHNhZmVMYWJlbCA9IHAubGFiZWwucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpO1xuXHRcdFx0aWYgKHAuY29sb3IpXG5cdFx0XHRcdGxpbmVzLnB1c2goYCAgICBcIiR7c2FmZUxhYmVsfVwiOiBbJHtwLnh9LCAke3AueX1dIGNvbG9yOiAke3AuY29sb3J9YCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGxpbmVzLnB1c2goYCAgICBcIiR7c2FmZUxhYmVsfVwiOiBbJHtwLnh9LCAke3AueX1dYCk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFrZSBlYWNoIHBvaW50IGNsaWNrYWJsZSBhcyBhbiBpbnRlcm5hbCBsaW5rXG5cdFx0Ly8gT2JzaWRpYW4gdXNlcyB0aGUgbm9kZSdzIHRleHQgYXMgdGhlIGxpbmsgdGFyZ2V0LlxuXHRcdC8vIGxpbmVzLnB1c2goJyAgICAlJSBpbnRlcm5hbC1saW5rIGNsYXNzZXMgZm9yIHBvaW50cycpO1xuXHRcdC8vIGZvciAoY29uc3QgcCBvZiBub3JtUG9pbnRzKSB7XG5cdFx0Ly8gXHRjb25zdCBzYWZlTGFiZWwgPSBwLmxhYmVsLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcblx0XHQvLyBcdC8vIE5vdGU6IGxhYmVsIHRleHQgbXVzdCBtYXRjaCB0aGUgbm90ZSBuYW1lIChvciBhbGlhcykgZm9yIHRoZSBsaW5rIHRvIHJlc29sdmUuXG5cdFx0Ly8gXHRsaW5lcy5wdXNoKGAgICAgY2xhc3MgXCIke3NhZmVMYWJlbH1cIiBpbnRlcm5hbC1saW5rO2ApO1xuXHRcdC8vIH1cblxuXHRcdGNvbnN0IG1lcm1haWRDb2RlID0gbGluZXMuam9pbignXFxuJyk7XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJNZXJtYWlkKG1lcm1haWRDb2RlKTtcblx0fVxufVxuIl19