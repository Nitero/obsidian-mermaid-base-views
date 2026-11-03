import {BasesAllOptions} from "obsidian";

export interface MermaidViewRegistrationData {
	id: string;
	name: string;
	icon: string;
	getOptions: () => BasesAllOptions[];
}
