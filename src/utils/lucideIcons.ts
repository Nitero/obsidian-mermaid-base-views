import {addIcon} from "obsidian";

const lucideIcon = (contents: string) => `
	<g
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		transform="scale(${100 / 24})"
	>
		${contents}
	</g>
`;


export class CustomLucideIcons {
	constructor() {
		addIcon(
			"custom-sankey",
			lucideIcon(`
			  <path d="M 2 11 L 5.473 11" />
			  <path d="M 2 2 L 2 11" />
			  <path d="M 21.973 2 L 2 2" />
			  <path d="M 21.973 6 L 21.973 2" />
			  <path d="m10.723 15.206.05.094a4 4 0 01-3.3 1.7" />
			  <path d="M11.23 14.481 9.572 13.2" />
			  <path d="M15.227 17.2a4 4 0 01.773-.829" />
			  <path d="M15.959 11.5a4 4 0 01-3.3-1.8L10.5 6.5" />
			  <path d="M16 11.5h5.973l.027 5h-7.541a4 4 0 01-3.3-1.8" />
			  <path d="M5.5 6.5H22" />
			  <path d="M7.5 17H2.027L2 22h6.973a4 4 0 003.3-1.7l2.454-3.1" />
			  <path d="M9.072 13.2a4 4 0 00-3.6-2.2" />
			`),
		);
		addIcon(
			"custom-radar-chart",
			lucideIcon(`
			  <path d="m20 17-8.015-5.01.017-9.986" />
			  <path d="m4 17.5 7.985-5.51" />
			  <circle cx="11.985" cy="11.99" r="5.5" />
			  <circle cx="12.002" cy="12.004" r="10" />
			`),
		);
		addIcon(
			"custom-molecule", //https://github.com/lucide-icons/lucide/issues/4396
			lucideIcon(`
			  <path d="m12.342 9.316 1.764-3.527" />
			  <path d="m12.59 14.545 2.35 3.759" />
			  <path d="m13.982 12.332 4.03.447" />
			  <path d="M5.414 17.586 8.88 14.12" />
			  <path d="M9.025 9.742 5.317 5.505" />
			  <circle cx="11" cy="12" r="3" />
			  <circle cx="15" cy="4" r="2" />
			  <circle cx="16" cy="20" r="2" />
			  <circle cx="20" cy="13" r="2" />
			  <circle cx="4" cy="19" r="2" />
			  <circle cx="4" cy="4" r="2" />
			`),
		);
		addIcon(
			"custom-quadrant-chart", //== grid-2x2, not released?
			lucideIcon(`
			  <path d="M12 3v18" />
			  <path d="M3 12h18" />
			  <rect x="3" y="3" width="18" height="18" rx="2" />
			`),
		);
	}
}
