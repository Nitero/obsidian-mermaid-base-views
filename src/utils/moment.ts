import {moment as obsidianMoment} from "obsidian";
import type momentFactory from "moment";

// Obsidian exports the callable factory, but its namespace type depends on esModuleInterop.
// Keep the boundary explicitly unknown so the assertion is needed under either setting.
const momentValue: unknown = obsidianMoment;
export const moment = momentValue as typeof momentFactory;
