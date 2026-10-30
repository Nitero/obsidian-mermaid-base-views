import {BasesView, type BasesEntryGroup, type QueryController} from "obsidian";
import {type TreeViewBranch} from "./tree-view-tree";

type FoldingController = QueryController & {
	getGroupFolds(): Set<string>;
	saveGroupFolds(): void;
};

type GroupFoldingView = typeof BasesView & {
	getGroupId(group: BasesEntryGroup): string | null;
};

export class TreeViewFoldState {
	private readonly controller: FoldingController;

	constructor(controller: QueryController) {
		this.controller = controller as FoldingController;
	}

	isCollapsed(branch: TreeViewBranch): boolean {
		return this.controller.getGroupFolds().has(this.getKey(branch));
	}

	toggle(branch: TreeViewBranch): void {
		const folds = this.controller.getGroupFolds();
		const key = this.getKey(branch);
		if (!folds.delete(key))
			folds.add(key);
		this.controller.saveGroupFolds();
	}

	private getKey(branch: TreeViewBranch): string {
		const key = branch.group ? (BasesView as GroupFoldingView).getGroupId(branch.group) : null;
		return key ?? `mermaid-tree:${branch.id}`;
	}
}
