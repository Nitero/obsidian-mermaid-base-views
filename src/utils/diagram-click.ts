import {type Component} from "obsidian";

export function registerDiagramClick(
	component: Component,
	container: HTMLElement,
	onClick: (event: MouseEvent, target: EventTarget | null) => void,
): void {
	let pointer: {id: number; target: EventTarget | null; x: number; y: number; distance: number} | undefined;
	const updatePointer = (event: PointerEvent): void => {
		if (!pointer || pointer.id !== event.pointerId)
			return;
		pointer.distance += Math.abs(event.clientX - pointer.x) + Math.abs(event.clientY - pointer.y);
		pointer.x = event.clientX;
		pointer.y = event.clientY;
	};
	component.registerDomEvent(container, "pointerdown", (event) => {
		if (!event.isPrimary || event.button !== 0) {
			pointer = undefined;
			return;
		}
		pointer = {id: event.pointerId, target: event.target, x: event.clientX, y: event.clientY, distance: 0};
	}, {capture: true});
	component.registerDomEvent(container, "pointermove", updatePointer, {capture: true});
	component.registerDomEvent(container, "pointerup", updatePointer, {capture: true});
	component.registerDomEvent(container, "pointercancel", () => {
		pointer = undefined;
	}, {capture: true});
	component.registerDomEvent(container, "click", (event) => {
		if (event.button !== 0)
			return;
		const gesture = pointer;
		pointer = undefined;
		if (event.detail !== 0 && gesture) {
			if (gesture.distance > 4)
				return;
			onClick(event, gesture.target);
		} else {
			onClick(event, event.target);
		}
	}, {capture: true});
}
