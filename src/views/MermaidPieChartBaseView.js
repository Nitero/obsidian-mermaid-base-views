import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from './MermaidBaseViewBase';
import { MermaidPieViewId } from '../core/constants';
export class MermaidPieChartBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidPieViewId;
    }
    render() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const categoryPropertyId = this.config.getAsPropertyId('categoryProperty');
            const valuePropertyId = this.config.getAsPropertyId('valueProperty');
            const title = this.config.get('title');
            const showDataLabel = this.config.get('showDataLabel');
            if (!categoryPropertyId) {
                this.containerEl.createDiv({ text: 'Configure a category property in the view settings to render the pie chart.' });
                return;
            }
            const categoryTotals = new Map();
            for (const group of this.data.groupedData) {
                for (const entry of group.entries) {
                    const catValue = entry.getValue(categoryPropertyId);
                    if (catValue == null)
                        continue;
                    const label = catValue.toString();
                    if (!label)
                        continue;
                    let amount = 1;
                    if (valuePropertyId) {
                        const value = entry.getValue(valuePropertyId);
                        if (value != null) {
                            const num = Number(value.toString());
                            if (!Number.isNaN(num)) {
                                amount = num;
                            }
                        }
                    }
                    categoryTotals.set(label, ((_a = categoryTotals.get(label)) !== null && _a !== void 0 ? _a : 0) + amount);
                }
            }
            if (categoryTotals.size === 0) {
                this.containerEl.createDiv({
                    text: 'No data to display for the current filter and configuration.',
                });
                return;
            }
            let mermaidCode = `pie ${showDataLabel ? "showData" : ""} title ${title}\n`;
            for (const [label, amount] of categoryTotals) {
                mermaidCode += `    "${label}" : ${amount}\n`;
            }
            yield this.renderMermaid(mermaidCode);
        });
    }
}
MermaidPieChartBaseView.RegistrationData = {
    id: MermaidPieViewId,
    name: 'Pie Chart',
    icon: 'pie-chart',
    options: [
        {
            type: 'text',
            displayName: 'Title',
            key: 'title',
            default: 'Title',
        },
        {
            type: 'property',
            displayName: 'Category property',
            key: 'categoryProperty',
            placeholder: 'e.g. status or tag',
        },
        {
            type: 'property',
            displayName: 'Value property (optional, numeric)',
            key: 'valueProperty',
            placeholder: 'e.g. count or size',
        },
        {
            type: 'toggle',
            displayName: 'Show values on labels',
            key: 'showDataLabel',
            default: false,
        },
        {
            type: 'text',
            displayName: 'Mermaid config (optional)',
            key: 'mermaidConfig',
            placeholder: `%%{init: { 'theme': 'dark' }}%%`,
        },
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZFBpZUNoYXJ0QmFzZVZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJNZXJtYWlkUGllQ2hhcnRCYXNlVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHbkQsTUFBTSxPQUFPLHVCQUF3QixTQUFRLG1CQUFtQjtJQUFoRTs7UUFDVSxTQUFJLEdBQUcsZ0JBQWdCLENBQUM7SUEwRmxDLENBQUM7SUFsRGdCLE1BQU07OztZQUNyQixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDM0UsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDckUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFZLENBQUM7WUFFbEUsSUFBSSxDQUFDLGtCQUFrQixFQUFFO2dCQUN4QixJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFDLElBQUksRUFBRSw2RUFBNkUsRUFBQyxDQUFDLENBQUM7Z0JBQ2xILE9BQU87YUFDUDtZQUVELE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBRWpELEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQzFDLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtvQkFDbEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUNwRCxJQUFJLFFBQVEsSUFBSSxJQUFJO3dCQUFFLFNBQVM7b0JBRS9CLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxDQUFDLEtBQUs7d0JBQUUsU0FBUztvQkFFckIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUNmLElBQUksZUFBZSxFQUFFO3dCQUNwQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDO3dCQUM5QyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7NEJBQ2xCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzs0QkFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0NBQ3ZCLE1BQU0sR0FBRyxHQUFHLENBQUM7NkJBQ2I7eUJBQ0Q7cUJBQ0Q7b0JBRUQsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFBLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLG1DQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO2lCQUNyRTthQUNEO1lBRUQsSUFBSSxjQUFjLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUM7b0JBQzFCLElBQUksRUFBRSw4REFBOEQ7aUJBQ3BFLENBQUMsQ0FBQztnQkFDSCxPQUFPO2FBQ1A7WUFFRCxJQUFJLFdBQVcsR0FBRyxPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsS0FBSyxJQUFJLENBQUM7WUFDNUUsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLGNBQWMsRUFBRTtnQkFDN0MsV0FBVyxJQUFJLFFBQVEsS0FBSyxPQUFPLE1BQU0sSUFBSSxDQUFDO2FBQzlDO1lBRUQsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDOztLQUN0Qzs7QUF2RmUsd0NBQWdCLEdBQWdDO0lBQy9ELEVBQUUsRUFBRSxnQkFBZ0I7SUFDcEIsSUFBSSxFQUFFLFdBQVc7SUFDakIsSUFBSSxFQUFFLFdBQVc7SUFDakIsT0FBTyxFQUFFO1FBQ1I7WUFDQyxJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRSxPQUFPO1lBQ3BCLEdBQUcsRUFBRSxPQUFPO1lBQ1osT0FBTyxFQUFFLE9BQU87U0FDaEI7UUFDRDtZQUNDLElBQUksRUFBRSxVQUFVO1lBQ2hCLFdBQVcsRUFBRSxtQkFBbUI7WUFDaEMsR0FBRyxFQUFFLGtCQUFrQjtZQUN2QixXQUFXLEVBQUUsb0JBQW9CO1NBQ2pDO1FBQ0Q7WUFDQyxJQUFJLEVBQUUsVUFBVTtZQUNoQixXQUFXLEVBQUUsb0NBQW9DO1lBQ2pELEdBQUcsRUFBRSxlQUFlO1lBQ3BCLFdBQVcsRUFBRSxvQkFBb0I7U0FDakM7UUFDRDtZQUNDLElBQUksRUFBRSxRQUFRO1lBQ2QsV0FBVyxFQUFFLHVCQUF1QjtZQUNwQyxHQUFHLEVBQUUsZUFBZTtZQUNwQixPQUFPLEVBQUUsS0FBSztTQUNkO1FBQ0Q7WUFDQyxJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRSwyQkFBMkI7WUFDeEMsR0FBRyxFQUFFLGVBQWU7WUFDcEIsV0FBVyxFQUFFLGlDQUFpQztTQUM5QztLQUNEO0NBQ0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TWVybWFpZEJhc2VWaWV3QmFzZX0gZnJvbSAnLi9NZXJtYWlkQmFzZVZpZXdCYXNlJztcclxuaW1wb3J0IHtNZXJtYWlkUGllVmlld0lkfSBmcm9tICcuLi9jb3JlL2NvbnN0YW50cyc7XHJcbmltcG9ydCB7TWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhfSBmcm9tIFwiLi4vY29yZS9NZXJtYWlkVmlld1JlZ2lzdHJhdGlvbkRhdGFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNZXJtYWlkUGllQ2hhcnRCYXNlVmlldyBleHRlbmRzIE1lcm1haWRCYXNlVmlld0Jhc2Uge1xyXG5cdHJlYWRvbmx5IHR5cGUgPSBNZXJtYWlkUGllVmlld0lkO1xyXG5cclxuXHRzdGF0aWMgcmVhZG9ubHkgUmVnaXN0cmF0aW9uRGF0YTogTWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhID0ge1xyXG5cdFx0aWQ6IE1lcm1haWRQaWVWaWV3SWQsXHJcblx0XHRuYW1lOiAnUGllIENoYXJ0JyxcclxuXHRcdGljb246ICdwaWUtY2hhcnQnLFxyXG5cdFx0b3B0aW9uczogW1xyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxyXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnVGl0bGUnLFxyXG5cdFx0XHRcdGtleTogJ3RpdGxlJyxcclxuXHRcdFx0XHRkZWZhdWx0OiAnVGl0bGUnLFxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogJ3Byb3BlcnR5JyxcclxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ0NhdGVnb3J5IHByb3BlcnR5JyxcclxuXHRcdFx0XHRrZXk6ICdjYXRlZ29yeVByb3BlcnR5JyxcclxuXHRcdFx0XHRwbGFjZWhvbGRlcjogJ2UuZy4gc3RhdHVzIG9yIHRhZycsXHJcblx0XHRcdH0sXHJcblx0XHRcdHtcclxuXHRcdFx0XHR0eXBlOiAncHJvcGVydHknLFxyXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnVmFsdWUgcHJvcGVydHkgKG9wdGlvbmFsLCBudW1lcmljKScsXHJcblx0XHRcdFx0a2V5OiAndmFsdWVQcm9wZXJ0eScsXHJcblx0XHRcdFx0cGxhY2Vob2xkZXI6ICdlLmcuIGNvdW50IG9yIHNpemUnLFxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogJ3RvZ2dsZScsXHJcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdTaG93IHZhbHVlcyBvbiBsYWJlbHMnLFxyXG5cdFx0XHRcdGtleTogJ3Nob3dEYXRhTGFiZWwnLFxyXG5cdFx0XHRcdGRlZmF1bHQ6IGZhbHNlLFxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxyXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnTWVybWFpZCBjb25maWcgKG9wdGlvbmFsKScsXHJcblx0XHRcdFx0a2V5OiAnbWVybWFpZENvbmZpZycsXHJcblx0XHRcdFx0cGxhY2Vob2xkZXI6IGAlJXtpbml0OiB7ICd0aGVtZSc6ICdkYXJrJyB9fSUlYCxcclxuXHRcdFx0fSxcclxuXHRcdF0sXHJcblx0fTtcclxuXHJcblx0cHJvdGVjdGVkIGFzeW5jIHJlbmRlcigpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHRcdGNvbnN0IGNhdGVnb3J5UHJvcGVydHlJZCA9IHRoaXMuY29uZmlnLmdldEFzUHJvcGVydHlJZCgnY2F0ZWdvcnlQcm9wZXJ0eScpO1xyXG5cdFx0Y29uc3QgdmFsdWVQcm9wZXJ0eUlkID0gdGhpcy5jb25maWcuZ2V0QXNQcm9wZXJ0eUlkKCd2YWx1ZVByb3BlcnR5Jyk7XHJcblx0XHRjb25zdCB0aXRsZSA9IHRoaXMuY29uZmlnLmdldCgndGl0bGUnKTtcclxuXHRcdGNvbnN0IHNob3dEYXRhTGFiZWwgPSB0aGlzLmNvbmZpZy5nZXQoJ3Nob3dEYXRhTGFiZWwnKSBhcyBCb29sZWFuO1xyXG5cclxuXHRcdGlmICghY2F0ZWdvcnlQcm9wZXJ0eUlkKSB7XHJcblx0XHRcdHRoaXMuY29udGFpbmVyRWwuY3JlYXRlRGl2KHt0ZXh0OiAnQ29uZmlndXJlIGEgY2F0ZWdvcnkgcHJvcGVydHkgaW4gdGhlIHZpZXcgc2V0dGluZ3MgdG8gcmVuZGVyIHRoZSBwaWUgY2hhcnQuJ30pO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgY2F0ZWdvcnlUb3RhbHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xyXG5cclxuXHRcdGZvciAoY29uc3QgZ3JvdXAgb2YgdGhpcy5kYXRhLmdyb3VwZWREYXRhKSB7XHJcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZ3JvdXAuZW50cmllcykge1xyXG5cdFx0XHRcdGNvbnN0IGNhdFZhbHVlID0gZW50cnkuZ2V0VmFsdWUoY2F0ZWdvcnlQcm9wZXJ0eUlkKTtcclxuXHRcdFx0XHRpZiAoY2F0VmFsdWUgPT0gbnVsbCkgY29udGludWU7XHJcblxyXG5cdFx0XHRcdGNvbnN0IGxhYmVsID0gY2F0VmFsdWUudG9TdHJpbmcoKTtcclxuXHRcdFx0XHRpZiAoIWxhYmVsKSBjb250aW51ZTtcclxuXHJcblx0XHRcdFx0bGV0IGFtb3VudCA9IDE7XHJcblx0XHRcdFx0aWYgKHZhbHVlUHJvcGVydHlJZCkge1xyXG5cdFx0XHRcdFx0Y29uc3QgdmFsdWUgPSBlbnRyeS5nZXRWYWx1ZSh2YWx1ZVByb3BlcnR5SWQpO1xyXG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgbnVtID0gTnVtYmVyKHZhbHVlLnRvU3RyaW5nKCkpO1xyXG5cdFx0XHRcdFx0XHRpZiAoIU51bWJlci5pc05hTihudW0pKSB7XHJcblx0XHRcdFx0XHRcdFx0YW1vdW50ID0gbnVtO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjYXRlZ29yeVRvdGFscy5zZXQobGFiZWwsIChjYXRlZ29yeVRvdGFscy5nZXQobGFiZWwpID8/IDApICsgYW1vdW50KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjYXRlZ29yeVRvdGFscy5zaXplID09PSAwKSB7XHJcblx0XHRcdHRoaXMuY29udGFpbmVyRWwuY3JlYXRlRGl2KHtcclxuXHRcdFx0XHR0ZXh0OiAnTm8gZGF0YSB0byBkaXNwbGF5IGZvciB0aGUgY3VycmVudCBmaWx0ZXIgYW5kIGNvbmZpZ3VyYXRpb24uJyxcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbWVybWFpZENvZGUgPSBgcGllICR7c2hvd0RhdGFMYWJlbCA/IFwic2hvd0RhdGFcIiA6IFwiXCJ9IHRpdGxlICR7dGl0bGV9XFxuYDtcclxuXHRcdGZvciAoY29uc3QgW2xhYmVsLCBhbW91bnRdIG9mIGNhdGVnb3J5VG90YWxzKSB7XHJcblx0XHRcdG1lcm1haWRDb2RlICs9IGAgICAgXCIke2xhYmVsfVwiIDogJHthbW91bnR9XFxuYDtcclxuXHRcdH1cclxuXHJcblx0XHRhd2FpdCB0aGlzLnJlbmRlck1lcm1haWQobWVybWFpZENvZGUpO1xyXG5cdH1cclxufVxyXG4iXX0=