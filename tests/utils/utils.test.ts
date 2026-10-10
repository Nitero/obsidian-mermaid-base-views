import {describe, expect, it} from "vitest";
import type {BasesViewConfig, CachedMetadata, FrontmatterLinkCache, LinkCache} from "obsidian";
import {
	getBodyLinksForSource,
	getFrontmatterLinksForSource,
	getPropertyNameFromId,
	indent,
	shouldHidePropertyLinkOptions,
} from "../../src/utils/utils";
import {LINK_OPTIONS, LINK_SOURCE_VALUES} from "../../src/core/constants";

const {propertiesAndBody, propertiesOnly, bodyOnly} = LINK_SOURCE_VALUES;

function bodyLink(link: string): LinkCache {
	return {link, original: `[[${link}]]`} as LinkCache;
}

function frontmatterLink(key: string, link: string): FrontmatterLinkCache {
	return {key, link, original: `[[${link}]]`};
}

function configWith(values: Record<string, unknown>): BasesViewConfig {
	return {get: (key: string) => values[key]} as unknown as BasesViewConfig;
}

const cache: CachedMetadata = {
	links: [bodyLink("Body A"), bodyLink("Body B")],
	frontmatterLinks: [
		frontmatterLink("parent_note", "Parent"),
		frontmatterLink("related.0", "Related 1"),
		frontmatterLink("related.1", "Related 2"),
	],
};

function targets(links: {link: string}[]): string[] {
	return links.map((link) => link.link);
}

describe("indent", () => {
	it("returns an empty string at level 0", () => {
		expect(indent(0)).toBe("");
	});

	it("emits two spaces per level", () => {
		expect(indent(1)).toBe("  ");
		expect(indent(3)).toBe("      ");
	});
});

describe("getBodyLinksForSource", () => {
	it.each([propertiesAndBody, bodyOnly])("returns the body links for %s", (linkSource) => {
		expect(targets(getBodyLinksForSource(cache, linkSource))).toEqual(["Body A", "Body B"]);
	});

	it("returns no body links for properties-only", () => {
		expect(getBodyLinksForSource(cache, propertiesOnly)).toEqual([]);
	});

	it("returns no body links for an unknown link source", () => {
		expect(getBodyLinksForSource(cache, "something-else")).toEqual([]);
	});

	it("returns no body links when the note has none", () => {
		expect(getBodyLinksForSource({}, bodyOnly)).toEqual([]);
	});

	it("returns no body links when the note has no metadata cache", () => {
		expect(getBodyLinksForSource(null, bodyOnly)).toEqual([]);
		expect(getBodyLinksForSource(undefined, bodyOnly)).toEqual([]);
	});
});

describe("getFrontmatterLinksForSource", () => {
	it.each([propertiesAndBody, propertiesOnly])("returns all frontmatter links for %s", (linkSource) => {
		expect(targets(getFrontmatterLinksForSource(cache, linkSource)))
			.toEqual(["Parent", "Related 1", "Related 2"]);
	});

	it("returns no frontmatter links for body-only", () => {
		expect(getFrontmatterLinksForSource(cache, bodyOnly)).toEqual([]);
		expect(getFrontmatterLinksForSource(cache, bodyOnly, "parent_note")).toEqual([]);
	});

	it("returns no frontmatter links for an unknown link source", () => {
		expect(getFrontmatterLinksForSource(cache, "something-else")).toEqual([]);
	});

	it("limits links to a scalar property", () => {
		expect(targets(getFrontmatterLinksForSource(cache, propertiesOnly, "parent_note")))
			.toEqual(["Parent"]);
	});

	it("limits links to every entry of a list property", () => {
		expect(targets(getFrontmatterLinksForSource(cache, propertiesAndBody, "related")))
			.toEqual(["Related 1", "Related 2"]);
	});

	it("returns no links when the selected property has none", () => {
		expect(getFrontmatterLinksForSource(cache, propertiesOnly, "missing")).toEqual([]);
	});

	it("returns no frontmatter links when the note has no metadata cache", () => {
		expect(getFrontmatterLinksForSource(null, propertiesOnly)).toEqual([]);
		expect(getFrontmatterLinksForSource(undefined, propertiesOnly)).toEqual([]);
	});
});

describe("getPropertyNameFromId", () => {
	it("returns null when no property is selected", () => {
		expect(getPropertyNameFromId(null)).toBeNull();
	});

	it("returns the property name without its type prefix", () => {
		expect(getPropertyNameFromId("note.parent_note")).toBe("parent_note");
	});
});

describe("shouldHidePropertyLinkOptions", () => {
	const shouldHide = shouldHidePropertyLinkOptions(LINK_OPTIONS.source.default);

	it("hides the property options when links come from the body only", () => {
		expect(shouldHide(configWith({[LINK_OPTIONS.source.key]: bodyOnly}))).toBe(true);
	});

	it.each([propertiesAndBody, propertiesOnly])("shows the property options for %s", (linkSource) => {
		expect(shouldHide(configWith({[LINK_OPTIONS.source.key]: linkSource}))).toBe(false);
	});

	it("falls back to the default link source when none is configured", () => {
		expect(shouldHide(configWith({}))).toBe(false);
		expect(shouldHide(configWith({[LINK_OPTIONS.source.key]: ""}))).toBe(false);
		expect(shouldHide(undefined)).toBe(false);
		expect(shouldHidePropertyLinkOptions(bodyOnly)(configWith({}))).toBe(true);
	});
});
