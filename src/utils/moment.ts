import {moment as obsidianMoment} from "obsidian";
import type momentFactory from "moment";

// Obsidian's typings declare a namespace, but the runtime exports the callable Moment factory.
export const moment = obsidianMoment as unknown as typeof momentFactory;
