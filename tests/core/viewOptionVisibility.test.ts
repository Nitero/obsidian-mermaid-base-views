import {describe, expect, it} from "vitest";
import type {BasesViewConfig} from "obsidian";
import {shouldHideShowPropertyNames} from "../../src/core/viewOptionVisibility";
import {COMMON_VIEW_OPTIONS, NODE_LABEL_CONTENT_VALUES} from "../../src/core/constants";

const {namedLinks, properties} = NODE_LABEL_CONTENT_VALUES;
const key = COMMON_VIEW_OPTIONS.nodeLabelContent.key;

function configWith(values: Record<string, unknown>): BasesViewConfig {
	return {get: (key: string) => values[key]} as unknown as BasesViewConfig;
}

describe("shouldHideShowPropertyNames", () => {
	const shouldHide = shouldHideShowPropertyNames(properties);

	it("shows the toggle when node labels show properties", () => {
		expect(shouldHide(configWith({[key]: properties}))).toBe(false);
	});

	it("hides the toggle when node labels show note names", () => {
		expect(shouldHide(configWith({[key]: namedLinks}))).toBe(true);
	});

	it("falls back to the default label content when none is configured", () => {
		expect(shouldHide(configWith({}))).toBe(false);
		expect(shouldHide(configWith({[key]: ""}))).toBe(false);
		expect(shouldHide(undefined)).toBe(false);
		expect(shouldHideShowPropertyNames(namedLinks)(configWith({}))).toBe(true);
	});
});
