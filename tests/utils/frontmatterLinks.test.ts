import {describe, expect, it} from "vitest";
import {
	frontmatterLinkKeyToProperty,
	frontmatterLinkMatchesProperty,
} from "../../src/utils/frontmatterLinks";

describe("frontmatterLinkKeyToProperty", () => {
	it("returns a scalar property key unchanged", () => {
		expect(frontmatterLinkKeyToProperty("parent_note")).toBe("parent_note");
	});

	it("drops the list index appended to a link in a list property", () => {
		expect(frontmatterLinkKeyToProperty("parent_note.0")).toBe("parent_note");
		expect(frontmatterLinkKeyToProperty("parent_note.12")).toBe("parent_note");
	});

	it("drops indices of nested lists", () => {
		expect(frontmatterLinkKeyToProperty("parent_note.0.1")).toBe("parent_note");
	});

	it("keeps a dot that is part of the property name", () => {
		expect(frontmatterLinkKeyToProperty("project.lead")).toBe("project.lead");
	});
});

describe("frontmatterLinkMatchesProperty", () => {
	it("matches every key when no property is selected", () => {
		expect(frontmatterLinkMatchesProperty("parent_note", null)).toBe(true);
		expect(frontmatterLinkMatchesProperty("anything.3", null)).toBe(true);
	});

	it("matches a scalar property by name", () => {
		expect(frontmatterLinkMatchesProperty("parent_note", "parent_note")).toBe(true);
	});

	it("matches every entry of a list property", () => {
		expect(frontmatterLinkMatchesProperty("parent_note.0", "parent_note")).toBe(true);
		expect(frontmatterLinkMatchesProperty("parent_note.7", "parent_note")).toBe(true);
	});

	it("does not match a different property", () => {
		expect(frontmatterLinkMatchesProperty("related.0", "parent_note")).toBe(false);
	});

	it("does not match a property that merely shares a prefix", () => {
		expect(frontmatterLinkMatchesProperty("parent_note_legacy", "parent_note")).toBe(false);
	});
});
