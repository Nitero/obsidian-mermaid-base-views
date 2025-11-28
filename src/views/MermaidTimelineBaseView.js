import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from "./MermaidBaseViewBase";
import { MermaidTimelineViewId } from "../core/constants";
export class MermaidTimelineBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidTimelineViewId;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            const timePropertyId = this.config.getAsPropertyId('timeProperty');
            const showPropertyNames = this.config.get('showPropertyNames');
            if (!timePropertyId) {
                this.containerEl.createDiv({
                    text: 'Configure a time property in the view settings to render the timeline.',
                });
                return;
            }
            const title = this.config.get('title');
            const rawCutoff = this.config.get('cutoff');
            const granularity = parseGranularity(rawCutoff);
            const groups = new Map();
            // Collect events from the current query result
            for (const group of this.data.groupedData) {
                for (const entry of group.entries) {
                    const tVal = entry.getValue(timePropertyId);
                    if (!tVal || tVal == null)
                        continue;
                    const tText = tVal.toString().trim();
                    if (!tText)
                        continue;
                    const d = new Date(tText);
                    if (Number.isNaN(d.getTime()))
                        continue;
                    const { key, label, truncatedDate } = truncateDate(d, granularity);
                    // Determine event label for this note
                    let eventLabel = this.getLabelWithProperties(entry.file, showPropertyNames, "<br>", "ː");
                    // Sanitize event text (colons/newlines break the timeline syntax)
                    eventLabel = eventLabel
                        .replace(/[\r\n]/g, ' ')
                        .replace(/:/g, '-')
                        .trim();
                    if (!eventLabel)
                        continue;
                    let g = groups.get(key);
                    if (!g) {
                        g = { key, label, date: truncatedDate, events: [] };
                        groups.set(key, g);
                    }
                    g.events.push(eventLabel);
                }
            }
            if (groups.size === 0) {
                this.containerEl.createDiv({
                    text: 'No valid time values found for the selected property.',
                });
                return;
            }
            // Sort groups chronologically
            const sortedGroups = Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
            // Build Mermaid timeline mermaidCode
            const lines = [];
            lines.push('timeline');
            if (title)
                lines.push(`    title ${title}`);
            for (const g of sortedGroups) {
                if (g.events.length === 0)
                    continue;
                // Single line per time period, multiple events via extra colons
                // {time period} : {event1} : {event2} : ...
                let line = `    ${g.label} : ${g.events[0]}`;
                for (let i = 1; i < g.events.length; i++) {
                    line += ` : ${g.events[i]}`;
                }
                lines.push(line);
            }
            const mermaidCode = lines.join('\n');
            yield this.renderMermaid(mermaidCode);
        });
    }
}
MermaidTimelineBaseView.RegistrationData = {
    id: MermaidTimelineViewId,
    name: 'Timeline',
    icon: 'chart-no-axes-gantt',
    options: [
        {
            type: 'text',
            displayName: 'Title',
            key: 'title',
            default: 'Title',
        },
        {
            type: 'property',
            displayName: 'Time property (date / time)',
            key: 'timeProperty',
            placeholder: 'e.g. created, modified, custom date',
        },
        {
            type: 'dropdown',
            displayName: 'Cutoff',
            key: 'cutoff',
            default: 'day',
            options: {
                "year": "year",
                "month": "month",
                "day": "day",
                "hour": "hour",
                "minute": "minute",
                "second": "second"
            },
        },
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
function parseGranularity(raw) {
    if (typeof raw !== 'string')
        return 'day';
    const s = raw.trim().toLowerCase();
    switch (s) {
        case 'year':
        case 'month':
        case 'day':
        case 'hour':
        case 'minute':
        case 'second':
            return s;
        default:
            return 'day';
    }
}
function pad2(n) {
    return n < 10 ? `0${n}` : `${n}`;
}
function truncateDate(date, granularity) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    let truncated;
    let label;
    switch (granularity) {
        case 'year':
            truncated = new Date(year, 0, 1, 0, 0, 0, 0);
            label = `${year}`;
            break;
        case 'month':
            truncated = new Date(year, month, 1, 0, 0, 0, 0);
            label = `${year}-${pad2(month + 1)}`;
            break;
        case 'day':
            truncated = new Date(year, month, day, 0, 0, 0, 0);
            label = `${year}-${pad2(month + 1)}-${pad2(day)}`;
            break;
        case 'hour':
            truncated = new Date(year, month, day, hour, 0, 0, 0);
            // ❗ no colon here, use "17h" style to keep Mermaid happy
            label = `${year}-${pad2(month + 1)}-${pad2(day)} ${pad2(hour)}h`;
            break;
        case 'minute':
            truncated = new Date(year, month, day, hour, minute, 0, 0);
            // "17h30" instead of "17:30"
            label = `${year}-${pad2(month + 1)}-${pad2(day)} ${pad2(hour)}h${pad2(minute)}`;
            break;
        case 'second':
            truncated = new Date(year, month, day, hour, minute, second, 0);
            // "17h30m15s" instead of "17:30:15"
            label = `${year}-${pad2(month + 1)}-${pad2(day)} ${pad2(hour)}h${pad2(minute)}m${pad2(second)}s`;
            break;
    }
    return { key: label, label, truncatedDate: truncated };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZFRpbWVsaW5lQmFzZVZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJNZXJtYWlkVGltZWxpbmVCYXNlVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHeEQsTUFBTSxPQUFPLHVCQUF3QixTQUFRLG1CQUFtQjtJQUFoRTs7UUFDVSxTQUFJLEdBQUcscUJBQXFCLENBQUM7SUErSXZDLENBQUM7SUEvRmdCLE1BQU07O1lBQ3JCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ25FLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQVksQ0FBQztZQUUxRSxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQztvQkFDMUIsSUFBSSxFQUFFLHdFQUF3RTtpQkFDOUUsQ0FBQyxDQUFDO2dCQUNILE9BQU87YUFDUDtZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXZDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sV0FBVyxHQUFHLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBU2hELE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1lBRXhDLCtDQUErQztZQUMvQyxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUMxQyxLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7b0JBQ2xDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQzVDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUk7d0JBQUUsU0FBUztvQkFFcEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNyQyxJQUFJLENBQUMsS0FBSzt3QkFBRSxTQUFTO29CQUVyQixNQUFNLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDMUIsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFBRSxTQUFTO29CQUV4QyxNQUFNLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUMsR0FBRyxZQUFZLENBQy9DLENBQUMsRUFDRCxXQUFXLENBQ1gsQ0FBQztvQkFFRixzQ0FBc0M7b0JBQ3RDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFFekYsa0VBQWtFO29CQUNsRSxVQUFVLEdBQUcsVUFBVTt5QkFDckIsT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUM7eUJBQ3ZCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDO3lCQUNsQixJQUFJLEVBQUUsQ0FBQztvQkFFVCxJQUFJLENBQUMsVUFBVTt3QkFBRSxTQUFTO29CQUUxQixJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN4QixJQUFJLENBQUMsQ0FBQyxFQUFFO3dCQUNQLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFDLENBQUM7d0JBQ2xELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO3FCQUNuQjtvQkFDRCxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDMUI7YUFDRDtZQUVELElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO29CQUMxQixJQUFJLEVBQUUsdURBQXVEO2lCQUM3RCxDQUFDLENBQUM7Z0JBQ0gsT0FBTzthQUNQO1lBRUQsOEJBQThCO1lBQzlCLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUNwRCxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FDN0MsQ0FBQztZQUVGLHFDQUFxQztZQUNyQyxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7WUFDM0IsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2QixJQUFJLEtBQUs7Z0JBQ1IsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLEtBQUssRUFBRSxDQUFDLENBQUM7WUFFbEMsS0FBSyxNQUFNLENBQUMsSUFBSSxZQUFZLEVBQUU7Z0JBQzdCLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQztvQkFBRSxTQUFTO2dCQUVwQyxnRUFBZ0U7Z0JBQ2hFLDRDQUE0QztnQkFDNUMsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUN6QyxJQUFJLElBQUksTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7aUJBQzVCO2dCQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakI7WUFFRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDO0tBQUE7O0FBNUllLHdDQUFnQixHQUFnQztJQUMvRCxFQUFFLEVBQUUscUJBQXFCO0lBQ3pCLElBQUksRUFBRSxVQUFVO0lBQ2hCLElBQUksRUFBRSxxQkFBcUI7SUFDM0IsT0FBTyxFQUFFO1FBQ1I7WUFDQyxJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRSxPQUFPO1lBQ3BCLEdBQUcsRUFBRSxPQUFPO1lBQ1osT0FBTyxFQUFFLE9BQU87U0FDaEI7UUFDRDtZQUNDLElBQUksRUFBRSxVQUFVO1lBQ2hCLFdBQVcsRUFBRSw2QkFBNkI7WUFDMUMsR0FBRyxFQUFFLGNBQWM7WUFDbkIsV0FBVyxFQUFFLHFDQUFxQztTQUNsRDtRQUNEO1lBQ0MsSUFBSSxFQUFFLFVBQVU7WUFDaEIsV0FBVyxFQUFFLFFBQVE7WUFDckIsR0FBRyxFQUFFLFFBQVE7WUFDYixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRTtnQkFDUixNQUFNLEVBQUUsTUFBTTtnQkFDZCxPQUFPLEVBQUUsT0FBTztnQkFDaEIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osTUFBTSxFQUFFLE1BQU07Z0JBQ2QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFFBQVEsRUFBRSxRQUFRO2FBQ2xCO1NBQ0Q7UUFDRDtZQUNDLElBQUksRUFBRSxRQUFRO1lBQ2QsV0FBVyxFQUFFLHFCQUFxQjtZQUNsQyxHQUFHLEVBQUUsbUJBQW1CO1lBQ3hCLE9BQU8sRUFBRSxJQUFJO1NBQ2I7UUFDRDtZQUNDLElBQUksRUFBRSxNQUFNO1lBQ1osV0FBVyxFQUFFLDJCQUEyQjtZQUN4QyxHQUFHLEVBQUUsZUFBZTtZQUNwQixXQUFXLEVBQUUsaUNBQWlDO1NBQzlDO0tBQ0Q7Q0FDRCxDQUFDO0FBcUdILFNBQVMsZ0JBQWdCLENBQUMsR0FBWTtJQUNyQyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUMxQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbkMsUUFBUSxDQUFDLEVBQUU7UUFDVixLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssT0FBTyxDQUFDO1FBQ2IsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssUUFBUSxDQUFDO1FBQ2QsS0FBSyxRQUFRO1lBQ1osT0FBTyxDQUFDLENBQUM7UUFDVjtZQUNDLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDRixDQUFDO0FBRUQsU0FBUyxJQUFJLENBQUMsQ0FBUztJQUN0QixPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDbEMsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUNwQixJQUFVLEVBQ1YsV0FBNEI7SUFFNUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2hDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFVBQVU7SUFDekMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDakMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBRWpDLElBQUksU0FBZSxDQUFDO0lBQ3BCLElBQUksS0FBYSxDQUFDO0lBRWxCLFFBQVEsV0FBVyxFQUFFO1FBQ3BCLEtBQUssTUFBTTtZQUNWLFNBQVMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QyxLQUFLLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQztZQUNsQixNQUFNO1FBRVAsS0FBSyxPQUFPO1lBQ1gsU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pELEtBQUssR0FBRyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDckMsTUFBTTtRQUVQLEtBQUssS0FBSztZQUNULFNBQVMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRCxLQUFLLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNO1FBRVAsS0FBSyxNQUFNO1lBQ1YsU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RELHlEQUF5RDtZQUN6RCxLQUFLLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUN0RCxJQUFJLENBQ0osR0FBRyxDQUFDO1lBQ0wsTUFBTTtRQUVQLEtBQUssUUFBUTtZQUNaLFNBQVMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRCw2QkFBNkI7WUFDN0IsS0FBSyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FDdEQsSUFBSSxDQUNKLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDcEIsTUFBTTtRQUVQLEtBQUssUUFBUTtZQUNaLFNBQVMsR0FBRyxJQUFJLElBQUksQ0FDbkIsSUFBSSxFQUNKLEtBQUssRUFDTCxHQUFHLEVBQ0gsSUFBSSxFQUNKLE1BQU0sRUFDTixNQUFNLEVBQ04sQ0FBQyxDQUNELENBQUM7WUFDRixvQ0FBb0M7WUFDcEMsS0FBSyxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FDdEQsSUFBSSxDQUNKLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQ3JDLE1BQU07S0FDUDtJQUVELE9BQU8sRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFDLENBQUM7QUFDdEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TWVybWFpZEJhc2VWaWV3QmFzZX0gZnJvbSBcIi4vTWVybWFpZEJhc2VWaWV3QmFzZVwiO1xuaW1wb3J0IHtNZXJtYWlkVGltZWxpbmVWaWV3SWR9IGZyb20gXCIuLi9jb3JlL2NvbnN0YW50c1wiO1xuaW1wb3J0IHtNZXJtYWlkVmlld1JlZ2lzdHJhdGlvbkRhdGF9IGZyb20gXCIuLi9jb3JlL01lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YVwiO1xuXG5leHBvcnQgY2xhc3MgTWVybWFpZFRpbWVsaW5lQmFzZVZpZXcgZXh0ZW5kcyBNZXJtYWlkQmFzZVZpZXdCYXNlIHtcblx0cmVhZG9ubHkgdHlwZSA9IE1lcm1haWRUaW1lbGluZVZpZXdJZDtcblxuXHRzdGF0aWMgcmVhZG9ubHkgUmVnaXN0cmF0aW9uRGF0YTogTWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhID0ge1xuXHRcdGlkOiBNZXJtYWlkVGltZWxpbmVWaWV3SWQsXG5cdFx0bmFtZTogJ1RpbWVsaW5lJyxcblx0XHRpY29uOiAnY2hhcnQtbm8tYXhlcy1nYW50dCcsXG5cdFx0b3B0aW9uczogW1xuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnVGl0bGUnLFxuXHRcdFx0XHRrZXk6ICd0aXRsZScsXG5cdFx0XHRcdGRlZmF1bHQ6ICdUaXRsZScsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAncHJvcGVydHknLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1RpbWUgcHJvcGVydHkgKGRhdGUgLyB0aW1lKScsXG5cdFx0XHRcdGtleTogJ3RpbWVQcm9wZXJ0eScsXG5cdFx0XHRcdHBsYWNlaG9sZGVyOiAnZS5nLiBjcmVhdGVkLCBtb2RpZmllZCwgY3VzdG9tIGRhdGUnLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ2Ryb3Bkb3duJyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdDdXRvZmYnLFxuXHRcdFx0XHRrZXk6ICdjdXRvZmYnLFxuXHRcdFx0XHRkZWZhdWx0OiAnZGF5Jyxcblx0XHRcdFx0b3B0aW9uczoge1xuXHRcdFx0XHRcdFwieWVhclwiOiBcInllYXJcIixcblx0XHRcdFx0XHRcIm1vbnRoXCI6IFwibW9udGhcIixcblx0XHRcdFx0XHRcImRheVwiOiBcImRheVwiLFxuXHRcdFx0XHRcdFwiaG91clwiOiBcImhvdXJcIixcblx0XHRcdFx0XHRcIm1pbnV0ZVwiOiBcIm1pbnV0ZVwiLFxuXHRcdFx0XHRcdFwic2Vjb25kXCI6IFwic2Vjb25kXCJcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0b2dnbGUnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1Nob3cgcHJvcGVydHkgbmFtZXMnLFxuXHRcdFx0XHRrZXk6ICdzaG93UHJvcGVydHlOYW1lcycsXG5cdFx0XHRcdGRlZmF1bHQ6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnTWVybWFpZCBjb25maWcgKG9wdGlvbmFsKScsXG5cdFx0XHRcdGtleTogJ21lcm1haWRDb25maWcnLFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogYCUle2luaXQ6IHsgJ3RoZW1lJzogJ2RhcmsnIH19JSVgLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9O1xuXG5cdHByb3RlY3RlZCBhc3luYyByZW5kZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdGltZVByb3BlcnR5SWQgPSB0aGlzLmNvbmZpZy5nZXRBc1Byb3BlcnR5SWQoJ3RpbWVQcm9wZXJ0eScpO1xuXHRcdGNvbnN0IHNob3dQcm9wZXJ0eU5hbWVzID0gdGhpcy5jb25maWcuZ2V0KCdzaG93UHJvcGVydHlOYW1lcycpIGFzIEJvb2xlYW47XG5cblx0XHRpZiAoIXRpbWVQcm9wZXJ0eUlkKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6ICdDb25maWd1cmUgYSB0aW1lIHByb3BlcnR5IGluIHRoZSB2aWV3IHNldHRpbmdzIHRvIHJlbmRlciB0aGUgdGltZWxpbmUuJyxcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHRpdGxlID0gdGhpcy5jb25maWcuZ2V0KCd0aXRsZScpO1xuXG5cdFx0Y29uc3QgcmF3Q3V0b2ZmID0gdGhpcy5jb25maWcuZ2V0KCdjdXRvZmYnKTtcblx0XHRjb25zdCBncmFudWxhcml0eSA9IHBhcnNlR3JhbnVsYXJpdHkocmF3Q3V0b2ZmKTtcblxuXHRcdHR5cGUgR3JvdXAgPSB7XG5cdFx0XHRrZXk6IHN0cmluZztcblx0XHRcdGxhYmVsOiBzdHJpbmc7XG5cdFx0XHRkYXRlOiBEYXRlO1xuXHRcdFx0ZXZlbnRzOiBzdHJpbmdbXTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgZ3JvdXBzID0gbmV3IE1hcDxzdHJpbmcsIEdyb3VwPigpO1xuXG5cdFx0Ly8gQ29sbGVjdCBldmVudHMgZnJvbSB0aGUgY3VycmVudCBxdWVyeSByZXN1bHRcblx0XHRmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMuZGF0YS5ncm91cGVkRGF0YSkge1xuXHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiBncm91cC5lbnRyaWVzKSB7XG5cdFx0XHRcdGNvbnN0IHRWYWwgPSBlbnRyeS5nZXRWYWx1ZSh0aW1lUHJvcGVydHlJZCk7XG5cdFx0XHRcdGlmICghdFZhbCB8fCB0VmFsID09IG51bGwpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdGNvbnN0IHRUZXh0ID0gdFZhbC50b1N0cmluZygpLnRyaW0oKTtcblx0XHRcdFx0aWYgKCF0VGV4dCkgY29udGludWU7XG5cblx0XHRcdFx0Y29uc3QgZCA9IG5ldyBEYXRlKHRUZXh0KTtcblx0XHRcdFx0aWYgKE51bWJlci5pc05hTihkLmdldFRpbWUoKSkpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdGNvbnN0IHtrZXksIGxhYmVsLCB0cnVuY2F0ZWREYXRlfSA9IHRydW5jYXRlRGF0ZShcblx0XHRcdFx0XHRkLFxuXHRcdFx0XHRcdGdyYW51bGFyaXR5LFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdC8vIERldGVybWluZSBldmVudCBsYWJlbCBmb3IgdGhpcyBub3RlXG5cdFx0XHRcdGxldCBldmVudExhYmVsID0gdGhpcy5nZXRMYWJlbFdpdGhQcm9wZXJ0aWVzKGVudHJ5LmZpbGUsIHNob3dQcm9wZXJ0eU5hbWVzLCBcIjxicj5cIiwgXCLLkFwiKTtcblxuXHRcdFx0XHQvLyBTYW5pdGl6ZSBldmVudCB0ZXh0IChjb2xvbnMvbmV3bGluZXMgYnJlYWsgdGhlIHRpbWVsaW5lIHN5bnRheClcblx0XHRcdFx0ZXZlbnRMYWJlbCA9IGV2ZW50TGFiZWxcblx0XHRcdFx0XHQucmVwbGFjZSgvW1xcclxcbl0vZywgJyAnKVxuXHRcdFx0XHRcdC5yZXBsYWNlKC86L2csICctJylcblx0XHRcdFx0XHQudHJpbSgpO1xuXG5cdFx0XHRcdGlmICghZXZlbnRMYWJlbCkgY29udGludWU7XG5cblx0XHRcdFx0bGV0IGcgPSBncm91cHMuZ2V0KGtleSk7XG5cdFx0XHRcdGlmICghZykge1xuXHRcdFx0XHRcdGcgPSB7a2V5LCBsYWJlbCwgZGF0ZTogdHJ1bmNhdGVkRGF0ZSwgZXZlbnRzOiBbXX07XG5cdFx0XHRcdFx0Z3JvdXBzLnNldChrZXksIGcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGcuZXZlbnRzLnB1c2goZXZlbnRMYWJlbCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGdyb3Vwcy5zaXplID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6ICdObyB2YWxpZCB0aW1lIHZhbHVlcyBmb3VuZCBmb3IgdGhlIHNlbGVjdGVkIHByb3BlcnR5LicsXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTb3J0IGdyb3VwcyBjaHJvbm9sb2dpY2FsbHlcblx0XHRjb25zdCBzb3J0ZWRHcm91cHMgPSBBcnJheS5mcm9tKGdyb3Vwcy52YWx1ZXMoKSkuc29ydChcblx0XHRcdChhLCBiKSA9PiBhLmRhdGUuZ2V0VGltZSgpIC0gYi5kYXRlLmdldFRpbWUoKSxcblx0XHQpO1xuXG5cdFx0Ly8gQnVpbGQgTWVybWFpZCB0aW1lbGluZSBtZXJtYWlkQ29kZVxuXHRcdGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGxpbmVzLnB1c2goJ3RpbWVsaW5lJyk7XG5cdFx0aWYgKHRpdGxlKVxuXHRcdFx0bGluZXMucHVzaChgICAgIHRpdGxlICR7dGl0bGV9YCk7XG5cblx0XHRmb3IgKGNvbnN0IGcgb2Ygc29ydGVkR3JvdXBzKSB7XG5cdFx0XHRpZiAoZy5ldmVudHMubGVuZ3RoID09PSAwKSBjb250aW51ZTtcblxuXHRcdFx0Ly8gU2luZ2xlIGxpbmUgcGVyIHRpbWUgcGVyaW9kLCBtdWx0aXBsZSBldmVudHMgdmlhIGV4dHJhIGNvbG9uc1xuXHRcdFx0Ly8ge3RpbWUgcGVyaW9kfSA6IHtldmVudDF9IDoge2V2ZW50Mn0gOiAuLi5cblx0XHRcdGxldCBsaW5lID0gYCAgICAke2cubGFiZWx9IDogJHtnLmV2ZW50c1swXX1gO1xuXHRcdFx0Zm9yIChsZXQgaSA9IDE7IGkgPCBnLmV2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRsaW5lICs9IGAgOiAke2cuZXZlbnRzW2ldfWA7XG5cdFx0XHR9XG5cdFx0XHRsaW5lcy5wdXNoKGxpbmUpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lcm1haWRDb2RlID0gbGluZXMuam9pbignXFxuJyk7XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJNZXJtYWlkKG1lcm1haWRDb2RlKTtcblx0fVxufVxuXG50eXBlIFRpbWVHcmFudWxhcml0eSA9ICd5ZWFyJyB8ICdtb250aCcgfCAnZGF5JyB8ICdob3VyJyB8ICdtaW51dGUnIHwgJ3NlY29uZCc7XG5cbmZ1bmN0aW9uIHBhcnNlR3JhbnVsYXJpdHkocmF3OiB1bmtub3duKTogVGltZUdyYW51bGFyaXR5IHtcblx0aWYgKHR5cGVvZiByYXcgIT09ICdzdHJpbmcnKSByZXR1cm4gJ2RheSc7XG5cdGNvbnN0IHMgPSByYXcudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG5cdHN3aXRjaCAocykge1xuXHRcdGNhc2UgJ3llYXInOlxuXHRcdGNhc2UgJ21vbnRoJzpcblx0XHRjYXNlICdkYXknOlxuXHRcdGNhc2UgJ2hvdXInOlxuXHRcdGNhc2UgJ21pbnV0ZSc6XG5cdFx0Y2FzZSAnc2Vjb25kJzpcblx0XHRcdHJldHVybiBzO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gJ2RheSc7XG5cdH1cbn1cblxuZnVuY3Rpb24gcGFkMihuOiBudW1iZXIpOiBzdHJpbmcge1xuXHRyZXR1cm4gbiA8IDEwID8gYDAke259YCA6IGAke259YDtcbn1cblxuZnVuY3Rpb24gdHJ1bmNhdGVEYXRlKFxuXHRkYXRlOiBEYXRlLFxuXHRncmFudWxhcml0eTogVGltZUdyYW51bGFyaXR5LFxuKTogeyBrZXk6IHN0cmluZzsgbGFiZWw6IHN0cmluZzsgdHJ1bmNhdGVkRGF0ZTogRGF0ZSB9IHtcblx0Y29uc3QgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcblx0Y29uc3QgbW9udGggPSBkYXRlLmdldE1vbnRoKCk7IC8vIDAtYmFzZWRcblx0Y29uc3QgZGF5ID0gZGF0ZS5nZXREYXRlKCk7XG5cdGNvbnN0IGhvdXIgPSBkYXRlLmdldEhvdXJzKCk7XG5cdGNvbnN0IG1pbnV0ZSA9IGRhdGUuZ2V0TWludXRlcygpO1xuXHRjb25zdCBzZWNvbmQgPSBkYXRlLmdldFNlY29uZHMoKTtcblxuXHRsZXQgdHJ1bmNhdGVkOiBEYXRlO1xuXHRsZXQgbGFiZWw6IHN0cmluZztcblxuXHRzd2l0Y2ggKGdyYW51bGFyaXR5KSB7XG5cdFx0Y2FzZSAneWVhcic6XG5cdFx0XHR0cnVuY2F0ZWQgPSBuZXcgRGF0ZSh5ZWFyLCAwLCAxLCAwLCAwLCAwLCAwKTtcblx0XHRcdGxhYmVsID0gYCR7eWVhcn1gO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdtb250aCc6XG5cdFx0XHR0cnVuY2F0ZWQgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSwgMCwgMCwgMCwgMCk7XG5cdFx0XHRsYWJlbCA9IGAke3llYXJ9LSR7cGFkMihtb250aCArIDEpfWA7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ2RheSc6XG5cdFx0XHR0cnVuY2F0ZWQgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCAwLCAwLCAwLCAwKTtcblx0XHRcdGxhYmVsID0gYCR7eWVhcn0tJHtwYWQyKG1vbnRoICsgMSl9LSR7cGFkMihkYXkpfWA7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ2hvdXInOlxuXHRcdFx0dHJ1bmNhdGVkID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgaG91ciwgMCwgMCwgMCk7XG5cdFx0XHQvLyDinZcgbm8gY29sb24gaGVyZSwgdXNlIFwiMTdoXCIgc3R5bGUgdG8ga2VlcCBNZXJtYWlkIGhhcHB5XG5cdFx0XHRsYWJlbCA9IGAke3llYXJ9LSR7cGFkMihtb250aCArIDEpfS0ke3BhZDIoZGF5KX0gJHtwYWQyKFxuXHRcdFx0XHRob3VyLFxuXHRcdFx0KX1oYDtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnbWludXRlJzpcblx0XHRcdHRydW5jYXRlZCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgMCwgMCk7XG5cdFx0XHQvLyBcIjE3aDMwXCIgaW5zdGVhZCBvZiBcIjE3OjMwXCJcblx0XHRcdGxhYmVsID0gYCR7eWVhcn0tJHtwYWQyKG1vbnRoICsgMSl9LSR7cGFkMihkYXkpfSAke3BhZDIoXG5cdFx0XHRcdGhvdXIsXG5cdFx0XHQpfWgke3BhZDIobWludXRlKX1gO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdzZWNvbmQnOlxuXHRcdFx0dHJ1bmNhdGVkID0gbmV3IERhdGUoXG5cdFx0XHRcdHllYXIsXG5cdFx0XHRcdG1vbnRoLFxuXHRcdFx0XHRkYXksXG5cdFx0XHRcdGhvdXIsXG5cdFx0XHRcdG1pbnV0ZSxcblx0XHRcdFx0c2Vjb25kLFxuXHRcdFx0XHQwLFxuXHRcdFx0KTtcblx0XHRcdC8vIFwiMTdoMzBtMTVzXCIgaW5zdGVhZCBvZiBcIjE3OjMwOjE1XCJcblx0XHRcdGxhYmVsID0gYCR7eWVhcn0tJHtwYWQyKG1vbnRoICsgMSl9LSR7cGFkMihkYXkpfSAke3BhZDIoXG5cdFx0XHRcdGhvdXIsXG5cdFx0XHQpfWgke3BhZDIobWludXRlKX1tJHtwYWQyKHNlY29uZCl9c2A7XG5cdFx0XHRicmVhaztcblx0fVxuXG5cdHJldHVybiB7a2V5OiBsYWJlbCwgbGFiZWwsIHRydW5jYXRlZERhdGU6IHRydW5jYXRlZH07XG59XG4iXX0=