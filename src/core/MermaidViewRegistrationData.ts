import {BasesAllOptions} from "obsidian";
import MermaidBaseViews from "../main";

export interface MermaidViewRegistrationData {
	id: string;
	name: string;
	icon: string;
	getOptions: (plugin: MermaidBaseViews) => BasesAllOptions[];
}
