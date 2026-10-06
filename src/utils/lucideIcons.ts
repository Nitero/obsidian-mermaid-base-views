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
			  <path d="M2 11h4.5c1.75 0 3 1 4.5 2.15 2 1.4 4 2.85 6.5 2.85H22v-4h-4.5c-2 0-3.5-1.65-5-2.7C10.75 8.1 8.75 7 6.5 7H22V3H2z" />
			  <path d="M22 16c-3 0-5.65 1.35-8.15 3.15C11.6 20.65 9.25 21 6.5 21H2v-4h4.5c2.5 0 4.65-.85 6.75-2.25" />
			`),
		);
		addIcon(
			"custom-radar-chart",
			lucideIcon(`
			  <path d="M10.83 2.38a2 2 0 012.34 0l8 5.74a2 2 0 01.73 2.25l-3.04 9.26a2 2 0 01-1.9 1.37H7.04a2 2 0 01-1.9-1.37L2.1 10.37a2 2 0 01.73-2.25z" />
			  <path d="M12 2.5v5.19" />
			  <path d="m12 7.69 4.47 3.21-1.68 5.1H9.21l-1.68-5.1z" />
			  <path d="M17.6 19.72 14.79 16" />
			  <path d="m21 9.5-4.53 1.4" />
			  <path d="m3 9.5 4.53 1.4" />
			  <path d="M6.4 19.72 9.21 16" />
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
		addIcon(
			"custom-quadrant-chart-2",
			lucideIcon(`
			  <path d="M12 2v20" />
			  <path d="M22 12H2" />
			  <circle cx="17" cy="17" r=".5" fill="currentColor" />
			  <circle cx="17" cy="7" r=".5" fill="currentColor" />
			  <circle cx="7" cy="17" r=".5" fill="currentColor" />
			  <circle cx="7" cy="7" r=".5" fill="currentColor" />
			  <rect x="2" y="2" width="20" height="20" />
			`),
		);
		addIcon(
			"custom-timeline",
			lucideIcon(`
			  <path d="M2 8h20l-3 3" />
			  <path d="m22 8-3-3" />
			  <path d="M5 13 L13 13" />
			  <path d="M5 18 L13 18" />
			  <path d="M5 3 L13 3" />
			`),
		);
	}
}
