import {describe, expect, it} from "vitest";
import {indent} from "../../src/core/utils";

describe("indent", () => {
	it("returns an empty string at level 0", () => {
		expect(indent(0)).toBe("");
	});

	it("emits two spaces per level", () => {
		expect(indent(1)).toBe("  ");
		expect(indent(3)).toBe("      ");
	});
});
