import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from "./MermaidBaseViewBase";
import { MermaidRadarViewId } from "../core/constants";
import { parsePropertyId } from "obsidian";
export class MermaidRadarChartBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidRadarViewId;
    }
    render() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // 1) Read config
            const title = this.config.get('title');
            const labelPropertyId = this.config.getAsPropertyId('labelProperty');
            const rawMin = this.config.get('min');
            const rawMax = this.config.get('max');
            let minVal = 0;
            let maxVal = 100;
            if (typeof rawMin === 'string' && rawMin.trim().length > 0) {
                const v = Number(rawMin.trim());
                if (Number.isFinite(v))
                    minVal = v;
            }
            if (typeof rawMax === 'string' && rawMax.trim().length > 0) {
                const v = Number(rawMax.trim());
                if (Number.isFinite(v))
                    maxVal = v;
            }
            if (minVal === maxVal) {
                minVal -= 1;
                maxVal += 1;
            }
            const axes = [];
            let axisId = 0;
            for (const property of this.data.properties) {
                axes.push({ id: `a${axisId++}`, label: parsePropertyId(property).name, propertyId: property });
            }
            if (axes.length === 0) {
                this.containerEl.createDiv({
                    text: 'No valid axis properties resolved from the configuration.',
                });
                return;
            }
            const curves = [];
            let hasAnyValue = false;
            let curveIndex = 0;
            for (const group of this.data.groupedData) {
                for (const entry of group.entries) {
                    const values = [];
                    let allMissing = true;
                    for (const axis of axes) {
                        const v = entry.getValue(axis.propertyId);
                        if (!v || v == null) {
                            values.push(minVal); // or minVal, or 0
                            continue;
                        }
                        const t = v.toString().trim();
                        let num = null;
                        if (t === 'true')
                            num = 1;
                        else if (t === 'false')
                            num = 0;
                        else {
                            const parsed = Number(t);
                            if (Number.isFinite(parsed))
                                num = parsed;
                        }
                        if (num === null) {
                            values.push(minVal);
                            continue;
                        }
                        allMissing = false;
                        // Clamp into [minVal, maxVal]
                        const clamped = Math.min(maxVal, Math.max(minVal, num));
                        values.push(clamped);
                    }
                    if (allMissing)
                        continue;
                    let label = '';
                    if (labelPropertyId) {
                        const lVal = entry.getValue(labelPropertyId);
                        if (lVal && lVal != null) {
                            label = lVal.toString().trim();
                        }
                    }
                    if (!label)
                        label = (_b = (_a = entry.file) === null || _a === void 0 ? void 0 : _a.basename) !== null && _b !== void 0 ? _b : `(series ${curveIndex + 1})`;
                    const curveId = `s${curveIndex++}`;
                    curves.push({ id: curveId, label, values });
                    hasAnyValue = true;
                }
            }
            if (!hasAnyValue || curves.length === 0) {
                this.containerEl.createDiv({
                    text: 'No numeric/boolean values found for the selected axis properties.',
                });
                return;
            }
            // 4) Build radar-beta mermaidCode
            const lines = [];
            lines.push('radar-beta');
            if (title)
                lines.push(`  title "${title}"`);
            // Axis statements – chunk into lines of up to N axes for readability
            const axisChunks = [];
            const chunkSize = 6;
            for (let i = 0; i < axes.length; i += chunkSize) {
                axisChunks.push(axes.slice(i, i + chunkSize));
            }
            for (const chunk of axisChunks) {
                const parts = chunk.map((axis) => {
                    const safeLabel = axis.label.replace(/"/g, '\\"');
                    return `${axis.id}["${safeLabel}"]`;
                });
                lines.push(`  axis ${parts.join(', ')}`);
            }
            // Curves
            for (const curve of curves) {
                const safeLabel = curve.label.replace(/"/g, '\\"');
                const vals = curve.values.join(', ');
                lines.push(`  curve ${curve.id}["${safeLabel}"]{${vals}}`);
            }
            // Make each curve label clickable as an internal link
            lines.push('  %% internal-link classes for curves');
            for (const curve of curves) {
                lines.push(`  class ${curve.id} internal-link;`);
            }
            // Min / max
            lines.push(`  max ${maxVal}`);
            lines.push(`  min ${minVal}`);
            const mermaidCode = lines.join('\n');
            yield this.renderMermaid(mermaidCode);
        });
    }
}
MermaidRadarChartBaseView.RegistrationData = {
    id: MermaidRadarViewId,
    name: 'Radar Chart',
    icon: 'radar',
    options: [
        {
            type: 'text',
            displayName: 'Chart title',
            key: 'title',
            default: 'Title',
        },
        {
            type: 'text',
            displayName: 'Min value',
            key: 'min',
            default: '0',
        },
        {
            type: 'text',
            displayName: 'Max value',
            key: 'max',
            default: '100',
        },
        {
            type: 'property',
            displayName: 'Label property (optional)',
            key: 'labelProperty',
            placeholder: 'defaults to file name',
        },
        {
            type: 'text',
            displayName: 'Mermaid config (optional)',
            key: 'mermaidConfig',
            placeholder: `---\ntitle: "Grades"\n---`,
        },
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZFJhZGFyQ2hhcnRCYXNlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1lcm1haWRSYWRhckNoYXJ0QmFzZVZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXJELE9BQU8sRUFBa0IsZUFBZSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRTFELE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxtQkFBbUI7SUFBbEU7O1FBQ1UsU0FBSSxHQUFHLGtCQUFrQixDQUFDO0lBa01wQyxDQUFDO0lBMUpnQixNQUFNOzs7WUFDckIsaUJBQWlCO1lBQ2pCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXZDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRXJFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXRDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQztZQUVqQixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDM0QsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUFFLE1BQU0sR0FBRyxD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ZVZpZXdCYXNlfSBmcm9tIFwiLi9NZXJtYWlkQmFzZVZpZXdCYXNlXCI7XG5pbXBvcnQge01lcm1haWRSYWRhclZpZXdJZH0gZnJvbSBcIi4uL2NvcmUvY29uc3RhbnRzXCI7XG5pbXBvcnQge01lcm1haWRWaWV3UmVnaXN0cmF0aW9uRGF0YX0gZnJvbSBcIi4uL2NvcmUvTWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhXCI7XG5pbXBvcnQge0Jhc2VzUHJvcGVydHlJZCwgcGFyc2VQcm9wZXJ0eUlkfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIE1lcm1haWRSYWRhckNoYXJ0QmFzZVZpZXcgZXh0ZW5kcyBNZXJtYWlkQmFzZVZpZXdCYXNlIHtcblx0cmVhZG9ubHkgdHlwZSA9IE1lcm1haWRSYWRhclZpZXdJZDtcblxuXHRzdGF0aWMgcmVhZG9ubHkgUmVnaXN0cmF0aW9uRGF0YTogTWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhID0ge1xuXHRcdGlkOiBNZXJtYWlkUmFkYXJWaWV3SWQsXG5cdFx0bmFtZTogJ1JhZGFyIENoYXJ0Jyxcblx0XHRpY29uOiAncmFkYXInLC8vcmFkaXVzXG5cdFx0b3B0aW9uczogW1xuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnQ2hhcnQgdGl0bGUnLFxuXHRcdFx0XHRrZXk6ICd0aXRsZScsXG5cdFx0XHRcdGRlZmF1bHQ6ICdUaXRsZScsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnTWluIHZhbHVlJyxcblx0XHRcdFx0a2V5OiAnbWluJyxcblx0XHRcdFx0ZGVmYXVsdDogJzAnLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ01heCB2YWx1ZScsXG5cdFx0XHRcdGtleTogJ21heCcsXG5cdFx0XHRcdGRlZmF1bHQ6ICcxMDAnLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3Byb3BlcnR5Jyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdMYWJlbCBwcm9wZXJ0eSAob3B0aW9uYWwpJyxcblx0XHRcdFx0a2V5OiAnbGFiZWxQcm9wZXJ0eScsXG5cdFx0XHRcdHBsYWNlaG9sZGVyOiAnZGVmYXVsdHMgdG8gZmlsZSBuYW1lJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdNZXJtYWlkIGNvbmZpZyAob3B0aW9uYWwpJyxcblx0XHRcdFx0a2V5OiAnbWVybWFpZENvbmZpZycsXG5cdFx0XHRcdHBsYWNlaG9sZGVyOiBgLS0tXFxudGl0bGU6IFwiR3JhZGVzXCJcXG4tLS1gLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9O1xuXG5cdHByb3RlY3RlZCBhc3luYyByZW5kZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gMSkgUmVhZCBjb25maWdcblx0XHRjb25zdCB0aXRsZSA9IHRoaXMuY29uZmlnLmdldCgndGl0bGUnKTtcblxuXHRcdGNvbnN0IGxhYmVsUHJvcGVydHlJZCA9IHRoaXMuY29uZmlnLmdldEFzUHJvcGVydHlJZCgnbGFiZWxQcm9wZXJ0eScpO1xuXG5cdFx0Y29uc3QgcmF3TWluID0gdGhpcy5jb25maWcuZ2V0KCdtaW4nKTtcblx0XHRjb25zdCByYXdNYXggPSB0aGlzLmNvbmZpZy5nZXQoJ21heCcpO1xuXG5cdFx0bGV0IG1pblZhbCA9IDA7XG5cdFx0bGV0IG1heFZhbCA9IDEwMDtcblxuXHRcdGlmICh0eXBlb2YgcmF3TWluID09PSAnc3RyaW5nJyAmJiByYXdNaW4udHJpbSgpLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IHYgPSBOdW1iZXIocmF3TWluLnRyaW0oKSk7XG5cdFx0XHRpZiAoTnVtYmVyLmlzRmluaXRlKHYpKSBtaW5WYWwgPSB2O1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIHJhd01heCA9PT0gJ3N0cmluZycgJiYgcmF3TWF4LnRyaW0oKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCB2ID0gTnVtYmVyKHJhd01heC50cmltKCkpO1xuXHRcdFx0aWYgKE51bWJlci5pc0Zpbml0ZSh2KSkgbWF4VmFsID0gdjtcblx0XHR9XG5cblx0XHRpZiAobWluVmFsID09PSBtYXhWYWwpIHtcblx0XHRcdG1pblZhbCAtPSAxO1xuXHRcdFx0bWF4VmFsICs9IDE7XG5cdFx0fVxuXG5cdFx0dHlwZSBBeGlzID0geyBpZDogc3RyaW5nOyBsYWJlbDogc3RyaW5nOyBwcm9wZXJ0eUlkOiBCYXNlc1Byb3BlcnR5SWQgfTtcblxuXHRcdGNvbnN0IGF4ZXM6IEF4aXNbXSA9IFtdO1xuXHRcdGxldCBheGlzSWQgPSAwO1xuXHRcdGZvciAoY29uc3QgcHJvcGVydHkgb2YgdGhpcy5kYXRhLnByb3BlcnRpZXMpIHtcblx0XHRcdGF4ZXMucHVzaCh7aWQ6IGBhJHtheGlzSWQrK31gLCBsYWJlbDogcGFyc2VQcm9wZXJ0eUlkKHByb3BlcnR5KS5uYW1lLCBwcm9wZXJ0eUlkOiBwcm9wZXJ0eX0pO1xuXHRcdH1cblxuXHRcdGlmIChheGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhpcy5jb250YWluZXJFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHR0ZXh0OiAnTm8gdmFsaWQgYXhpcyBwcm9wZXJ0aWVzIHJlc29sdmVkIGZyb20gdGhlIGNvbmZpZ3VyYXRpb24uJyxcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIDMpIEJ1aWxkIGN1cnZlczogb25lIHBlciBlbnRyeVxuXHRcdHR5cGUgQ3VydmUgPSB7IGlkOiBzdHJpbmc7IGxhYmVsOiBzdHJpbmc7IHZhbHVlczogbnVtYmVyW10gfTtcblxuXHRcdGNvbnN0IGN1cnZlczogQ3VydmVbXSA9IFtdO1xuXHRcdGxldCBoYXNBbnlWYWx1ZSA9IGZhbHNlO1xuXG5cdFx0bGV0IGN1cnZlSW5kZXggPSAwO1xuXHRcdGZvciAoY29uc3QgZ3JvdXAgb2YgdGhpcy5kYXRhLmdyb3VwZWREYXRhKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGVudHJ5IG9mIGdyb3VwLmVudHJpZXMpIHtcblx0XHRcdFx0Y29uc3QgdmFsdWVzOiBudW1iZXJbXSA9IFtdO1xuXHRcdFx0XHRsZXQgYWxsTWlzc2luZyA9IHRydWU7XG5cblx0XHRcdFx0Zm9yIChjb25zdCBheGlzIG9mIGF4ZXMpIHtcblx0XHRcdFx0XHRjb25zdCB2ID0gZW50cnkuZ2V0VmFsdWUoYXhpcy5wcm9wZXJ0eUlkKTtcblx0XHRcdFx0XHRpZiAoIXYgfHwgdiA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHR2YWx1ZXMucHVzaChtaW5WYWwpOyAvLyBvciBtaW5WYWwsIG9yIDBcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IHQgPSB2LnRvU3RyaW5nKCkudHJpbSgpO1xuXHRcdFx0XHRcdGxldCBudW06IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG5cdFx0XHRcdFx0aWYgKHQgPT09ICd0cnVlJykgbnVtID0gMTtcblx0XHRcdFx0XHRlbHNlIGlmICh0ID09PSAnZmFsc2UnKSBudW0gPSAwO1xuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgcGFyc2VkID0gTnVtYmVyKHQpO1xuXHRcdFx0XHRcdFx0aWYgKE51bWJlci5pc0Zpbml0ZShwYXJzZWQpKSBudW0gPSBwYXJzZWQ7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKG51bSA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0dmFsdWVzLnB1c2gobWluVmFsKTtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGFsbE1pc3NpbmcgPSBmYWxzZTtcblxuXHRcdFx0XHRcdC8vIENsYW1wIGludG8gW21pblZhbCwgbWF4VmFsXVxuXHRcdFx0XHRcdGNvbnN0IGNsYW1wZWQgPSBNYXRoLm1pbihcblx0XHRcdFx0XHRcdG1heFZhbCxcblx0XHRcdFx0XHRcdE1hdGgubWF4KG1pblZhbCwgbnVtKSxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHZhbHVlcy5wdXNoKGNsYW1wZWQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGFsbE1pc3NpbmcpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdGxldCBsYWJlbCA9ICcnO1xuXHRcdFx0XHRpZiAobGFiZWxQcm9wZXJ0eUlkKSB7XG5cdFx0XHRcdFx0Y29uc3QgbFZhbCA9IGVudHJ5LmdldFZhbHVlKGxhYmVsUHJvcGVydHlJZCk7XG5cdFx0XHRcdFx0aWYgKGxWYWwgJiYgbFZhbCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRsYWJlbCA9IGxWYWwudG9TdHJpbmcoKS50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghbGFiZWwpXG5cdFx0XHRcdFx0bGFiZWwgPSBlbnRyeS5maWxlPy5iYXNlbmFtZSA/PyBgKHNlcmllcyAke2N1cnZlSW5kZXggKyAxfSlgO1xuXG5cdFx0XHRcdGNvbnN0IGN1cnZlSWQgPSBgcyR7Y3VydmVJbmRleCsrfWA7XG5cblx0XHRcdFx0Y3VydmVzLnB1c2goe2lkOiBjdXJ2ZUlkLCBsYWJlbCwgdmFsdWVzfSk7XG5cdFx0XHRcdGhhc0FueVZhbHVlID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIWhhc0FueVZhbHVlIHx8IGN1cnZlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHRoaXMuY29udGFpbmVyRWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0dGV4dDogJ05vIG51bWVyaWMvYm9vbGVhbiB2YWx1ZXMgZm91bmQgZm9yIHRoZSBzZWxlY3RlZCBheGlzIHByb3BlcnRpZXMuJyxcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIDQpIEJ1aWxkIHJhZGFyLWJldGEgbWVybWFpZENvZGVcblx0XHRjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblx0XHRsaW5lcy5wdXNoKCdyYWRhci1iZXRhJyk7XG5cdFx0aWYgKHRpdGxlKVxuXHRcdFx0bGluZXMucHVzaChgICB0aXRsZSBcIiR7dGl0bGV9XCJgKTtcblxuXHRcdC8vIEF4aXMgc3RhdGVtZW50cyDigJMgY2h1bmsgaW50byBsaW5lcyBvZiB1cCB0byBOIGF4ZXMgZm9yIHJlYWRhYmlsaXR5XG5cdFx0Y29uc3QgYXhpc0NodW5rczogQXhpc1tdW10gPSBbXTtcblx0XHRjb25zdCBjaHVua1NpemUgPSA2O1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYXhlcy5sZW5ndGg7IGkgKz0gY2h1bmtTaXplKSB7XG5cdFx0XHRheGlzQ2h1bmtzLnB1c2goYXhlcy5zbGljZShpLCBpICsgY2h1bmtTaXplKSk7XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBjaHVuayBvZiBheGlzQ2h1bmtzKSB7XG5cdFx0XHRjb25zdCBwYXJ0cyA9IGNodW5rLm1hcCgoYXhpcykgPT4ge1xuXHRcdFx0XHRjb25zdCBzYWZlTGFiZWwgPSBheGlzLmxhYmVsLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcblx0XHRcdFx0cmV0dXJuIGAke2F4aXMuaWR9W1wiJHtzYWZlTGFiZWx9XCJdYDtcblx0XHRcdH0pO1xuXHRcdFx0bGluZXMucHVzaChgICBheGlzICR7cGFydHMuam9pbignLCAnKX1gKTtcblx0XHR9XG5cblx0XHQvLyBDdXJ2ZXNcblx0XHRmb3IgKGNvbnN0IGN1cnZlIG9mIGN1cnZlcykge1xuXHRcdFx0Y29uc3Qgc2FmZUxhYmVsID0gY3VydmUubGFiZWwucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpO1xuXHRcdFx0Y29uc3QgdmFscyA9IGN1cnZlLnZhbHVlcy5qb2luKCcsICcpO1xuXHRcdFx0bGluZXMucHVzaChcblx0XHRcdFx0YCAgY3VydmUgJHtjdXJ2ZS5pZH1bXCIke3NhZmVMYWJlbH1cIl17JHt2YWxzfX1gLFxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHQvLyBNYWtlIGVhY2ggY3VydmUgbGFiZWwgY2xpY2thYmxlIGFzIGFuIGludGVybmFsIGxpbmtcblx0XHRsaW5lcy5wdXNoKCcgICUlIGludGVybmFsLWxpbmsgY2xhc3NlcyBmb3IgY3VydmVzJyk7XG5cdFx0Zm9yIChjb25zdCBjdXJ2ZSBvZiBjdXJ2ZXMpIHtcblx0XHRcdGxpbmVzLnB1c2goYCAgY2xhc3MgJHtjdXJ2ZS5pZH0gaW50ZXJuYWwtbGluaztgKTtcblx0XHR9XG5cblx0XHQvLyBNaW4gLyBtYXhcblx0XHRsaW5lcy5wdXNoKGAgIG1heCAke21heFZhbH1gKTtcblx0XHRsaW5lcy5wdXNoKGAgIG1pbiAke21pblZhbH1gKTtcblxuXHRcdGNvbnN0IG1lcm1haWRDb2RlID0gbGluZXMuam9pbignXFxuJyk7XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJNZXJtYWlkKG1lcm1haWRDb2RlKTtcblx0fVxufVxuIl19