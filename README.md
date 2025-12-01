# Mermaid Base Views

Create dynamic mermaid diagrams and charts in bases.

## Usage

- Go to a base
- Add one of the new [View Types](#view-types)
- Configure the view options: e.g. the title, the [mermaid config](#mermaid-config) and any view specific settings
- (Configure the sorting, grouping, filtering and properties as usual if they are supported for this view)

![Recording2025-12-02002507-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/b65977f0-e17f-45f9-b1c1-4756081e2de3)

### Mermaid Config

[Mermaid configs](https://mermaid.js.org/config/configuration.html) can be used to change the [visual style](https://mermaid.js.org/config/theming.html) or specific mermaid settings when they are not yet supported by this plugin.

The config can be set for all views globally in the plugin settings, or for specific view types.
There is also a local override possible for each individual view in a base (see the last setting).

In the plugin settings the syntax used is [frontmatter config](https://mermaid.js.org/config/configuration.html#frontmatter-config):
```
config:
  look: "handDrawn"
  theme: "neutral"
```
In the base view settings the syntax used is [directives](https://mermaid.js.org/config/directives.html):
```
%%{init: { "look": "handDrawn", "theme": "neutral" }}%%
```

## View Types

Currently supported are:
- [Flowchart](#flowchart)
- [Mindmap](#mindmap)
- [Timeline](#flowchart)
- [Sankey](#sankey)
- [Pie Chart](#pie-chart)
- [XY Chart](#xy-chart)
- [Quadrant Chart](#quadrant-chart)

### Flowchart

<img width="939" height="579" alt="image" src="https://github.com/user-attachments/assets/51aa3edd-2ca3-470e-98f4-7ab96d5218b2" />

Can be used to show the links between notes. Good for small amounts of results.

This will display all notes based on the filters of the base as labels. The labels will show either clickable links of the note names, or the selected properties (depending on the settings).
It will also show any links between the notes as lines. If the links come from properties their names will be visible on the lines. 
Supports grouping, by adding boxes around each group.

### Mindmap

<img width="939" height="579" alt="image" src="https://github.com/user-attachments/assets/1dba6a2a-cb2f-4d8e-ac7b-619cdf778bed" />

Works similar to flowcharts. A bit better for bigger amounts of results, but without note link support.

### Timeline

<img width="939" height="579" alt="image" src="https://github.com/user-attachments/assets/0bfa99ab-5c95-4f87-bac0-66b8896690b6" />

Shows your notes in chronological order.

Select a time property in the view settings to order by this. If notes share the same date they will be shown vertically below eachother.
You can also choose a cutoff to group by year, month, day, hour, etc.

### Sankey

<img width="939" height="579" alt="image" src="https://github.com/user-attachments/assets/8711fa5f-47e0-49d5-8025-dc9af9c23e4c" />

Can be used to show the flow of data

Configuring this is a bit experimental, as there is no support for a list of properties. Instead write triplets of "Source Name", "Target Name" and "Value Property" into the multitext field. The first 2 can be any string, but the latter should be the name of a property or formula. If the value is numeric, it will be added up across the whole view. If the value is a boolean, it will add up all positive ones.

### Pie Chart

<img width="939" height="579" alt="image" src="https://github.com/user-attachments/assets/7cc1ee27-8c07-4286-b67b-52a71fa98606" />

Can show a property as a pie chart.

This will show how often a property is used across all files specified by the filters.
Optionally a second numeric property can be set to aggregate that property instead of counting 1 for each file.

### XY Chart

<img width="939" height="579" alt="image" src="https://github.com/user-attachments/assets/4d0d0ea0-87f6-4f2c-984a-6522f703ccef" />

Can show 1 dimensional data as bar or line chart.

Requires setting 1 numeric property, for example "file.size".
Will use all files specified by the filters.
Supports sorting.

### Quadrant Chart

<img width="939" height="579" alt="image" src="https://github.com/user-attachments/assets/1510fdc7-c243-4c29-a72a-ecc024f7c0d7" />

Can show 2 dimensional data as points on a plane.

Requires setting 2 numeric properties, for example "x" and "y". By default the smallest and biggest valeus are used for the range, but you can specify minimum and maximum manually.
The axes and quadrants can all be labeled.
Supports grouping, by coloring nodes by their group.

## Roadmap

- [ ] Add gantt view type
- [ ] Add radar chart view type (waiting for mermaid v11.6.0)
- [ ] Add labels on XY chart (waiting for mermaid v11.7.0)
- [ ] More styling options in the view settings instead of relying on the mermaid config
- [ ] Support multiple lines in the XY chart
- [ ] Support grouping in more view types
- [ ] Property dropdown options to only show appropriate types
