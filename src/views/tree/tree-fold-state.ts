import {BasesView, type BasesEntryGroup, type QueryController} from "obsidian";
import {type TreeViewBranch} from "./tree-hierarchy";

type FoldingController = QueryController & {
	getGroupFolds?(): Set<string>;
	saveGroupFolds?(): void;
};

type GroupFoldingView = typeof BasesView & {
	getGroupId?(group: BasesEntryGroup): string | null;
};

export class TreeViewFoldState {
	private readonly controller: FoldingController;
	private readonly fallbackFolds = new Set<string>();

	constructor(controller: QueryController) {
		this.controller = controller;
	}

	isCollapsed(branch: TreeViewBranch): boolean {
		return this.getFolds().has(this.getKey(branch));
	}

	toggle(branch: TreeViewBranch): void {
		const folds = this.getFolds();
		const key = this.getKey(branch);
		if (!folds.delete(key))
			folds.add(key);
		if (folds !== this.fallbackFolds)
			this.controller.saveGroupFolds?.();
	}

	private getFolds(): Set<string> {
		if (typeof this.controller.getGroupFolds !== "function" || typeof this.controller.saveGroupFolds !== "function")
			return this.fallbackFolds;
		return this.controller.getGroupFolds();
	}

	private getKey(branch: TreeViewBranch): string {
		const view = BasesView as GroupFoldingView;
		const key = branch.group && typeof view.getGroupId === "function" ? view.getGroupId(branch.group) : null;
		return key ?? `mermaid-tree:${branch.id}`;
	}
}
