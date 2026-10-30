import {getIcon, type Component} from "obsidian";
import {registerDiagramClick} from "../utils/diagram-click";
import {TREE_VIEW_FOLD_MARKER, type TreeViewBranchRow} from "../utils/tree-view-code";
import {type TreeViewBranch} from "../utils/tree-view-tree";

const FOLD_ICON_SIZE = 14;

export class TreeViewFolding {
	private rows: readonly TreeViewBranchRow[] = [];
	private readonly branches = new Map<string, TreeViewBranchRow>();
	private focusBranch: string | null = null;

	constructor(
		component: Component,
		private readonly container: HTMLElement,
		private readonly onToggle: (branch: TreeViewBranch) => void,
	) {
		registerDiagramClick(component, container, (event, target) => {
			const row = this.getRow(target) ?? this.getRowAtPosition(event, target);
			if (row && !event.defaultPrevented) {
				event.preventDefault();
				event.stopPropagation();
				this.toggle(row);
			}
		});
		component.registerDomEvent(container, "keydown", (event) => {
			const row = this.getRow(event.target);
			if (!row || event.isComposing || event.defaultPrevented)
				return;
			const activate = event.key === "Enter" || event.key === " ";
			const collapse = event.key === "ArrowLeft" && !row.collapsed;
			const expand = event.key === "ArrowRight" && row.collapsed;
			if (activate || collapse || expand) {
				event.preventDefault();
				event.stopPropagation();
				this.toggle(row);
			}
		});
	}

	setRows(rows: readonly TreeViewBranchRow[]): void {
		this.rows = rows;
		this.branches.clear();
		for (const row of rows)
			this.branches.set(row.branch.id, row);
	}

	render(): void {
		const nodes = this.container.querySelectorAll<SVGGElement>(".pele-tree-dir");
		if (nodes.length !== this.rows.length)
			return;
		nodes.forEach((node, index) => {
			const row = this.rows[index];
			if (!row)
				return;
			node.classList.add("bases-mermaid-tree-branch");
			node.classList.toggle("is-collapsed", row.collapsed);
			node.setAttribute("data-branch-id", row.branch.id);
			node.setAttribute("role", "button");
			node.setAttribute("tabindex", "0");
			node.setAttribute("aria-label", row.branch.label);
			node.setAttribute("aria-expanded", String(!row.collapsed));
			this.renderRowTarget(node);
			this.renderIndicator(node, row.collapsed);
			if (this.focusBranch === row.branch.id)
				node.focus({preventScroll: true});
		});
		this.focusBranch = null;
	}

	private getRow(target: EventTarget | null): TreeViewBranchRow | undefined {
		const element = target as Element | null;
		if (element?.nodeType !== 1)
			return undefined;
		const node = element.closest(".bases-mermaid-tree-branch[data-branch-id]");
		if (!node || !this.container.contains(node))
			return undefined;
		return this.branches.get(node.getAttribute("data-branch-id") ?? "");
	}

	private getRowAtPosition(event: MouseEvent, target: EventTarget | null): TreeViewBranchRow | undefined {
		const element = target as Element | null;
		if (element?.nodeType !== 1 || element.closest(".pele-tree-file, a, button, input, textarea, select"))
			return undefined;
		for (const row of Array.from(this.container.querySelectorAll<SVGRectElement>(".bases-mermaid-tree-row-target"))) {
			const bounds = row.getBoundingClientRect();
			if (event.clientY >= bounds.top && event.clientY <= bounds.bottom)
				return this.getRow(row);
		}
		return undefined;
	}

	private renderRowTarget(node: SVGGElement): void {
		const svg = node.ownerSVGElement;
		const boxes = Array.from(node.querySelectorAll<SVGTextElement>(".pele-label"), (label) => label.getBBox());
		if (!svg || boxes.length === 0 || boxes.every((box) => box.height === 0))
			return;
		const top = Math.min(...boxes.map((box) => box.y)) - 2;
		const bottom = Math.max(...boxes.map((box) => box.y + box.height)) + 2;
		let target = node.querySelector<SVGRectElement>(".bases-mermaid-tree-row-target");
		if (!target) {
			target = createSvg("rect", {attr: {fill: "transparent", "aria-hidden": "true"}});
			target.classList.add("bases-mermaid-tree-row-target");
			node.prepend(target);
		}
		target.setAttribute("x", String(svg.viewBox.baseVal.x));
		target.setAttribute("y", String(top));
		target.setAttribute("width", String(svg.viewBox.baseVal.width));
		target.setAttribute("height", String(bottom - top));
	}

	private toggle(row: TreeViewBranchRow): void {
		this.focusBranch = row.branch.id;
		this.onToggle(row.branch);
	}

	private renderIndicator(node: SVGGElement, collapsed: boolean): void {
		const marker = node.querySelector<SVGTSpanElement>(".bases-mermaid-tree-fold-placeholder")
			?? this.createMarker(node);
		if (!marker)
			return;
		const box = marker.getBBox();
		if (box.width === 0 || box.height === 0)
			return;
		let control = node.querySelector<SVGGElement>(".bases-mermaid-tree-fold-toggle");
		if (!control) {
			const icon = getIcon("chevron-right");
			if (!icon)
				return;
			control = createSvg("g", {attr: {"aria-hidden": "true"}});
			control.classList.add("bases-mermaid-tree-fold-toggle");
			icon.classList.remove("svg-icon");
			icon.setAttribute("width", String(FOLD_ICON_SIZE));
			icon.setAttribute("height", String(FOLD_ICON_SIZE));
			control.appendChild(createSvg("rect", {attr: {width: FOLD_ICON_SIZE, height: FOLD_ICON_SIZE, fill: "transparent"}}));
			control.appendChild(icon);
			node.appendChild(control);
		}
		control.setAttribute("transform", `translate(${box.x + (box.width - FOLD_ICON_SIZE) / 2}, ${box.y + (box.height - FOLD_ICON_SIZE) / 2})`);
		control.querySelector("svg")?.setAttribute("transform", collapsed ? "" : `rotate(90 ${FOLD_ICON_SIZE / 2} ${FOLD_ICON_SIZE / 2})`);
	}

	private createMarker(node: SVGGElement): SVGTSpanElement | null {
		const labels = Array.from(node.querySelectorAll(".pele-label")).reverse();
		for (const label of labels) {
			const walker = node.ownerDocument.createTreeWalker(label, NodeFilter.SHOW_TEXT);
			const textNodes: Text[] = [];
			while (walker.nextNode())
				textNodes.push(walker.currentNode as Text);
			for (const text of textNodes.reverse()) {
				const index = text.data.lastIndexOf(TREE_VIEW_FOLD_MARKER);
				if (index < 0)
					continue;
				const markerText = text.splitText(index);
				markerText.splitText(TREE_VIEW_FOLD_MARKER.length);
				const marker = createSvg("tspan", {attr: {"aria-hidden": "true", opacity: "0"}});
				marker.classList.add("bases-mermaid-tree-fold-placeholder");
				markerText.replaceWith(marker);
				marker.appendChild(markerText);
				return marker;
			}
		}
		return null;
	}
}
