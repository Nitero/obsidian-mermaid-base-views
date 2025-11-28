import { __awaiter } from "tslib";
import { MermaidBaseViewBase } from "./MermaidBaseViewBase";
import { MermaidFlowchartViewId } from "../core/constants";
export class MermaidFlowchartBaseView extends MermaidBaseViewBase {
    constructor() {
        super(...arguments);
        this.type = MermaidFlowchartViewId;
    }
    render() {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            const title = this.config.get("title");
            const rawDir = this.config.get("direction");
            let direction = "TD";
            if (typeof rawDir === "string") {
                const d = rawDir.trim().toUpperCase();
                if (["TD", "LR", "RL", "BT"].includes(d)) {
                    direction = d;
                }
            }
            const nodeLabelContent = this.config.get("nodeLabelContent");
            const showPropertyNames = this.config.get('showPropertyNames');
            const md = this.app.metadataCache;
            // 1) Collect nodes (notes) and edges (links + backlinks)
            const fileToNodeId = new Map(); // path -> id
            const nodeIdToLabel = new Map(); // id -> label
            // NEW: track which node IDs belong to which Bases group (by index),
            // and a flat set of all grouped node IDs for quick lookup.
            const groupIndexToNodeIds = new Map();
            const groupedNodeIds = new Set();
            // Keep a mapping from frontmatter key -> display name as defined in the Base
            const notePropDisplayByKey = new Map();
            const ensureNode = (file) => {
                let id = fileToNodeId.get(file.path);
                if (id)
                    return id;
                id = `n${fileToNodeId.size}`;
                fileToNodeId.set(file.path, id);
                let label = "";
                if (nodeLabelContent == "named-links") {
                    label = file.basename;
                }
                else {
                    label = this.getLabelWithProperties(file, showPropertyNames, "<br>", ":");
                }
                nodeIdToLabel.set(id, label);
                return id;
            };
            // Map of "from||label||to" -> Edge, to dedupe nicely
            const edges = new Map();
            const makeEdgeKey = (edge) => {
                var _a;
                // label can be undefined; treat that as empty string in the key
                return `${edge.from}||${(_a = edge.label) !== null && _a !== void 0 ? _a : ""}||${edge.to}`;
            };
            const escapeEdgeLabel = (label) => label
                .replace(/\|/g, "\\|") // don't break the |label| syntax
                .replace(/\n/g, " "); // avoid newlines in labels
            const addEdge = (edge) => {
                const key = makeEdgeKey(edge);
                if (!edges.has(key)) {
                    edges.set(key, edge);
                }
            };
            const formatEdgeForMermaid = (edge) => {
                if (edge.label && edge.label.trim().length > 0) {
                    const safeLabel = escapeEdgeLabel(edge.label);
                    return `${edge.from}-->|${safeLabel}|${edge.to}`;
                }
                return `${edge.from}-->${edge.to}`;
            };
            // ---- Collect nodes + edges from Base entries ------------------------
            const groups = this.data.groupedData;
            for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                const group = groups[groupIndex];
                let nodeSet = groupIndexToNodeIds.get(groupIndex);
                if (!nodeSet) {
                    nodeSet = new Set();
                    groupIndexToNodeIds.set(groupIndex, nodeSet);
                }
                for (const entry of group.entries) {
                    if (!entry.file)
                        continue;
                    const srcId = ensureNode(entry.file);
                    if (!srcId)
                        return;
                    // mark membership in this group
                    nodeSet.add(srcId);
                    groupedNodeIds.add(srcId);
                    const cache = md.getFileCache(entry.file);
                    // 1) Outgoing "mermaidCode" links (standard links in the note content)
                    const links = (_a = cache === null || cache === void 0 ? void 0 : cache.links) !== null && _a !== void 0 ? _a : [];
                    for (const link of links) {
                        const target = md.getFirstLinkpathDest(link.link, entry.file.path);
                        if (!target)
                            continue;
                        const tgtId = ensureNode(target);
                        if (!tgtId)
                            return;
                        addEdge({ from: srcId, to: tgtId });
                    }
                    // 2) Links from frontmatter properties (used by Bases)
                    const fmLinks = (_b = cache === null || cache === void 0 ? void 0 : cache.frontmatterLinks) !== null && _b !== void 0 ? _b : [];
                    for (const fm of fmLinks) {
                        const target = md.getFirstLinkpathDest(fm.link, entry.file.path);
                        if (!target)
                            continue;
                        const tgtId = ensureNode(target);
                        if (!tgtId)
                            return;
                        const frontmatterKey = fm.key;
                        const label = (_c = notePropDisplayByKey.get(frontmatterKey)) !== null && _c !== void 0 ? _c : frontmatterKey;
                        addEdge({
                            from: srcId,
                            to: tgtId,
                            label: label,
                        });
                    }
                }
            }
            if (fileToNodeId.size === 0) {
                this.containerEl.createDiv({
                    text: "No notes found for this base to build a flowchart from.",
                });
                return;
            }
            // Helper: does this Base actually have grouping configured?
            // Per API: if there is *no* groupBy, groupedData is a single group
            // with an empty (null) key.
            const hasGroupingConfigured = Array.isArray(groups) &&
                !(groups.length === 1 &&
                    typeof groups[0].hasKey === "function" &&
                    !groups[0].hasKey());
            // Helper: get a label for a group (uses group.key when present)
            const getGroupLabel = (group, index) => {
                var _a, _b;
                try {
                    if (typeof group.hasKey === "function" && group.hasKey()) {
                        const keyVal = group.key;
                        const str = (_b = (_a = keyVal === null || keyVal === void 0 ? void 0 : keyVal.toString) === null || _a === void 0 ? void 0 : _a.call(keyVal)) !== null && _b !== void 0 ? _b : "";
                        if (str && str.trim().length > 0) {
                            return str;
                        }
                    }
                }
                catch (e) {
                    // fall through to defaults
                }
                // If grouping is configured but the key is missing for this group,
                // treat it as "No value".
                return hasGroupingConfigured ? `No value (${index + 1})` : `Group ${index + 1}`;
            };
            // 2) Build mermaid flowchart mermaidCode
            const lines = [];
            lines.push(`flowchart ${direction}`);
            if (title)
                lines.push(`    %% ${title}`);
            // --- Node definitions (with optional subgraphs for Bases groups) -----
            if (hasGroupingConfigured) {
                // 2a) Define grouped nodes inside subgraphs
                for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                    const group = groups[groupIndex];
                    const nodeSet = groupIndexToNodeIds.get(groupIndex);
                    if (!nodeSet || nodeSet.size === 0)
                        continue;
                    const groupLabel = getGroupLabel(group, groupIndex);
                    const safeGroupLabel = String(groupLabel).replace(/"/g, '\\"');
                    const groupId = `g${groupIndex}`;
                    // subgraph id["label"]
                    lines.push(`    subgraph ${groupId}["${safeGroupLabel}"]`);
                    for (const nodeId of nodeSet) {
                        const label = (_d = nodeIdToLabel.get(nodeId)) !== null && _d !== void 0 ? _d : nodeId;
                        const safeLabel = label.replace(/"/g, '\\"');
                        lines.push(`        ${nodeId}["${safeLabel}"]`);
                    }
                    lines.push("    end");
                }
                // 2b) Define any remaining nodes (e.g. external link targets)
                // at the top level, outside any subgraph.
                for (const [path, id] of fileToNodeId.entries()) {
                    if (groupedNodeIds.has(id))
                        continue; // already defined in a subgraph
                    const label = (_e = nodeIdToLabel.get(id)) !== null && _e !== void 0 ? _e : path;
                    const safeLabel = label.replace(/"/g, '\\"');
                    lines.push(`    ${id}["${safeLabel}"]`);
                }
            }
            else {
                // No grouping configured: fall back to flat node list
                for (const [path, id] of fileToNodeId.entries()) {
                    const label = (_f = nodeIdToLabel.get(id)) !== null && _f !== void 0 ? _f : path;
                    const safeLabel = label.replace(/"/g, '\\"');
                    lines.push(`    ${id}["${safeLabel}"]`);
                }
            }
            // --- Edges -----------------------------------------------------------
            for (const edge of edges.values()) {
                lines.push(`    ${formatEdgeForMermaid(edge)}`);
            }
            // Make all nodes clickable internal links
            if (nodeLabelContent == "named-links") {
                const allIds = Array.from(fileToNodeId.values());
                if (allIds.length > 0) {
                    lines.push(`    class ${allIds.join(",")} internal-link;`);
                }
            }
            const mermaidCode = lines.join("\n");
            yield this.renderMermaid(mermaidCode);
        });
    }
}
MermaidFlowchartBaseView.RegistrationData = {
    id: MermaidFlowchartViewId,
    name: 'Flowchart',
    icon: 'git-fork',
    options: [
        {
            type: 'text',
            displayName: 'Flowchart title (optional)',
            key: 'title',
            default: 'Title',
        },
        {
            type: 'text',
            displayName: 'Direction (TD, LR, RL, BT)',
            key: 'direction',
            default: 'TD',
        },
        {
            type: 'dropdown',
            displayName: 'Node Label Content',
            key: 'nodeLabelContent',
            default: 'named-links',
            options: { "named-links": "Note Names (Linked)", "properties": "Selected Properties" },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZEZsb3djaGFydEJhc2VWaWV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTWVybWFpZEZsb3djaGFydEJhc2VWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl6RCxNQUFNLE9BQU8sd0JBQXlCLFNBQVEsbUJBQW1CO0lBQWpFOztRQUNVLFNBQUksR0FBRyxzQkFBc0IsQ0FBQztJQWlTeEMsQ0FBQztJQXhQZ0IsTUFBTTs7O1lBQ3JCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXZDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzVDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztZQUNyQixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUN6QyxTQUFTLEdBQUcsQ0FBQyxDQUFDO2lCQUNkO2FBQ0Q7WUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDN0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBWSxDQUFDO1lBRTFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDO1lBRWxDLHlE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QVcsRUFBRSwyQkFBMkI7WUFDeEMsR0FBRyxFQUFFLGVBQWU7WUFDcEIsV0FBVyxFQUFFLGlDQUFpQztTQUM5QztLQUNEO0NBQ0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TWVybWFpZEJhc2VWaWV3QmFzZX0gZnJvbSBcIi4vTWVybWFpZEJhc2VWaWV3QmFzZVwiO1xuaW1wb3J0IHtNZXJtYWlkRmxvd2NoYXJ0Vmlld0lkfSBmcm9tIFwiLi4vY29yZS9jb25zdGFudHNcIjtcbmltcG9ydCB7TWVybWFpZFZpZXdSZWdpc3RyYXRpb25EYXRhfSBmcm9tIFwiLi4vY29yZS9NZXJtYWlkVmlld1JlZ2lzdHJhdGlvbkRhdGFcIjtcbmltcG9ydCB7VEZpbGV9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgTWVybWFpZEZsb3djaGFydEJhc2VWaWV3IGV4dGVuZHMgTWVybWFpZEJhc2VWaWV3QmFzZSB7XG5cdHJlYWRvbmx5IHR5cGUgPSBNZXJtYWlkRmxvd2NoYXJ0Vmlld0lkO1xuXG5cdHN0YXRpYyByZWFkb25seSBSZWdpc3RyYXRpb25EYXRhOiBNZXJtYWlkVmlld1JlZ2lzdHJhdGlvbkRhdGEgPSB7XG5cdFx0aWQ6IE1lcm1haWRGbG93Y2hhcnRWaWV3SWQsXG5cdFx0bmFtZTogJ0Zsb3djaGFydCcsXG5cdFx0aWNvbjogJ2dpdC1mb3JrJywvL3dheXBvaW50cy8vd29ya2Zsb3cvL3NoYXJlLTJcblx0XHRvcHRpb25zOiBbXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdGbG93Y2hhcnQgdGl0bGUgKG9wdGlvbmFsKScsXG5cdFx0XHRcdGtleTogJ3RpdGxlJyxcblx0XHRcdFx0ZGVmYXVsdDogJ1RpdGxlJyxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdFx0ZGlzcGxheU5hbWU6ICdEaXJlY3Rpb24gKFRELCBMUiwgUkwsIEJUKScsXG5cdFx0XHRcdGtleTogJ2RpcmVjdGlvbicsXG5cdFx0XHRcdGRlZmF1bHQ6ICdURCcsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAnZHJvcGRvd24nLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ05vZGUgTGFiZWwgQ29udGVudCcsXG5cdFx0XHRcdGtleTogJ25vZGVMYWJlbENvbnRlbnQnLFxuXHRcdFx0XHRkZWZhdWx0OiAnbmFtZWQtbGlua3MnLFxuXHRcdFx0XHRvcHRpb25zOiB7XCJuYW1lZC1saW5rc1wiOiBcIk5vdGUgTmFtZXMgKExpbmtlZClcIiwgXCJwcm9wZXJ0aWVzXCI6IFwiU2VsZWN0ZWQgUHJvcGVydGllc1wifSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHR5cGU6ICd0b2dnbGUnLFxuXHRcdFx0XHRkaXNwbGF5TmFtZTogJ1Nob3cgcHJvcGVydHkgbmFtZXMnLFxuXHRcdFx0XHRrZXk6ICdzaG93UHJvcGVydHlOYW1lcycsXG5cdFx0XHRcdGRlZmF1bHQ6IHRydWUsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdGRpc3BsYXlOYW1lOiAnTWVybWFpZCBjb25maWcgKG9wdGlvbmFsKScsXG5cdFx0XHRcdGtleTogJ21lcm1haWRDb25maWcnLFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogYCUle2luaXQ6IHsgJ3RoZW1lJzogJ2RhcmsnIH19JSVgLFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9O1xuXG5cdHByb3RlY3RlZCBhc3luYyByZW5kZXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdGl0bGUgPSB0aGlzLmNvbmZpZy5nZXQoXCJ0aXRsZVwiKTtcblxuXHRcdGNvbnN0IHJhd0RpciA9IHRoaXMuY29uZmlnLmdldChcImRpcmVjdGlvblwiKTtcblx0XHRsZXQgZGlyZWN0aW9uID0gXCJURFwiO1xuXHRcdGlmICh0eXBlb2YgcmF3RGlyID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRjb25zdCBkID0gcmF3RGlyLnRyaW0oKS50b1VwcGVyQ2FzZSgpO1xuXHRcdFx0aWYgKFtcIlREXCIsIFwiTFJcIiwgXCJSTFwiLCBcIkJUXCJdLmluY2x1ZGVzKGQpKSB7XG5cdFx0XHRcdGRpcmVjdGlvbiA9IGQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3Qgbm9kZUxhYmVsQ29udGVudCA9IHRoaXMuY29uZmlnLmdldChcIm5vZGVMYWJlbENvbnRlbnRcIik7XG5cdFx0Y29uc3Qgc2hvd1Byb3BlcnR5TmFtZXMgPSB0aGlzLmNvbmZpZy5nZXQoJ3Nob3dQcm9wZXJ0eU5hbWVzJykgYXMgQm9vbGVhbjtcblxuXHRcdGNvbnN0IG1kID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZTtcblxuXHRcdC8vIDEpIENvbGxlY3Qgbm9kZXMgKG5vdGVzKSBhbmQgZWRnZXMgKGxpbmtzICsgYmFja2xpbmtzKVxuXHRcdGNvbnN0IGZpbGVUb05vZGVJZCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7IC8vIHBhdGggLT4gaWRcblx0XHRjb25zdCBub2RlSWRUb0xhYmVsID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTsgLy8gaWQgLT4gbGFiZWxcblxuXHRcdC8vIE5FVzogdHJhY2sgd2hpY2ggbm9kZSBJRHMgYmVsb25nIHRvIHdoaWNoIEJhc2VzIGdyb3VwIChieSBpbmRleCksXG5cdFx0Ly8gYW5kIGEgZmxhdCBzZXQgb2YgYWxsIGdyb3VwZWQgbm9kZSBJRHMgZm9yIHF1aWNrIGxvb2t1cC5cblx0XHRjb25zdCBncm91cEluZGV4VG9Ob2RlSWRzID0gbmV3IE1hcDxudW1iZXIsIFNldDxzdHJpbmc+PigpO1xuXHRcdGNvbnN0IGdyb3VwZWROb2RlSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cblx0XHQvLyBLZWVwIGEgbWFwcGluZyBmcm9tIGZyb250bWF0dGVyIGtleSAtPiBkaXNwbGF5IG5hbWUgYXMgZGVmaW5lZCBpbiB0aGUgQmFzZVxuXHRcdGNvbnN0IG5vdGVQcm9wRGlzcGxheUJ5S2V5ID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuXHRcdGNvbnN0IGVuc3VyZU5vZGUgPSAoZmlsZTogVEZpbGUpOiBzdHJpbmcgPT4ge1xuXHRcdFx0bGV0IGlkID0gZmlsZVRvTm9kZUlkLmdldChmaWxlLnBhdGgpO1xuXHRcdFx0aWYgKGlkKSByZXR1cm4gaWQ7XG5cblx0XHRcdGlkID0gYG4ke2ZpbGVUb05vZGVJZC5zaXplfWA7XG5cdFx0XHRmaWxlVG9Ob2RlSWQuc2V0KGZpbGUucGF0aCwgaWQpO1xuXG5cdFx0XHRsZXQgbGFiZWw6IHN0cmluZyA9IFwiXCI7XG5cdFx0XHRpZiAobm9kZUxhYmVsQ29udGVudCA9PSBcIm5hbWVkLWxpbmtzXCIpIHtcblx0XHRcdFx0bGFiZWwgPSBmaWxlLmJhc2VuYW1lO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGFiZWwgPSB0aGlzLmdldExhYmVsV2l0aFByb3BlcnRpZXMoZmlsZSwgc2hvd1Byb3BlcnR5TmFtZXMsIFwiPGJyPlwiLCBcIjpcIik7XG5cdFx0XHR9XG5cblx0XHRcdG5vZGVJZFRvTGFiZWwuc2V0KGlkLCBsYWJlbCk7XG5cdFx0XHRyZXR1cm4gaWQ7XG5cdFx0fTtcblxuXHRcdC8vIC0tLS0gRWRnZSBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdHR5cGUgRWRnZSA9IHtcblx0XHRcdGZyb206IHN0cmluZztcblx0XHRcdHRvOiBzdHJpbmc7XG5cdFx0XHRsYWJlbD86IHN0cmluZzsgLy8gc2hvd24gb24gdGhlIG1lcm1haWQgbGluZVxuXHRcdH07XG5cblx0XHQvLyBNYXAgb2YgXCJmcm9tfHxsYWJlbHx8dG9cIiAtPiBFZGdlLCB0byBkZWR1cGUgbmljZWx5XG5cdFx0Y29uc3QgZWRnZXMgPSBuZXcgTWFwPHN0cmluZywgRWRnZT4oKTtcblxuXHRcdGNvbnN0IG1ha2VFZGdlS2V5ID0gKGVkZ2U6IEVkZ2UpOiBzdHJpbmcgPT4ge1xuXHRcdFx0Ly8gbGFiZWwgY2FuIGJlIHVuZGVmaW5lZDsgdHJlYXQgdGhhdCBhcyBlbXB0eSBzdHJpbmcgaW4gdGhlIGtleVxuXHRcdFx0cmV0dXJuIGAke2VkZ2UuZnJvbX18fCR7ZWRnZS5sYWJlbCA/PyBcIlwifXx8JHtlZGdlLnRvfWA7XG5cdFx0fTtcblxuXHRcdGNvbnN0IGVzY2FwZUVkZ2VMYWJlbCA9IChsYWJlbDogc3RyaW5nKTogc3RyaW5nID0+XG5cdFx0XHRsYWJlbFxuXHRcdFx0XHQucmVwbGFjZSgvXFx8L2csIFwiXFxcXHxcIikgLy8gZG9uJ3QgYnJlYWsgdGhlIHxsYWJlbHwgc3ludGF4XG5cdFx0XHRcdC5yZXBsYWNlKC9cXG4vZywgXCIgXCIpOyAvLyBhdm9pZCBuZXdsaW5lcyBpbiBsYWJlbHNcblxuXHRcdGNvbnN0IGFkZEVkZ2UgPSAoZWRnZTogRWRnZSk6IHZvaWQgPT4ge1xuXHRcdFx0Y29uc3Qga2V5ID0gbWFrZUVkZ2VLZXkoZWRnZSk7XG5cdFx0XHRpZiAoIWVkZ2VzLmhhcyhrZXkpKSB7XG5cdFx0XHRcdGVkZ2VzLnNldChrZXksIGVkZ2UpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBmb3JtYXRFZGdlRm9yTWVybWFpZCA9IChlZGdlOiBFZGdlKTogc3RyaW5nID0+IHtcblx0XHRcdGlmIChlZGdlLmxhYmVsICYmIGVkZ2UubGFiZWwudHJpbSgpLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Y29uc3Qgc2FmZUxhYmVsID0gZXNjYXBlRWRnZUxhYmVsKGVkZ2UubGFiZWwpO1xuXHRcdFx0XHRyZXR1cm4gYCR7ZWRnZS5mcm9tfS0tPnwke3NhZmVMYWJlbH18JHtlZGdlLnRvfWA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYCR7ZWRnZS5mcm9tfS0tPiR7ZWRnZS50b31gO1xuXHRcdH07XG5cblx0XHQvLyAtLS0tIENvbGxlY3Qgbm9kZXMgKyBlZGdlcyBmcm9tIEJhc2UgZW50cmllcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRcdGNvbnN0IGdyb3VwcyA9IHRoaXMuZGF0YS5ncm91cGVkRGF0YTtcblxuXHRcdGZvciAobGV0IGdyb3VwSW5kZXggPSAwOyBncm91cEluZGV4IDwgZ3JvdXBzLmxlbmd0aDsgZ3JvdXBJbmRleCsrKSB7XG5cdFx0XHRjb25zdCBncm91cCA9IGdyb3Vwc1tncm91cEluZGV4XTtcblx0XHRcdGxldCBub2RlU2V0ID0gZ3JvdXBJbmRleFRvTm9kZUlkcy5nZXQoZ3JvdXBJbmRleCk7XG5cdFx0XHRpZiAoIW5vZGVTZXQpIHtcblx0XHRcdFx0bm9kZVNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXHRcdFx0XHRncm91cEluZGV4VG9Ob2RlSWRzLnNldChncm91cEluZGV4LCBub2RlU2V0KTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiBncm91cC5lbnRyaWVzKSB7XG5cdFx0XHRcdGlmICghZW50cnkuZmlsZSkgY29udGludWU7XG5cblx0XHRcdFx0Y29uc3Qgc3JjSWQgPSBlbnN1cmVOb2RlKGVudHJ5LmZpbGUpO1xuXHRcdFx0XHRpZiAoIXNyY0lkKSByZXR1cm47XG5cblx0XHRcdFx0Ly8gbWFyayBtZW1iZXJzaGlwIGluIHRoaXMgZ3JvdXBcblx0XHRcdFx0bm9kZVNldC5hZGQoc3JjSWQpO1xuXHRcdFx0XHRncm91cGVkTm9kZUlkcy5hZGQoc3JjSWQpO1xuXG5cdFx0XHRcdGNvbnN0IGNhY2hlID0gbWQuZ2V0RmlsZUNhY2hlKGVudHJ5LmZpbGUpO1xuXG5cdFx0XHRcdC8vIDEpIE91dGdvaW5nIFwibWVybWFpZENvZGVcIiBsaW5rcyAoc3RhbmRhcmQgbGlua3MgaW4gdGhlIG5vdGUgY29udGVudClcblx0XHRcdFx0Y29uc3QgbGlua3MgPSBjYWNoZT8ubGlua3MgPz8gW107XG5cdFx0XHRcdGZvciAoY29uc3QgbGluayBvZiBsaW5rcykge1xuXHRcdFx0XHRcdGNvbnN0IHRhcmdldCA9IG1kLmdldEZpcnN0TGlua3BhdGhEZXN0KFxuXHRcdFx0XHRcdFx0bGluay5saW5rLFxuXHRcdFx0XHRcdFx0ZW50cnkuZmlsZS5wYXRoLFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0aWYgKCF0YXJnZXQpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdFx0Y29uc3QgdGd0SWQgPSBlbnN1cmVOb2RlKHRhcmdldCk7XG5cdFx0XHRcdFx0aWYgKCF0Z3RJZCkgcmV0dXJuO1xuXG5cdFx0XHRcdFx0YWRkRWRnZSh7ZnJvbTogc3JjSWQsIHRvOiB0Z3RJZH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gMikgTGlua3MgZnJvbSBmcm9udG1hdHRlciBwcm9wZXJ0aWVzICh1c2VkIGJ5IEJhc2VzKVxuXHRcdFx0XHRjb25zdCBmbUxpbmtzID0gKGNhY2hlIGFzIGFueSk/LmZyb250bWF0dGVyTGlua3MgPz8gW107XG5cdFx0XHRcdGZvciAoY29uc3QgZm0gb2YgZm1MaW5rcykge1xuXHRcdFx0XHRcdGNvbnN0IHRhcmdldCA9IG1kLmdldEZpcnN0TGlua3BhdGhEZXN0KFxuXHRcdFx0XHRcdFx0Zm0ubGluayxcblx0XHRcdFx0XHRcdGVudHJ5LmZpbGUucGF0aCxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGlmICghdGFyZ2V0KSBjb250aW51ZTtcblxuXHRcdFx0XHRcdGNvbnN0IHRndElkID0gZW5zdXJlTm9kZSh0YXJnZXQpO1xuXHRcdFx0XHRcdGlmICghdGd0SWQpIHJldHVybjtcblxuXHRcdFx0XHRcdGNvbnN0IGZyb250bWF0dGVyS2V5OiBzdHJpbmcgPSBmbS5rZXk7XG5cdFx0XHRcdFx0Y29uc3QgbGFiZWwgPVxuXHRcdFx0XHRcdFx0bm90ZVByb3BEaXNwbGF5QnlLZXkuZ2V0KGZyb250bWF0dGVyS2V5KSA/P1xuXHRcdFx0XHRcdFx0ZnJvbnRtYXR0ZXJLZXk7XG5cblx0XHRcdFx0XHRhZGRFZGdlKHtcblx0XHRcdFx0XHRcdGZyb206IHNyY0lkLFxuXHRcdFx0XHRcdFx0dG86IHRndElkLFxuXHRcdFx0XHRcdFx0bGFiZWw6IGxhYmVsLFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVUb05vZGVJZC5zaXplID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdHRleHQ6IFwiTm8gbm90ZXMgZm91bmQgZm9yIHRoaXMgYmFzZSB0byBidWlsZCBhIGZsb3djaGFydCBmcm9tLlwiLFxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gSGVscGVyOiBkb2VzIHRoaXMgQmFzZSBhY3R1YWxseSBoYXZlIGdyb3VwaW5nIGNvbmZpZ3VyZWQ/XG5cdFx0Ly8gUGVyIEFQSTogaWYgdGhlcmUgaXMgKm5vKiBncm91cEJ5LCBncm91cGVkRGF0YSBpcyBhIHNpbmdsZSBncm91cFxuXHRcdC8vIHdpdGggYW4gZW1wdHkgKG51bGwpIGtleS5cblx0XHRjb25zdCBoYXNHcm91cGluZ0NvbmZpZ3VyZWQgPVxuXHRcdFx0QXJyYXkuaXNBcnJheShncm91cHMpICYmXG5cdFx0XHQhKFxuXHRcdFx0XHRncm91cHMubGVuZ3RoID09PSAxICYmXG5cdFx0XHRcdHR5cGVvZiAoZ3JvdXBzWzBdIGFzIGFueSkuaGFzS2V5ID09PSBcImZ1bmN0aW9uXCIgJiZcblx0XHRcdFx0IShncm91cHNbMF0gYXMgYW55KS5oYXNLZXkoKVxuXHRcdFx0KTtcblxuXHRcdC8vIEhlbHBlcjogZ2V0IGEgbGFiZWwgZm9yIGEgZ3JvdXAgKHVzZXMgZ3JvdXAua2V5IHdoZW4gcHJlc2VudClcblx0XHRjb25zdCBnZXRHcm91cExhYmVsID0gKGdyb3VwOiBhbnksIGluZGV4OiBudW1iZXIpOiBzdHJpbmcgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aWYgKHR5cGVvZiBncm91cC5oYXNLZXkgPT09IFwiZnVuY3Rpb25cIiAmJiBncm91cC5oYXNLZXkoKSkge1xuXHRcdFx0XHRcdGNvbnN0IGtleVZhbCA9IGdyb3VwLmtleTtcblx0XHRcdFx0XHRjb25zdCBzdHIgPSBrZXlWYWw/LnRvU3RyaW5nPy4oKSA/PyBcIlwiO1xuXHRcdFx0XHRcdGlmIChzdHIgJiYgc3RyLnRyaW0oKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gc3RyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyBmYWxsIHRocm91Z2ggdG8gZGVmYXVsdHNcblx0XHRcdH1cblx0XHRcdC8vIElmIGdyb3VwaW5nIGlzIGNvbmZpZ3VyZWQgYnV0IHRoZSBrZXkgaXMgbWlzc2luZyBmb3IgdGhpcyBncm91cCxcblx0XHRcdC8vIHRyZWF0IGl0IGFzIFwiTm8gdmFsdWVcIi5cblx0XHRcdHJldHVybiBoYXNHcm91cGluZ0NvbmZpZ3VyZWQgPyBgTm8gdmFsdWUgKCR7aW5kZXggKyAxfSlgIDogYEdyb3VwICR7aW5kZXggKyAxfWA7XG5cdFx0fTtcblxuXHRcdC8vIDIpIEJ1aWxkIG1lcm1haWQgZmxvd2NoYXJ0IG1lcm1haWRDb2RlXG5cdFx0Y29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG5cdFx0bGluZXMucHVzaChgZmxvd2NoYXJ0ICR7ZGlyZWN0aW9ufWApO1xuXHRcdGlmICh0aXRsZSkgbGluZXMucHVzaChgICAgICUlICR7dGl0bGV9YCk7XG5cblx0XHQvLyAtLS0gTm9kZSBkZWZpbml0aW9ucyAod2l0aCBvcHRpb25hbCBzdWJncmFwaHMgZm9yIEJhc2VzIGdyb3VwcykgLS0tLS1cblxuXHRcdGlmIChoYXNHcm91cGluZ0NvbmZpZ3VyZWQpIHtcblx0XHRcdC8vIDJhKSBEZWZpbmUgZ3JvdXBlZCBub2RlcyBpbnNpZGUgc3ViZ3JhcGhzXG5cdFx0XHRmb3IgKGxldCBncm91cEluZGV4ID0gMDsgZ3JvdXBJbmRleCA8IGdyb3Vwcy5sZW5ndGg7IGdyb3VwSW5kZXgrKykge1xuXHRcdFx0XHRjb25zdCBncm91cCA9IGdyb3Vwc1tncm91cEluZGV4XTtcblx0XHRcdFx0Y29uc3Qgbm9kZVNldCA9IGdyb3VwSW5kZXhUb05vZGVJZHMuZ2V0KGdyb3VwSW5kZXgpO1xuXHRcdFx0XHRpZiAoIW5vZGVTZXQgfHwgbm9kZVNldC5zaXplID09PSAwKSBjb250aW51ZTtcblxuXHRcdFx0XHRjb25zdCBncm91cExhYmVsID0gZ2V0R3JvdXBMYWJlbChncm91cCwgZ3JvdXBJbmRleCk7XG5cdFx0XHRcdGNvbnN0IHNhZmVHcm91cExhYmVsID0gU3RyaW5nKGdyb3VwTGFiZWwpLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcblx0XHRcdFx0Y29uc3QgZ3JvdXBJZCA9IGBnJHtncm91cEluZGV4fWA7XG5cblx0XHRcdFx0Ly8gc3ViZ3JhcGggaWRbXCJsYWJlbFwiXVxuXHRcdFx0XHRsaW5lcy5wdXNoKGAgICAgc3ViZ3JhcGggJHtncm91cElkfVtcIiR7c2FmZUdyb3VwTGFiZWx9XCJdYCk7XG5cblx0XHRcdFx0Zm9yIChjb25zdCBub2RlSWQgb2Ygbm9kZVNldCkge1xuXHRcdFx0XHRcdGNvbnN0IGxhYmVsID0gbm9kZUlkVG9MYWJlbC5nZXQobm9kZUlkKSA/PyBub2RlSWQ7XG5cdFx0XHRcdFx0Y29uc3Qgc2FmZUxhYmVsID0gbGFiZWwucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpO1xuXHRcdFx0XHRcdGxpbmVzLnB1c2goYCAgICAgICAgJHtub2RlSWR9W1wiJHtzYWZlTGFiZWx9XCJdYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsaW5lcy5wdXNoKFwiICAgIGVuZFwiKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gMmIpIERlZmluZSBhbnkgcmVtYWluaW5nIG5vZGVzIChlLmcuIGV4dGVybmFsIGxpbmsgdGFyZ2V0cylcblx0XHRcdC8vIGF0IHRoZSB0b3AgbGV2ZWwsIG91dHNpZGUgYW55IHN1YmdyYXBoLlxuXHRcdFx0Zm9yIChjb25zdCBbcGF0aCwgaWRdIG9mIGZpbGVUb05vZGVJZC5lbnRyaWVzKCkpIHtcblx0XHRcdFx0aWYgKGdyb3VwZWROb2RlSWRzLmhhcyhpZCkpIGNvbnRpbnVlOyAvLyBhbHJlYWR5IGRlZmluZWQgaW4gYSBzdWJncmFwaFxuXG5cdFx0XHRcdGNvbnN0IGxhYmVsID0gbm9kZUlkVG9MYWJlbC5nZXQoaWQpID8/IHBhdGg7XG5cdFx0XHRcdGNvbnN0IHNhZmVMYWJlbCA9IGxhYmVsLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcblx0XHRcdFx0bGluZXMucHVzaChgICAgICR7aWR9W1wiJHtzYWZlTGFiZWx9XCJdYCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIE5vIGdyb3VwaW5nIGNvbmZpZ3VyZWQ6IGZhbGwgYmFjayB0byBmbGF0IG5vZGUgbGlzdFxuXHRcdFx0Zm9yIChjb25zdCBbcGF0aCwgaWRdIG9mIGZpbGVUb05vZGVJZC5lbnRyaWVzKCkpIHtcblx0XHRcdFx0Y29uc3QgbGFiZWwgPSBub2RlSWRUb0xhYmVsLmdldChpZCkgPz8gcGF0aDtcblx0XHRcdFx0Y29uc3Qgc2FmZUxhYmVsID0gbGFiZWwucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpO1xuXHRcdFx0XHRsaW5lcy5wdXNoKGAgICAgJHtpZH1bXCIke3NhZmVMYWJlbH1cIl1gKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyAtLS0gRWRnZXMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMudmFsdWVzKCkpIHtcblx0XHRcdGxpbmVzLnB1c2goYCAgICAke2Zvcm1hdEVkZ2VGb3JNZXJtYWlkKGVkZ2UpfWApO1xuXHRcdH1cblxuXHRcdC8vIE1ha2UgYWxsIG5vZGVzIGNsaWNrYWJsZSBpbnRlcm5hbCBsaW5rc1xuXHRcdGlmIChub2RlTGFiZWxDb250ZW50ID09IFwibmFtZWQtbGlua3NcIikge1xuXHRcdFx0Y29uc3QgYWxsSWRzID0gQXJyYXkuZnJvbShmaWxlVG9Ob2RlSWQudmFsdWVzKCkpO1xuXHRcdFx0aWYgKGFsbElkcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGxpbmVzLnB1c2goYCAgICBjbGFzcyAke2FsbElkcy5qb2luKFwiLFwiKX0gaW50ZXJuYWwtbGluaztgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBtZXJtYWlkQ29kZSA9IGxpbmVzLmpvaW4oXCJcXG5cIik7XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJNZXJtYWlkKG1lcm1haWRDb2RlKTtcblx0fVxufVxuIl19