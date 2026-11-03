import {type BasesAllOptions, type BasesOptions} from "obsidian";

export function findConfigOption(options: readonly BasesAllOptions[], key: string): BasesOptions | undefined {
	for (const option of options) {
		if (option.type === "group") {
			const nestedOption = findConfigOption(option.items, key);
			if (nestedOption)
				return nestedOption;
		} else if (option.key === key) {
			return option;
		}
	}
	return undefined;
}

export function readStringConfig(value: unknown, defaultValue: unknown): string {
	if (typeof defaultValue !== "string")
		throw new Error("Expected a string configuration default.");
	return typeof value === "string" && value.length > 0 ? value : defaultValue;
}

export function readBooleanConfig(value: unknown, defaultValue: unknown): boolean {
	if (typeof defaultValue !== "boolean")
		throw new Error("Expected a boolean configuration default.");
	return typeof value === "boolean" ? value : defaultValue;
}

function isStringList(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item: unknown) => typeof item === "string");
}

export function readStringListConfig(value: unknown, defaultValue: unknown): string[] {
	if (!isStringList(defaultValue))
		throw new Error("Expected a string-list configuration default.");
	return isStringList(value) ? value : defaultValue;
}

export function readDropdownConfig<Choice extends string>(
	value: unknown,
	choices: Record<Choice, string>,
	defaultValue: unknown,
): Choice {
	for (const choice in choices) {
		if (choice === value)
			return choice;
	}
	for (const choice in choices) {
		if (choice === defaultValue)
			return choice;
	}
	throw new Error("Expected a configuration default matching a dropdown choice.");
}
