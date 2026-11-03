import {type Component} from "obsidian";

export function registerRenderObservers(component: Component, container: HTMLElement, render: () => void): void {
	const mutationObserver = new MutationObserver(render);
	const resizeObserver = new ResizeObserver(render);
	mutationObserver.observe(container, {childList: true, subtree: true});
	resizeObserver.observe(container);
	component.register(() => mutationObserver.disconnect());
	component.register(() => resizeObserver.disconnect());
}
