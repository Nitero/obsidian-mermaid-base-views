import {type BasesEntry, type BasesEntryGroup, type TFolder} from "obsidian";

export interface TreeViewBranch {
	kind: "branch";
	id: string;
	label: string;
	group?: BasesEntryGroup;
	children: TreeViewNode[];
}

export interface TreeViewFile {
	kind: "file";
	entry: BasesEntry;
}

export type TreeViewNode = TreeViewBranch | TreeViewFile;

export function isWithinTreeRoot(entry: BasesEntry, root: TFolder): boolean {
	return root.isRoot() || entry.file.path.startsWith(`${root.path}/`);
}

export function buildFolderTree(entries: readonly BasesEntry[], root: TFolder, vaultName: string): TreeViewBranch {
	const tree: TreeViewBranch = {
		kind: "branch",
		id: `folder:${root.path}`,
		label: root.isRoot() ? vaultName : root.name,
		children: [],
	};
	const branches = new Map<string, TreeViewBranch>([[root.path, tree]]);
	for (const entry of entries) {
		if (!isWithinTreeRoot(entry, root))
			continue;
		const ancestors: TFolder[] = [];
		let folder = entry.file.parent;
		while (folder && folder.path !== root.path) {
			ancestors.push(folder);
			folder = folder.parent;
		}
		if (!folder)
			continue;
		let parent = tree;
		for (const ancestor of ancestors.reverse()) {
			let branch = branches.get(ancestor.path);
			if (!branch) {
				branch = {kind: "branch", id: `folder:${ancestor.path}`, label: ancestor.name, children: []};
				branches.set(ancestor.path, branch);
				parent.children.push(branch);
			}
			parent = branch;
		}
		parent.children.push({kind: "file", entry});
	}
	const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: "base"});
	for (const branch of branches.values()) {
		branch.children.sort((first, second) => {
			if (first.kind === "file")
				return second.kind === "file" ? 0 : 1;
			if (second.kind === "file")
				return -1;
			return collator.compare(first.label, second.label) || first.label.localeCompare(second.label);
		});
	}
	return tree;
}

export function buildGroupedTree(groups: readonly BasesEntryGroup[], root: TFolder): TreeViewBranch[] {
	const branches: TreeViewBranch[] = [];
	for (const group of groups) {
		const entries = group.entries.filter((entry) => isWithinTreeRoot(entry, root));
		if (entries.length === 0)
			continue;
		const label = group.hasKey() ? group.key?.toString() ?? "" : "";
		branches.push({
			kind: "branch",
			id: JSON.stringify(["group", group.key?.constructor.name ?? null, group.key?.toString() ?? null]),
			label: label.trim() ? label : "No value",
			group,
			children: entries.map((entry) => ({kind: "file", entry})),
		});
	}
	return branches;
}
