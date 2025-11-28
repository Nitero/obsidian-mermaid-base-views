import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from "./MermaidBaseViewBase";
import { MermaidMindmapViewId } from "../core/constants";
export class MermaidMindmapBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidMindmapViewId;
    }
    render() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const rawRootLabel = this.config.get('rootLabel');
            const rootLabel = typeof rawRootLabel === 'string' && rawRootLabel.trim().length > 0
                ? rawRootLabel.trim()
                : 'Mindmap';
            const showPropertyNames = this.config.get('showPropertyNames');
            const md = this.app.metadataCache;
            // 1) Collect all files in this Base (dedup across groups)
            const fileByPath = new Map();
            for (const group of this.data.groupedData) {
                for (const entry of group.entries) {
                    if (!entry.file)
                        continue;
                    if (!fileByPath.has(entry.file.path)) {
                        fileByPath.set(entry.file.path, entry.file);
                    }
                }
            }
            if (fileByPath.size === 0) {
                this.containerEl.createDiv({
                    text: 'No files available in this base to build a mindmap.',
                });
                return;
            }
            // 2) Build adjacency from outgoing links (restricted to files in this Base)
            const outgoing = new Map(); // fromPath -> Set<toPath>
            const indegree = new Map(); // path -> count
            for (const path of fileByPath.keys()) {
                indegree.set(path, 0);
            }
            for (const [path, file] of fileByPath.entries()) {
                const cache = md.getFileCache(file);
                const links = (_a = cache === null || cache === void 0 ? void 0 : cache.links) !== null && _a !== void 0 ? _a : [];
                const embeds = (_b = cache === null || cache === void 0 ? void 0 : cache.embeds) !== null && _b !== void 0 ? _b : [];
                const allLinks = [...links, ...embeds];
                for (const link of allLinks) {
                    const target = md.getFirstLinkpathDest(link.link, file.path);
                    if (!target)
                        continue;
                    if (!fileByPath.has(target.path))
                        continue;
                    if (target.path === path)
                        continue; // skip self-link
                    let set = outgoing.get(path);
                    if (!set) {
                        set = new Set();
                        outgoing.set(path, set);
                    }
                    if (!set.has(target.path)) {
                        set.add(target.path);
                        indegree.set(target.path, ((_c = indegree.get(target.path)) !== null && _c !== void 0 ? _c : 0) + 1);
                    }
                }
            }
            // 3) Choose roots (orphans = no incoming links). If none, all become roots.
            const allPaths = Array.from(fileByPath.keys());
            let roots = allPaths.filter((p) => { var _a; return ((_a = indegree.get(p)) !== null && _a !== void 0 ? _a : 0) === 0; });
            if (roots.length === 0) {
                roots = allPaths;
            }
            // 4) Assign node IDs and labels
            const fileToNodeId = new Map(); // path -> nodeId
            const nodeIds = [];
            let idx = 0;
            for (const path of allPaths) {
                const id = `n${idx++}`;
                fileToNodeId.set(path, id);
                nodeIds.push(id);
            }
            const safeText = (text) => text.replace(/"/g, '\\"');
            // 5) Build the mindmap lines
            const lines = [];
            lines.push('mindmap');
            const rootId = 'root';
            lines.push(`  ${rootId}["${safeText(rootLabel)}"]`);
            const visited = new Set();
            const indent = (level) => '  '.repeat(level);
            const renderNode = (path, level) => {
                if (visited.has(path))
                    return;
                visited.add(path);
                const file = fileByPath.get(path);
                if (!file)
                    return;
                const nodeId = fileToNodeId.get(path);
                const label = this.getLabelWithProperties(file, showPropertyNames, "\n", ":");
                const safeLabel = safeText(label);
                // This line creates the node and places it hierarchically by indentation.
                lines.push(`${indent(level)}${nodeId}["${safeLabel}"]`);
                const children = outgoing.get(path);
                if (!children)
                    return;
                for (const childPath of children) {
                    renderNode(childPath, level + 1);
                }
            };
            // Attach all roots as children of the central node
            for (const rootPath of roots) {
                renderNode(rootPath, 2);
            }
            // 6) Make all note nodes clickable internal links
            // if (nodeIds.length > 0) {
            // 	lines.push(
            // 		`  class ${nodeIds.join(
            // 			',',
            // 		)} internal-link;`,
            // 	);
            // }
            const mermaidCode = lines.join('\n');
            yield this.renderMermaid(mermaidCode);
        });
    }
}
MermaidMindmapBaseView.RegistrationData = {
    id: MermaidMindmapViewId,
    name: 'Mindmap',
    icon: 'brain',
    options: [
        {
            type: 'text',
            displayName: 'Central node label',
            key: 'rootLabel',
            default: 'Mindmap',
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
            placeholder: `---\nconfig:\n  mindmap:\n    padding: 8\n---`,
        },
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZE1pbmRtYXBCYXNlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1lcm1haWRNaW5kbWFwQmFzZVZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSXZELE1BQU0sT0FBTyxzQkFBdUIsU0FBUSxtQkFBbUI7SUFBL0Q7O1FBQ1UsU0FBSSxHQUFHLG9CQUFvQixDQUFDO0lBd0t0QyxDQUFDO0lBNUlnQixNQUFNOzs7WUFDckIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbEQsTUFBTSxTQUFTLEdBQ2QsT0FBTyxZQUFZLEtBQUssUUFBUSxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDakUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7Z0JBQ3JCLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFFZCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFZLENBQUM7WUFFMUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7WUFFbEMsMERBQTBEO1lBQzFELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1lBQzVDLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQzFDLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtvQkFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO3dCQUFFLFNBQVM7b0JBQzFCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJ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QVcsQ0FBQyxDQUFDOztLQUN0Qzs7QUFyS2UsdUNBQWdCLEdBQWdDO0lBQy9ELEVBQUUsRUFBRSxvQkFBb0I7SUFDeEIsSUFBSSxFQUFFLFNBQVM7SUFDZixJQUFJLEVBQUUsT0FBTztJQUNiLE9BQU8sRUFBRTtRQUNSO1lBQ0MsSUFBSSxFQUFFLE1BQU07WUFDWixXQUFXLEVBQUUsb0JBQW9CO1lBQ2pDLEdBQUcsRUFBRSxXQUFXO1lBQ2hCLE9BQU8sRUFBRSxTQUFTO1NBQ2xCO1FBQ0Q7WUFDQyxJQUFJLEVBQUUsUUFBUTtZQUNkLFdBQVcsRUFBRSxxQkFBcUI7WUFDbEMsR0FBRyxFQUFFLG1CQUFtQjtZQUN4QixPQUFPLEVBQUUsSUFBSTtTQUNiO1FBQ0Q7WUFDQyxJQUFJLEVBQUUsTUFBTTtZQUNaLFdBQVcsRUFBRSwyQkFBMkI7WUFDeEMsR0FBRyxFQUFFLGVBQWU7WUFDcEIsV0FBVyxFQUFFLCtDQUErQztTQUM1RDtLQUNEO0NBQ0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TWVybWFpZEJhc2VWaWV3QmFzZX0gZnJvbSBcIi4vTWVybWFpZEJhc2VWaWV3QmFzZVwiO1xuaW1wb3J0IHtNZXJtYWlkTWluZG1hcFZpZXdJZH0gZnJvbSBcIi4uL2NvcmUvY29uc3RhbnRzXCI7XG5pbXBvcnQge1RGaWxlfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7TWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhfSBmcm9tIFwiLi4vY29yZS9NZXJtYWlkVmlld1JlZ2lzdHJhdGlvbkRhdGFcIjtcblxuZXhwb3J0IGNsYXNzIE1lcm1haWRNaW5kbWFwQmFzZVZpZXcgZXh0ZW5kcyBNZXJtYWlkQmFzZVZpZXdCYXNlIHtcblx0cmVhZG9ubHkgdHlwZSA9IE1lcm1haWRNaW5kbWFwVmlld0lkO1xuXG5cdHN0YXRpYyByZWFkb25seSBSZWdpc3RyYXRpb25EYXRhOiBNZXJtYWlkVmlld1JlZ2lzdHJhdGlvbkRhdGEgPSB7XG5cdFx0aWQ6IE1lcm1haWRNaW5kbWFwVmlld0lkLFxuXHRcdG5hbWU6ICdNaW5kbWFwJyxcblx0XHRpY29uOiAnYnJhaW4nLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHtcblx0XHRcdFx0dHlwZTogJ3RleHQnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ0NlbnRyYWwgbm9kZSBsYWJlbCcsXG5cdFx0XHRcdGtleTogJ3Jvb3RMYWJlbCcsXG5cdFx0XHRcdGRlZmF1bHQ6ICdNaW5kbWFwJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0b2dnbGUnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1Nob3cgcHJvcGVydHkgbmFtZXMnLFxuXHRcdFx0XHRrZXk6ICdzaG93UHJvcGVydHlOYW1lcycsXG5cdFx0XHRcdGRlZmF1bHQ6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnTWVybWFpZCBjb25maWcgKG9wdGlvbmFsKScsXG5cdFx0XHRcdGtleTogJ21lcm1haWRDb25maWcnLFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogYC0tLVxcbmNvbmZpZzpcXG4gIG1pbmRtYXA6XFxuICAgIHBhZGRpbmc6IDhcXG4tLS1gLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9O1xuXG5cdHByb3RlY3RlZCBhc3luYyByZW5kZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgcmF3Um9vdExhYmVsID0gdGhpcy5jb25maWcuZ2V0KCdyb290TGFiZWwnKTtcblx0XHRjb25zdCByb290TGFiZWwgPVxuXHRcdFx0dHlwZW9mIHJhd1Jvb3RMYWJlbCA9PT0gJ3N0cmluZycgJiYgcmF3Um9vdExhYmVsLnRyaW0oKS5sZW5ndGggPiAwXG5cdFx0XHRcdD8gcmF3Um9vdExhYmVsLnRyaW0oKVxuXHRcdFx0XHQ6ICdNaW5kbWFwJztcblxuXHRcdGNvbnN0IHNob3dQcm9wZXJ0eU5hbWVzID0gdGhpcy5jb25maWcuZ2V0KCdzaG93UHJvcGVydHlOYW1lcycpIGFzIEJvb2xlYW47XG5cblx0XHRjb25zdCBtZCA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGU7XG5cblx0XHQvLyAxKSBDb2xsZWN0IGFsbCBmaWxlcyBpbiB0aGlzIEJhc2UgKGRlZHVwIGFjcm9zcyBncm91cHMpXG5cdFx0Y29uc3QgZmlsZUJ5UGF0aCA9IG5ldyBNYXA8c3RyaW5nLCBURmlsZT4oKTtcblx0XHRmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMuZGF0YS5ncm91cGVkRGF0YSkge1xuXHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiBncm91cC5lbnRyaWVzKSB7XG5cdFx0XHRcdGlmICghZW50cnkuZmlsZSkgY29udGludWU7XG5cdFx0XHRcdGlmICghZmlsZUJ5UGF0aC5oYXMoZW50cnkuZmlsZS5wYXRoKSkge1xuXHRcdFx0XHRcdGZpbGVCeVBhdGguc2V0KGVudHJ5LmZpbGUucGF0aCwgZW50cnkuZmlsZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZmlsZUJ5UGF0aC5zaXplID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6ICdObyBmaWxlcyBhdmFpbGFibGUgaW4gdGhpcyBiYXNlIHRvIGJ1aWxkIGEgbWluZG1hcC4nLFxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gMikgQnVpbGQgYWRqYWNlbmN5IGZyb20gb3V0Z29pbmcgbGlua3MgKHJlc3RyaWN0ZWQgdG8gZmlsZXMgaW4gdGhpcyBCYXNlKVxuXHRcdGNvbnN0IG91dGdvaW5nID0gbmV3IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PigpOyAvLyBmcm9tUGF0aCAtPiBTZXQ8dG9QYXRoPlxuXHRcdGNvbnN0IGluZGVncmVlID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTsgLy8gcGF0aCAtPiBjb3VudFxuXG5cdFx0Zm9yIChjb25zdCBwYXRoIG9mIGZpbGVCeVBhdGgua2V5cygpKSB7XG5cdFx0XHRpbmRlZ3JlZS5zZXQocGF0aCwgMCk7XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBbcGF0aCwgZmlsZV0gb2YgZmlsZUJ5UGF0aC5lbnRyaWVzKCkpIHtcblx0XHRcdGNvbnN0IGNhY2hlID0gbWQuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuXHRcdFx0Y29uc3QgbGlua3MgPSBjYWNoZT8ubGlua3MgPz8gW107XG5cdFx0XHRjb25zdCBlbWJlZHMgPSBjYWNoZT8uZW1iZWRzID8/IFtdO1xuXHRcdFx0Y29uc3QgYWxsTGlua3MgPSBbLi4ubGlua3MsIC4uLmVtYmVkc107XG5cblx0XHRcdGZvciAoY29uc3QgbGluayBvZiBhbGxMaW5rcykge1xuXHRcdFx0XHRjb25zdCB0YXJnZXQgPSBtZC5nZXRGaXJzdExpbmtwYXRoRGVzdChsaW5rLmxpbmssIGZpbGUucGF0aCk7XG5cdFx0XHRcdGlmICghdGFyZ2V0KSBjb250aW51ZTtcblx0XHRcdFx0aWYgKCFmaWxlQnlQYXRoLmhhcyh0YXJnZXQucGF0aCkpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdGlmICh0YXJnZXQucGF0aCA9PT0gcGF0aCkgY29udGludWU7IC8vIHNraXAgc2VsZi1saW5rXG5cblx0XHRcdFx0bGV0IHNldCA9IG91dGdvaW5nLmdldChwYXRoKTtcblx0XHRcdFx0aWYgKCFzZXQpIHtcblx0XHRcdFx0XHRzZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblx0XHRcdFx0XHRvdXRnb2luZy5zZXQocGF0aCwgc2V0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIXNldC5oYXModGFyZ2V0LnBhdGgpKSB7XG5cdFx0XHRcdFx0c2V0LmFkZCh0YXJnZXQucGF0aCk7XG5cdFx0XHRcdFx0aW5kZWdyZWUuc2V0KFxuXHRcdFx0XHRcdFx0dGFyZ2V0LnBhdGgsXG5cdFx0XHRcdFx0XHQoaW5kZWdyZWUuZ2V0KHRhcmdldC5wYXRoKSA/PyAwKSArIDEsXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIDMpIENob29zZSByb290cyAob3JwaGFucyA9IG5vIGluY29taW5nIGxpbmtzKS4gSWYgbm9uZSwgYWxsIGJlY29tZSByb290cy5cblx0XHRjb25zdCBhbGxQYXRocyA9IEFycmF5LmZyb20oZmlsZUJ5UGF0aC5rZXlzKCkpO1xuXHRcdGxldCByb290cyA9IGFsbFBhdGhzLmZpbHRlcihcblx0XHRcdChwKSA9PiAoaW5kZWdyZWUuZ2V0KHApID8/IDApID09PSAwLFxuXHRcdCk7XG5cdFx0aWYgKHJvb3RzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cm9vdHMgPSBhbGxQYXRocztcblx0XHR9XG5cblx0XHQvLyA0KSBBc3NpZ24gbm9kZSBJRHMgYW5kIGxhYmVsc1xuXHRcdGNvbnN0IGZpbGVUb05vZGVJZCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7IC8vIHBhdGggLT4gbm9kZUlkXG5cdFx0Y29uc3Qgbm9kZUlkczogc3RyaW5nW10gPSBbXTtcblxuXHRcdGxldCBpZHggPSAwO1xuXHRcdGZvciAoY29uc3QgcGF0aCBvZiBhbGxQYXRocykge1xuXHRcdFx0Y29uc3QgaWQgPSBgbiR7aWR4Kyt9YDtcblx0XHRcdGZpbGVUb05vZGVJZC5zZXQocGF0aCwgaWQpO1xuXHRcdFx0bm9kZUlkcy5wdXNoKGlkKTtcblx0XHR9XG5cblx0XHRjb25zdCBzYWZlVGV4dCA9ICh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcgPT5cblx0XHRcdHRleHQucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpO1xuXG5cdFx0Ly8gNSkgQnVpbGQgdGhlIG1pbmRtYXAgbGluZXNcblx0XHRjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcblx0XHRsaW5lcy5wdXNoKCdtaW5kbWFwJyk7XG5cblx0XHRjb25zdCByb290SWQgPSAncm9vdCc7XG5cdFx0bGluZXMucHVzaChgICAke3Jvb3RJZH1bXCIke3NhZmVUZXh0KHJvb3RMYWJlbCl9XCJdYCk7XG5cblx0XHRjb25zdCB2aXNpdGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cblx0XHRjb25zdCBpbmRlbnQgPSAobGV2ZWw6IG51bWJlcikgPT4gJyAgJy5yZXBlYXQobGV2ZWwpO1xuXG5cdFx0Y29uc3QgcmVuZGVyTm9kZSA9IChwYXRoOiBzdHJpbmcsIGxldmVsOiBudW1iZXIpID0+IHtcblx0XHRcdGlmICh2aXNpdGVkLmhhcyhwYXRoKSkgcmV0dXJuO1xuXHRcdFx0dmlzaXRlZC5hZGQocGF0aCk7XG5cblx0XHRcdGNvbnN0IGZpbGUgPSBmaWxlQnlQYXRoLmdldChwYXRoKTtcblx0XHRcdGlmICghZmlsZSkgcmV0dXJuO1xuXG5cdFx0XHRjb25zdCBub2RlSWQgPSBmaWxlVG9Ob2RlSWQuZ2V0KHBhdGgpITtcblx0XHRcdGNvbnN0IGxhYmVsID0gdGhpcy5nZXRMYWJlbFdpdGhQcm9wZXJ0aWVzKGZpbGUsIHNob3dQcm9wZXJ0eU5hbWVzLCBcIlxcblwiLCBcIjpcIik7XG5cdFx0XHRjb25zdCBzYWZlTGFiZWwgPSBzYWZlVGV4dChsYWJlbCk7XG5cblx0XHRcdC8vIFRoaXMgbGluZSBjcmVhdGVzIHRoZSBub2RlIGFuZCBwbGFjZXMgaXQgaGllcmFyY2hpY2FsbHkgYnkgaW5kZW50YXRpb24uXG5cdFx0XHRsaW5lcy5wdXNoKFxuXHRcdFx0XHRgJHtpbmRlbnQobGV2ZWwpfSR7bm9kZUlkfVtcIiR7c2FmZUxhYmVsfVwiXWAsXG5cdFx0XHQpO1xuXG5cdFx0XHRjb25zdCBjaGlsZHJlbiA9IG91dGdvaW5nLmdldChwYXRoKTtcblx0XHRcdGlmICghY2hpbGRyZW4pIHJldHVybjtcblxuXHRcdFx0Zm9yIChjb25zdCBjaGlsZFBhdGggb2YgY2hpbGRyZW4pIHtcblx0XHRcdFx0cmVuZGVyTm9kZShjaGlsZFBhdGgsIGxldmVsICsgMSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIEF0dGFjaCBhbGwgcm9vdHMgYXMgY2hpbGRyZW4gb2YgdGhlIGNlbnRyYWwgbm9kZVxuXHRcdGZvciAoY29uc3Qgcm9vdFBhdGggb2Ygcm9vdHMpIHtcblx0XHRcdHJlbmRlck5vZGUocm9vdFBhdGgsIDIpO1xuXHRcdH1cblxuXHRcdC8vIDYpIE1ha2UgYWxsIG5vdGUgbm9kZXMgY2xpY2thYmxlIGludGVybmFsIGxpbmtzXG5cdFx0Ly8gaWYgKG5vZGVJZHMubGVuZ3RoID4gMCkge1xuXHRcdC8vIFx0bGluZXMucHVzaChcblx0XHQvLyBcdFx0YCAgY2xhc3MgJHtub2RlSWRzLmpvaW4oXG5cdFx0Ly8gXHRcdFx0JywnLFxuXHRcdC8vIFx0XHQpfSBpbnRlcm5hbC1saW5rO2AsXG5cdFx0Ly8gXHQpO1xuXHRcdC8vIH1cblxuXHRcdGNvbnN0IG1lcm1haWRDb2RlID0gbGluZXMuam9pbignXFxuJyk7XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJNZXJtYWlkKG1lcm1haWRDb2RlKTtcblx0fVxufVxuIl19