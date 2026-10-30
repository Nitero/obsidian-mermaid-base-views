# Mermaid Base Views

> Create dynamic mermaid diagrams and charts in Bases.

> [!WARNING]
> Now requires Obsidian 1.15.0 or newer.
>
> Uses Obsidian's built-in [Pele](https://pele.run/) renderer with [Mermaid](https://mermaid.js.org/) syntax.

# Table of Contents

- [📌 Usage](#-usage)
- [⚙ Settings](#-settings)
	- [Base view settings](#base-view-settings)
	- [Mermaid configuration](#mermaid-config)
	- [Styling](#styling)
- [🗃 View Types](#-view-types)
	- [Base features](#base-features)
	- [Layout Views](#layout-views)
		- [Flowchart](#flowchart)
		- [Mindmap](#mindmap)
	- [Time Views](#time-views)
		- [Timeline](#timeline)
		- [Gantt](#gantt)
	- [Numeric Views](#numeric-views)
		- [XY Chart](#xy-chart)
		- [Quadrant Chart](#quadrant-chart)
		- [Radar Chart](#radar-chart)
	- [Aggregate Views](#aggregate-views)
		- [Pie Chart](#pie-chart)
		- [Sankey](#sankey)
- [🚧 Roadmap](#-roadmap)

# 📌 Usage

1. Open a Base and add one of the Mermaid [view types](#-view-types).
2. Select the properties to display in the Base's **Properties** menu.
3. Configure the [view settings](#base-view-settings). Most views require a main property, such as a numeric **Y-axis property** in the [XY chart](#xy-chart).
4. Use [native Base features](#base-features) to filter, sort, group and search where supported.

![Recording2025-12-02002507-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/b65977f0-e17f-45f9-b1c1-4756081e2de3)

# ⚙ Settings

Start with the view settings, then use Mermaid configuration or CSS for further customization:

- [Base view settings](#base-view-settings): Configure individual options for each view type.
- [Mermaid configuration](#mermaid-config): Set additional options globally in the plugin settings or override them per Base view.
- [Styling](#styling): Customize the appearance with CSS snippets.

## Base view settings

Configure each diagram through the [Base toolbar](https://obsidian.md/help/bases/views#Toolbar) as usual to filter, sort, etc. Additionally each view comes with [Base view settings](https://obsidian.md/help/bases/views#View+settings). Together these allow creating Mermaid diagrams without requiring syntax knowledge. Start with the common settings below, then see the individual [view types](#-view-types) for individual options.

Common view settings:
- **Title**: Most views default to the view name when this is empty. Enter a single space to hide the title.
- **Properties**: In views with note labels, select and reorder properties in the Base's **Properties** menu to control their content and order.
  - **Show property names** includes their display names alongside values, except for filenames. If no label properties are selected, labels fall back to the note's filename.
- **Note links**: Selected `file.name` and `file.basename` values become note links. When a label has other properties but no filename, the whole element links to the note.
- **Images and icons**: In views with note labels, create a Base formula such as `image("cover.png")` for a local vault image or `icon("flag")` for a [Lucide](https://lucide.dev/) icon, then select the formula in **Properties**. Select an image in the diagram to open its preview. See [Base features](#base-features) for supported views.
- **Mermaid Config Override Directive**: Use [per-view Mermaid configuration](#per-view-mermaid-config) for options without a dedicated control, such as values above XY chart bars.

## Mermaid config

Use [Mermaid configuration](https://mermaid.js.org/config/configuration.html) for diagram options not (yet) available via view settings. Set defaults for each view type in the plugin settings, or override them in an individual Base view.

### Global Mermaid config

The plugin settings use the [frontmatter configuration](https://mermaid.js.org/config/configuration.html#frontmatter-config) syntax.\
For example, to show values on all XY charts and set their width use this in the plugin settings:

```yaml
config:
  xyChart:
    showDataLabel: true
    width: 1000
```

### Per view Mermaid config

In the Base view settings, **Mermaid Config Override Directive** uses the [directives](https://mermaid.js.org/config/directives.html) syntax.\
To apply the same options to one XY chart, use this directive in the base view settings:

```text
%%{init: { "xyChart": { "showDataLabel": true, "width": 1000 } }}%%
```

## Styling

Pele adapts to your Obsidian theme. For further styling, use [CSS snippets](https://obsidian.md/help/snippets). Obsidian exposes `--mermaid-*` CSS variables for colors, corner radius, and font weights. Use [Pele's `.pele-*` classes](https://pele.run/theming#classes) to target the diagram and elements inside it.

For example, change node fills, connecting lines and the first three chart series or Sankey flow colors:

```css
.mermaid {
	--mermaid-surface: color-mix(in srgb, var(--color-orange) 20%, var(--background-primary));
	--mermaid-line-color: var(--color-orange);
	--mermaid-accent: var(--color-orange);

	/* Different views use different parts of this palette. */
	--mermaid-color-1: var(--color-orange);
	--mermaid-color-2: var(--color-purple);
	--mermaid-color-3: var(--color-cyan);
}
```

To make text italic across view types:

```css
.pele :is(text, .pele-label) {
	font-style: italic;
}
```

# 🗃 View Types

The plugin supports the Mermaid diagrams and charts listed below. Other diagram types may not fit note-based data or may need features that Bases does not yet provide.

Choose a view from a category for what you want to show:
- [Layout views](#layout-views) - Notes and links between them
- [Time views](#time-views) - Dates and durations
- [Numeric views](#numeric-views) - Numeric comparisons
- [Aggregate views](#aggregate-views) - Sums across notes

## Base features

All view types support native Base filtering and searching. You can configure them without writing Mermaid syntax.

Search applies to the underlying notes and selected properties. In [aggregate views](#aggregate-views), searching changes which notes contribute to the totals; it does not search the displayed categories or flow names.

Support for other native Base features varies by view type:

| View Category                       | View Type                             |      Sorting      |   Grouping    | Selected properties | Property images & icons |
|-------------------------------------|---------------------------------------|:-----------------:|:-------------:|:-------------------:|:-----------------------:|
| [Layout Views](#layout-views)       | **[Flowchart](#flowchart)**           | Automatic layout  |     Boxes     |     Note labels     |           Yes           |
|                                     | **[Mindmap](#mindmap)**               | Automatic layout  |   Branches    |     Note labels     |           Yes           |
| [Time Views](#time-views)           | **[Timeline](#timeline)**             |  Within periods   |   Sections    |     Note labels     |           Yes           |
|                                     | **[Gantt](#gantt)**                   |     Row order     |   Sections    |     Note labels     |           Yes           |
| [Numeric Views](#numeric-views)     | **[XY Chart](#xy-chart)**             |    Note order     |       -       |     Note labels     |           Yes           |
|                                     | **[Quadrant Chart](#quadrant-chart)** |         -         | Point colors  |     Note labels     |           Yes           |
|                                     | **[Radar Chart](#radar-chart)**       |   Legend order    |       -       |     Chart axes      |            -            |
| [Aggregate Views](#aggregate-views) | **[Pie Chart](#pie-chart)**           |   Legend order    |       -       |          -          |            -            |
|                                     | **[Sankey](#sankey)**                 |         -         |       -       |          -          |            -            |

## Layout Views

### Flowchart

<img align="right" width="400" alt="Flowchart example" src="https://github.com/user-attachments/assets/51aa3edd-2ca3-470e-98f4-7ab96d5218b2" />

Shows links between notes, useful for exploring relationships and dependencies.

By default, links come from both note bodies and properties. **Link property** limits property links to one property, such as `depends_on`; body links are still included unless **Link source** is set to **Properties**.

Linked notes outside the Base's results are hidden unless **Show links to filtered-out notes** is enabled.

<br clear="both" />

### Mindmap

<img align="right" width="400" alt="Mindmap example" src="https://github.com/user-attachments/assets/1dba6a2a-cb2f-4d8e-ac7b-619cdf778bed" />

Arranges linked notes into branches, useful for topic outlines and hierarchical collections.

Uses the same link options as [Flowchart](#flowchart).

Use **Central node label** to rename the central node; it defaults to the view name.

Each note appears at most once. When several notes link to the same target, it appears under the first branch that reaches it.

<br clear="both" />

## Time Views

### Timeline

<img align="right" width="400" alt="Timeline example" src="https://github.com/user-attachments/assets/0bfa99ab-5c95-4f87-bac0-66b8896690b6" />

Places notes in chronological periods, useful for journals, release histories, and milestones.

Requires a date or date & time **Date / Time property**, such as `file.ctime`.

**Cutoff** combines events into periods, such as months or days. Periods stay chronological; Base sorting only affects notes within the same period.

When grouped, each section has its own chronological periods and sections follow the Base group order.

<br clear="both" />

### Gantt

Shows time spans and date markers, useful for project schedules and daily plans.

Requires a **Start property** for time spans and point events, a **Vertical marker property** for date markers, or both. These accept date, date & time, or text properties.

Optionally set an **End property** accepting date, date & time, or text values, or a text **Duration property**, such as `30m` or `1.5d` (see [full list](https://mermaid.js.org/syntax/gantt.html#duration-format)). A populated end takes precedence over duration.

For point events, leave both end and duration empty, set the end equal to the start, or use a zero duration.

Text dates accept ISO dates or times such as `09:30`. Time-only starts use today's date; time-only ends use the start's date. For other formats, set **Input date text property format**, for example `DD/MM/YYYY` (see [syntax](https://mermaid.js.org/syntax/gantt.html#setting-dates)).

**Axis label format** uses different tokens, such as `%d %b` or `%H:%M` (see [full list](https://mermaid.js.org/syntax/gantt.html#output-date-format-on-the-axis)). Use **Excludes** to [exclude days](https://mermaid.js.org/syntax/gantt.html#excludes), such as weekends.

The **Appearance property** changes the color of time spans via `active`, `done`, or `crit`. For point events, use `milestone` to get a diamond, or use images or [Lucide](https://lucide.dev/) icons via a formula such as `icon("flag")` or `image("cover.png")`.

## Numeric Views

### XY Chart

<img align="right" width="400" alt="XY chart example" src="https://github.com/user-attachments/assets/64ad64ea-a308-4649-8e56-c702b6f8c590" />

Compares one numeric value per note using bars, a line, or both.

Requires a numeric **Y-axis property**, such as `file.size`.

The X-axis uses note labels in Base sort order. Dates are treated as equally spaced labels rather than a continuous time scale. Y-axis limits follow the data unless set manually; set the minimum to `0` if you want a zero baseline.

<br clear="both" />

### Quadrant Chart

<img align="right" width="400" alt="Quadrant chart example" src="https://github.com/user-attachments/assets/1510fdc7-c243-4c29-a72a-ecc024f7c0d7" />

Plots notes on 4 areas using two numeric properties, such as importance and urgency. Requires **X coordinate property** and **Y coordinate property**.

Axis ranges follow the smallest and largest values in the results. Set them manually to keep positions comparable when filters change. Values outside a manual range are placed at its edge.

Right and top axis labels require a left and bottom label respectively.

<br clear="both" />

### Radar Chart

<img align="right" width="400" alt="Radar chart example" src="https://github.com/user-attachments/assets/e2403f97-0745-4222-9017-83661b7d27b5" />

Compares several properties across notes on radial axes, useful for habit tracking or character attributes.

Select number or boolean properties in the Base's **Properties** menu to use as axes; at least three are recommended. Deselect unrelated properties such as `file.name`.

All axes share one scale, so use comparable units or formulas that convert values to a shared scale. Boolean values use `1` for true and `0` for false; missing values use the chart minimum.

<br clear="both" />

## Aggregate Views

### Pie Chart

<img align="right" width="400" alt="Pie chart example" src="https://github.com/user-attachments/assets/7cc1ee27-8c07-4286-b67b-52a71fa98606" />

Shows proportions across categories, useful for task counts by status or spending by category.

Requires a **Category property**, such as `status` or `file.folder`. Each slice counts notes with the same property value. Optionally select a numeric **Value property** to sum values instead.

List properties form a single combined category rather than separate slices. When summing a value property, missing or nonnumeric values contribute `1`; filter those notes out if you only want numeric totals.

<br clear="both" />

### Sankey

<img align="right" width="400" alt="Sankey diagram example" src="https://github.com/user-attachments/assets/8711fa5f-47e0-49d5-8025-dc9af9c23e4c" />

Shows the relative size of flows between named sources and targets, useful for budgets or resource allocation.

In **Flows (source name, target name, value property)**, enter three separate text items per flow, for example:

1. `Income` - source label (any text)
2. `Savings` - target label (any text)
3. `saved` - value property (exact property name)

Repeat for additional flows. The value property is summed across the filtered notes; booleans count as `1` or `0`.

For formulas, use `formula.` before the name, such as `formula.price`.

<br clear="both" />

# 🚧 Roadmap

- [x] Add gantt view type
- [x] Add radar chart view type
- [ ] ~~Add labels on XY chart (waiting for mermaid v11.7.0)~~ -> you can use [Mermaid Config](#mermaid-config) instead
- [ ] More styling options in the view settings instead of relying on the mermaid config
- [ ] Support multiple lines in the XY chart
- [x] Support Timeline grouping through sections
- [ ] Property dropdown options to only show appropriate types
