import {ViewOption} from "obsidian";

export interface MermaidViewRegistrationData {
	id: string;
	name: string;
	icon: string;
	options: ViewOption[];
}
