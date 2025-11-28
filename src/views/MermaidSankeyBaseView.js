import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from "./MermaidBaseViewBase";
import { MermaidSankeyViewId } from "../core/constants";
export class MermaidSankeyBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidSankeyViewId;
    }
    render() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            // 1) Read multitext flows
            const rawFlows = this.config.get('flows');
            const flowItems = Array.isArray(rawFlows)
                ? rawFlows
                : [];
            if (flowItems.length < 3) {
                this.containerEl.createDiv({
                    text: 'Add at least one flow triple (source, target, value property) in the view settings.',
                });
                return;
            }
            const flowConfigs = [];
            for (let i = 0; i + 2 < flowItems.length; i += 3) {
                const source = ((_a = flowItems[i]) !== null && _a !== void 0 ? _a : '').trim();
                const target = ((_b = flowItems[i + 1]) !== null && _b !== void 0 ? _b : '').trim();
                const propertyName = ((_c = flowItems[i + 2]) !== null && _c !== void 0 ? _c : '').trim();
                if (!source || !target || !propertyName) {
                    // skip incomplete triple
                    continue;
                }
                flowConfigs.push({ source, target, propertyName: propertyName });
            }
            if (flowConfigs.length === 0) {
                this.containerEl.createDiv({
                    text: 'No complete (source, target, value property) triples found in the flow configuration.',
                });
                return;
            }
            const resolvedFlows = [];
            for (const flow of flowConfigs) {
                const propertyId = this.resolvePropertyIdFromUserInput(flow.propertyName);
                if (!propertyId) {
                    console.warn(`Sankey view: Could not resolve property from "${flow.propertyName}".`);
                    continue;
                }
                const total = this.aggregateNumericProperty(propertyId);
                if (total === null) {
                    console.warn(`Sankey view: Property "${propertyId}" did not produce any numeric/boolean values.`);
                    continue;
                }
                resolvedFlows.push({
                    source: flow.source,
                    target: flow.target,
                    value: total,
                });
            }
            if (resolvedFlows.length === 0) {
                this.containerEl.createDiv({
                    text: 'No flows produced numeric/boolean values. Check your value properties and filters.',
                });
                return;
            }
            // 4) Build sankey-beta mermaidCode
            const lines = [];
            lines.push('sankey-beta');
            lines.push('%% source,target,value');
            for (const { source, target, value } of resolvedFlows) {
                const s = csvField(source);
                const t = csvField(target);
                lines.push(`${s},${t},${value}`);
            }
            const mermaidCode = lines.join('\n');
            // 5) Render via markdown/mermaid so it looks like a normal code block
            yield this.renderMermaid(mermaidCode);
        });
    }
    /**
     * Resolve a property from user input, which can be:
     * - a full property id (e.g. "formula.energy_flow")
     * - a bare name (e.g. "energy_flow")
     * - the display name for that property.
     */
    resolvePropertyIdFromUserInput(input) {
        const trimmed = input.trim();
        if (!trimmed)
            return null;
        // 1. Direct match on full id (e.g. "note.foo", "formula.bar", "file.size")
        for (const id of this.allProperties) {
            if (id === trimmed) {
                console.log("A");
                return id;
            }
        }
        // 2. Match by bare name (after the first dot) or display name
        for (const id of this.allProperties) {
            const dot = id.indexOf('.');
            const bare = dot >= 0 ? id.substring(dot + 1) : id;
            if (bare === trimmed) {
                console.log("B");
                return id;
            }
            const displayName = this.config.getDisplayName(id);
            if (displayName === trimmed) {
                console.log("C");
                return id;
            }
        }
        return null;
    }
    /**
     * Sum a numeric property across all entries in the current data set.
     * Works with note/file/formula properties, as long as they resolve to numbers.
     */
    aggregateNumericProperty(propertyId) {
        if (!this.data)
            return null;
        let sum = 0;
        let foundAny = false;
        for (const group of this.data.groupedData) {
            for (const entry of group.entries) {
                const value = entry.getValue(propertyId);
                if (!value)
                    continue;
                const text = value.toString().trim();
                let num = null;
                if (text === 'true') {
                    num = 1;
                }
                else if (text === 'false') {
                    num = 0;
                }
                else {
                    const parsed = Number(text);
                    if (Number.isFinite(parsed)) {
                        num = parsed;
                    }
                }
                if (num !== null) {
                    sum += num;
                    foundAny = true;
                }
            }
        }
        return foundAny ? sum : null;
    }
}
MermaidSankeyBaseView.RegistrationData = {
    id: MermaidSankeyViewId,
    name: 'Sankey',
    icon: 'shuffle',
    options: [
        {
            type: 'text',
            displayName: 'Flow 1: Source node',
            key: 'flow1Source',
            placeholder: 'e.g. "Agricultural \'waste\'"',
        },
        {
            type: 'text',
            displayName: 'Flow 1: Target node',
            key: 'flow1Target',
            placeholder: 'e.g. "Bio-conversion"',
        },
        {
            type: 'multitext',
            displayName: 'Flows (source text, target text, value property)',
            key: 'flows',
        },
        {
            type: 'text',
            displayName: 'Mermaid config (optional)',
            key: 'mermaidConfig',
            placeholder: '---\\nconfig:\\n  sankey:\\n    showValues: false\\n---',
        },
    ],
};
function csvField(text) {
    if (/[",\n]/.test(text)) {
        const escaped = text.replace(/"/g, '""');
        return `"${escaped}"`;
    }
    return text;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZFNhbmtleUJhc2VWaWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTWVybWFpZFNhbmtleUJhc2VWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl0RCxNQUFNLE9BQU8scUJBQXNCLFNBQVEsbUJBQW1CO0lBQTlEOztRQUNVLFNBQUksR0FBRyxtQkFBbUIsQ0FBQztJQXVOckMsQ0FBQztJQXJMZ0IsTUFBTTs7O1lBRXJCLDBCQUEwQjtZQUMxQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztnQkFDeEMsQ0FBQyxDQUFFLFFBQXFCO2dCQUN4QixDQUFDLENBQUMsRUFBRSxDQUFDO1lBRU4sSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUM7b0JBQzFCLElBQUksRUFBRSxxRkFBcUY7aUJBQzNGLENBQUMsQ0FBQztnQkFDSCxPQUFPO2FBQ1A7WUFTRCxNQUFNLFdBQVcsR0FBaUIsRUFBRSxDQUFDO1lBRXJDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNqRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxtQ0FBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFBLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFD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SUFBSSxFQUFFLFdBQVc7WUFDakIsV0FBVyxFQUFFLGtEQUFrRDtZQUMvRCxHQUFHLEVBQUUsT0FBTztTQUNaO1FBQ0Q7WUFDQyxJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRSwyQkFBMkI7WUFDeEMsR0FBRyxFQUFFLGVBQWU7WUFDcEIsV0FBVyxFQUNWLHlEQUF5RDtTQUMxRDtLQUNEO0NBQ0QsQ0FBQztBQXlMSCxTQUFTLFFBQVEsQ0FBQyxJQUFZO0lBQzdCLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN4QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxPQUFPLElBQUksT0FBTyxHQUFHLENBQUM7S0FDdEI7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNiLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01lcm1haWRCYXNlVmlld0Jhc2V9IGZyb20gXCIuL01lcm1haWRCYXNlVmlld0Jhc2VcIjtcbmltcG9ydCB7TWVybWFpZFNhbmtleVZpZXdJZH0gZnJvbSBcIi4uL2NvcmUvY29uc3RhbnRzXCI7XG5pbXBvcnQge0Jhc2VzUHJvcGVydHlJZH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQge01lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YX0gZnJvbSBcIi4uL2NvcmUvTWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhXCI7XG5cbmV4cG9ydCBjbGFzcyBNZXJtYWlkU2Fua2V5QmFzZVZpZXcgZXh0ZW5kcyBNZXJtYWlkQmFzZVZpZXdCYXNlIHtcblx0cmVhZG9ubHkgdHlwZSA9IE1lcm1haWRTYW5rZXlWaWV3SWQ7XG5cblx0c3RhdGljIHJlYWRvbmx5IFJlZ2lzdHJhdGlvbkRhdGE6IE1lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YSA9IHtcblx0XHRpZDogTWVybWFpZFNhbmtleVZpZXdJZCxcblx0XHRuYW1lOiAnU2Fua2V5Jyxcblx0XHRpY29uOiAnc2h1ZmZsZScsXG5cdFx0b3B0aW9uczogW1xuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnRmxvdyAxOiBTb3VyY2Ugbm9kZScsXG5cdFx0XHRcdGtleTogJ2Zsb3cxU291cmNlJyxcblx0XHRcdFx0cGxhY2Vob2xkZXI6ICdlLmcuIFwiQWdyaWN1bHR1cmFsIFxcJ3dhc3RlXFwnXCInLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ0Zsb3cgMTogVGFyZ2V0IG5vZGUnLFxuXHRcdFx0XHRrZXk6ICdmbG93MVRhcmdldCcsXG5cdFx0XHRcdHBsYWNlaG9sZGVyOiAnZS5nLiBcIkJpby1jb252ZXJzaW9uXCInLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ211bHRpdGV4dCcsLy9UT0RPOiBzaG91bGQgdXNlIHByb3BlcnR5IHR5cGUgdG8gc2VsZWN0IGZvcm11bGFzIG1vcmUgZWFzaWx5LCBidXQgY3VycmVudGx5IHRoZXJlIGlzIG5vIHdheSB0byBtYWtlIGEgbGlzdCBvZiB0aGVtP1xuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ0Zsb3dzIChzb3VyY2UgdGV4dCwgdGFyZ2V0IHRleHQsIHZhbHVlIHByb3BlcnR5KScsXG5cdFx0XHRcdGtleTogJ2Zsb3dzJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdNZXJtYWlkIGNvbmZpZyAob3B0aW9uYWwpJyxcblx0XHRcdFx0a2V5OiAnbWVybWFpZENvbmZpZycsXG5cdFx0XHRcdHBsYWNlaG9sZGVyOlxuXHRcdFx0XHRcdCctLS1cXFxcbmNvbmZpZzpcXFxcbiAgc2Fua2V5OlxcXFxuICAgIHNob3dWYWx1ZXM6IGZhbHNlXFxcXG4tLS0nLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9O1xuXG5cdHByb3RlY3RlZCBhc3luYyByZW5kZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cblx0XHQvLyAxKSBSZWFkIG11bHRpdGV4dCBmbG93c1xuXHRcdGNvbnN0IHJhd0Zsb3dzID0gdGhpcy5jb25maWcuZ2V0KCdmbG93cycpO1xuXHRcdGNvbnN0IGZsb3dJdGVtcyA9IEFycmF5LmlzQXJyYXkocmF3Rmxvd3MpXG5cdFx0XHQ/IChyYXdGbG93cyBhcyBzdHJpbmdbXSlcblx0XHRcdDogW107XG5cblx0XHRpZiAoZmxvd0l0ZW1zLmxlbmd0aCA8IDMpIHtcblx0XHRcdHRoaXMuY29udGFpbmVyRWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0dGV4dDogJ0FkZCBhdCBsZWFzdCBvbmUgZmxvdyB0cmlwbGUgKHNvdXJjZSwgdGFyZ2V0LCB2YWx1ZSBwcm9wZXJ0eSkgaW4gdGhlIHZpZXcgc2V0dGluZ3MuJyxcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIDIpIFBhcnNlIGl0ZW1zIGFzIHRyaXBsZXM6IFtzb3VyY2UsIHRhcmdldCwgcHJvcGVydHlOYW1lXSwgW3NvdXJjZTIsIHRhcmdldDIsIHByb3AyXSwgLi4uXG5cdFx0dHlwZSBGbG93Q29uZmlnID0ge1xuXHRcdFx0c291cmNlOiBzdHJpbmc7XG5cdFx0XHR0YXJnZXQ6IHN0cmluZztcblx0XHRcdHByb3BlcnR5TmFtZTogc3RyaW5nO1xuXHRcdH07XG5cblx0XHRjb25zdCBmbG93Q29uZmlnczogRmxvd0NvbmZpZ1tdID0gW107XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSArIDIgPCBmbG93SXRlbXMubGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdGNvbnN0IHNvdXJjZSA9IChmbG93SXRlbXNbaV0gPz8gJycpLnRyaW0oKTtcblx0XHRcdGNvbnN0IHRhcmdldCA9IChmbG93SXRlbXNbaSArIDFdID8/ICcnKS50cmltKCk7XG5cdFx0XHRjb25zdCBwcm9wZXJ0eU5hbWUgPSAoZmxvd0l0ZW1zW2kgKyAyXSA/PyAnJykudHJpbSgpO1xuXG5cdFx0XHRpZiAoIXNvdXJjZSB8fCAhdGFyZ2V0IHx8ICFwcm9wZXJ0eU5hbWUpIHtcblx0XHRcdFx0Ly8gc2tpcCBpbmNvbXBsZXRlIHRyaXBsZVxuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Zmxvd0NvbmZpZ3MucHVzaCh7c291cmNlLCB0YXJnZXQsIHByb3BlcnR5TmFtZTogcHJvcGVydHlOYW1lfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGZsb3dDb25maWdzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhpcy5jb250YWluZXJFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHR0ZXh0OiAnTm8gY29tcGxldGUgKHNvdXJjZSwgdGFyZ2V0LCB2YWx1ZSBwcm9wZXJ0eSkgdHJpcGxlcyBmb3VuZCBpbiB0aGUgZmxvdyBjb25maWd1cmF0aW9uLicsXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyAzKSBSZXNvbHZlIHByb3BlcnR5IElEcyBhbmQgYWdncmVnYXRlIHZhbHVlc1xuXHRcdHR5cGUgUmVzb2x2ZWRGbG93ID0ge1xuXHRcdFx0c291cmNlOiBzdHJpbmc7XG5cdFx0XHR0YXJnZXQ6IHN0cmluZztcblx0XHRcdHZhbHVlOiBudW1iZXI7XG5cdFx0fTtcblxuXHRcdGNvbnN0IHJlc29sdmVkRmxvd3M6IFJlc29sdmVkRmxvd1tdID0gW107XG5cblx0XHRmb3IgKGNvbnN0IGZsb3cgb2YgZmxvd0NvbmZpZ3MpIHtcblx0XHRcdGNvbnN0IHByb3BlcnR5SWQgPSB0aGlzLnJlc29sdmVQcm9wZXJ0eUlkRnJvbVVzZXJJbnB1dChmbG93LnByb3BlcnR5TmFtZSk7XG5cdFx0XHRpZiAoIXByb3BlcnR5SWQpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0XHRcdGBTYW5rZXkgdmlldzogQ291bGQgbm90IHJlc29sdmUgcHJvcGVydHkgZnJvbSBcIiR7Zmxvdy5wcm9wZXJ0eU5hbWV9XCIuYFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdG90YWwgPSB0aGlzLmFnZ3JlZ2F0ZU51bWVyaWNQcm9wZXJ0eShwcm9wZXJ0eUlkKTtcblx0XHRcdGlmICh0b3RhbCA9PT0gbnVsbCkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcdFx0YFNhbmtleSB2aWV3OiBQcm9wZXJ0eSBcIiR7cHJvcGVydHlJZH1cIiBkaWQgbm90IHByb2R1Y2UgYW55IG51bWVyaWMvYm9vbGVhbiB2YWx1ZXMuYFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0cmVzb2x2ZWRGbG93cy5wdXNoKHtcblx0XHRcdFx0c291cmNlOiBmbG93LnNvdXJjZSxcblx0XHRcdFx0dGFyZ2V0OiBmbG93LnRhcmdldCxcblx0XHRcdFx0dmFsdWU6IHRvdGFsLFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlc29sdmVkRmxvd3MubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6ICdObyBmbG93cyBwcm9kdWNlZCBudW1lcmljL2Jvb2xlYW4gdmFsdWVzLiBDaGVjayB5b3VyIHZhbHVlIHByb3BlcnRpZXMgYW5kIGZpbHRlcnMuJyxcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIDQpIEJ1aWxkIHNhbmtleS1iZXRhIG1lcm1haWRDb2RlXG5cdFx0Y29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cdFx0bGluZXMucHVzaCgnc2Fua2V5LWJldGEnKTtcblxuXHRcdGxpbmVzLnB1c2goJyUlIHNvdXJjZSx0YXJnZXQsdmFsdWUnKTtcblxuXHRcdGZvciAoY29uc3Qge3NvdXJjZSwgdGFyZ2V0LCB2YWx1ZX0gb2YgcmVzb2x2ZWRGbG93cykge1xuXHRcdFx0Y29uc3QgcyA9IGNzdkZpZWxkKHNvdXJjZSk7XG5cdFx0XHRjb25zdCB0ID0gY3N2RmllbGQodGFyZ2V0KTtcblx0XHRcdGxpbmVzLnB1c2goYCR7c30sJHt0fSwke3ZhbHVlfWApO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lcm1haWRDb2RlID0gbGluZXMuam9pbignXFxuJyk7XG5cblx0XHQvLyA1KSBSZW5kZXIgdmlhIG1hcmtkb3duL21lcm1haWQgc28gaXQgbG9va3MgbGlrZSBhIG5vcm1hbCBjb2RlIGJsb2NrXG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJNZXJtYWlkKG1lcm1haWRDb2RlKTtcblx0fVxuXG5cblx0LyoqXG5cdCAqIFJlc29sdmUgYSBwcm9wZXJ0eSBmcm9tIHVzZXIgaW5wdXQsIHdoaWNoIGNhbiBiZTpcblx0ICogLSBhIGZ1bGwgcHJvcGVydHkgaWQgKGUuZy4gXCJmb3JtdWxhLmVuZXJneV9mbG93XCIpXG5cdCAqIC0gYSBiYXJlIG5hbWUgKGUuZy4gXCJlbmVyZ3lfZmxvd1wiKVxuXHQgKiAtIHRoZSBkaXNwbGF5IG5hbWUgZm9yIHRoYXQgcHJvcGVydHkuXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVQcm9wZXJ0eUlkRnJvbVVzZXJJbnB1dChpbnB1dDogc3RyaW5nKTogQmFzZXNQcm9wZXJ0eUlkIHwgbnVsbCB7XG5cdFx0Y29uc3QgdHJpbW1lZCA9IGlucHV0LnRyaW0oKTtcblx0XHRpZiAoIXRyaW1tZWQpIHJldHVybiBudWxsO1xuXG5cdFx0Ly8gMS4gRGlyZWN0IG1hdGNoIG9uIGZ1bGwgaWQgKGUuZy4gXCJub3RlLmZvb1wiLCBcImZvcm11bGEuYmFyXCIsIFwiZmlsZS5zaXplXCIpXG5cdFx0Zm9yIChjb25zdCBpZCBvZiB0aGlzLmFsbFByb3BlcnRpZXMpIHtcblx0XHRcdGlmIChpZCA9PT0gdHJpbW1lZCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkFcIik7XG5cdFx0XHRcdHJldHVybiBpZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyAyLiBNYXRjaCBieSBiYXJlIG5hbWUgKGFmdGVyIHRoZSBmaXJzdCBkb3QpIG9yIGRpc3BsYXkgbmFtZVxuXHRcdGZvciAoY29uc3QgaWQgb2YgdGhpcy5hbGxQcm9wZXJ0aWVzKSB7XG5cdFx0XHRjb25zdCBkb3QgPSBpZC5pbmRleE9mKCcuJyk7XG5cdFx0XHRjb25zdCBiYXJlID0gZG90ID49IDAgPyBpZC5zdWJzdHJpbmcoZG90ICsgMSkgOiBpZDtcblxuXHRcdFx0aWYgKGJhcmUgPT09IHRyaW1tZWQpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJCXCIpO1xuXHRcdFx0XHRyZXR1cm4gaWQ7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGRpc3BsYXlOYW1lID0gdGhpcy5jb25maWcuZ2V0RGlzcGxheU5hbWUoaWQpO1xuXHRcdFx0aWYgKGRpc3BsYXlOYW1lID09PSB0cmltbWVkKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiQ1wiKTtcblx0XHRcdFx0cmV0dXJuIGlkO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN1bSBhIG51bWVyaWMgcHJvcGVydHkgYWNyb3NzIGFsbCBlbnRyaWVzIGluIHRoZSBjdXJyZW50IGRhdGEgc2V0LlxuXHQgKiBXb3JrcyB3aXRoIG5vdGUvZmlsZS9mb3JtdWxhIHByb3BlcnRpZXMsIGFzIGxvbmcgYXMgdGhleSByZXNvbHZlIHRvIG51bWJlcnMuXG5cdCAqL1xuXHRwcml2YXRlIGFnZ3JlZ2F0ZU51bWVyaWNQcm9wZXJ0eShwcm9wZXJ0eUlkOiBCYXNlc1Byb3BlcnR5SWQpOiBudW1iZXIgfCBudWxsIHtcblxuXHRcdGlmICghdGhpcy5kYXRhKSByZXR1cm4gbnVsbDtcblxuXHRcdGxldCBzdW0gPSAwO1xuXHRcdGxldCBmb3VuZEFueSA9IGZhbHNlO1xuXG5cdFx0Zm9yIChjb25zdCBncm91cCBvZiB0aGlzLmRhdGEuZ3JvdXBlZERhdGEpIHtcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZ3JvdXAuZW50cmllcykge1xuXHRcdFx0XHRjb25zdCB2YWx1ZSA9IGVudHJ5LmdldFZhbHVlKHByb3BlcnR5SWQpO1xuXHRcdFx0XHRpZiAoIXZhbHVlKSBjb250aW51ZTtcblxuXHRcdFx0XHRjb25zdCB0ZXh0ID0gdmFsdWUudG9TdHJpbmcoKS50cmltKCk7XG5cblx0XHRcdFx0bGV0IG51bTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cblx0XHRcdFx0aWYgKHRleHQgPT09ICd0cnVlJykge1xuXHRcdFx0XHRcdG51bSA9IDE7XG5cdFx0XHRcdH0gZWxzZSBpZiAodGV4dCA9PT0gJ2ZhbHNlJykge1xuXHRcdFx0XHRcdG51bSA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3QgcGFyc2VkID0gTnVtYmVyKHRleHQpO1xuXHRcdFx0XHRcdGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSkge1xuXHRcdFx0XHRcdFx0bnVtID0gcGFyc2VkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChudW0gIT09IG51bGwpIHtcblx0XHRcdFx0XHRzdW0gKz0gbnVtO1xuXHRcdFx0XHRcdGZvdW5kQW55ID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmb3VuZEFueSA/IHN1bSA6IG51bGw7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3N2RmllbGQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcblx0aWYgKC9bXCIsXFxuXS8udGVzdCh0ZXh0KSkge1xuXHRcdGNvbnN0IGVzY2FwZWQgPSB0ZXh0LnJlcGxhY2UoL1wiL2csICdcIlwiJyk7XG5cdFx0cmV0dXJuIGBcIiR7ZXNjYXBlZH1cImA7XG5cdH1cblx0cmV0dXJuIHRleHQ7XG59XG4iXX0=