import { __awaiter } from "tslib";
import { BasesView, MarkdownRenderer, parsePropertyId, Keymap, Menu, Notice, } from 'obsidian';
export class MermaidBaseViewBase extends BasesView {
    constructor(controller, parentEl) {
        super(controller);
        this.containerEl = parentEl.createDiv('base-mermaid-view');
    }
    onDataUpdated() {
        this.containerEl.empty();
        this.render().catch((error) => {
            console.error('Failed to render Mermaid', error);
            this.containerEl.empty();
            this.containerEl.createDiv({ text: 'Error rendering Mermaid. See console for details.' });
        });
    }
    renderMermaid(mermaidCode) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const rawConfig = this.config.get('mermaidConfig');
            const configBlock = typeof rawConfig === 'string' ? rawConfig.trim() : '';
            mermaidCode = mermaidCode.trim();
            if (configBlock.length > 0)
                mermaidCode = `${configBlock}\n${mermaidCode}`;
            const markdown = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
            const sourcePath = (_b = (_a = this.app.workspace.getActiveFile()) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : '';
            yield MarkdownRenderer.render(this.app, markdown, this.containerEl, sourcePath, this);
            this.hookUpInternalLinks(this.containerEl, sourcePath);
        });
    }
    hookUpInternalLinks(containerEl, sourcePath) {
        const app = this.app;
        containerEl
            .querySelectorAll('a.internal-link')
            .forEach((el) => {
            const getLinkText = () => el.getAttribute('data-href') || el.getAttribute('href');
            // Hover preview
            this.registerDomEvent(el, 'mouseover', (evt) => {
                const linktext = getLinkText();
                if (!linktext)
                    return;
                app.workspace.trigger('hover-link', {
                    event: evt,
                    source: 'preview',
                    hoverParent: { hoverPopover: null },
                    targetEl: el,
                    linktext,
                    sourcePath,
                });
            });
            // Left click
            this.registerDomEvent(el, 'click', (evt) => {
                if (evt.button !== 0)
                    return;
                const linktext = getLinkText();
                if (!linktext)
                    return;
                evt.preventDefault();
                app.workspace.openLinkText(linktext, sourcePath, Keymap.isModEvent(evt));
            });
            // Middle click
            this.registerDomEvent(el, 'auxclick', (evt) => {
                if (evt.button !== 1)
                    return;
                const linktext = getLinkText();
                if (!linktext)
                    return;
                evt.preventDefault();
                app.workspace.openLinkText(linktext, sourcePath, 'tab');
            });
            // Right click
            this.registerDomEvent(el, 'contextmenu', (evt) => __awaiter(this, void 0, void 0, function* () {
                const linktext = getLinkText();
                if (!linktext)
                    return;
                evt.preventDefault();
                evt.stopPropagation();
                const file = app.metadataCache.getFirstLinkpathDest(linktext, sourcePath);
                if (!file) {
                    new Notice(`File not found for link: ${linktext}`);
                    return;
                }
                const menu = new Menu();
                menu.addItem((item) => item
                    .setTitle('Open in new tab')
                    .setIcon('file-plus')
                    .setSection('open')
                    .onClick(() => {
                    app.workspace.openLinkText(linktext, sourcePath, 'tab');
                }));
                menu.addItem((item) => item
                    .setTitle('Open to the right')
                    .setIcon('separator-vertical')
                    .setSection('open')
                    .onClick(() => {
                    app.workspace.openLinkText(linktext, sourcePath, 'split');
                }));
                menu.addItem((item) => item
                    .setTitle('Rename...')
                    .setIcon('pencil-line')
                    .setSection('action')
                    .onClick(() => {
                    app.workspace.trigger('rename', file); //TODO: fix this not working (why have to reimplement it anyways?)
                }));
                //TODO: add "Copy - copy" that copies not name to section "clipboard"
                //TODO: remove merge entire file with...
                app.workspace.trigger('file-menu', menu, file);
                menu.showAtMouseEvent(evt);
            }));
        });
    }
    getLabelWithProperties(file, showPropertyNames, newLine, colon) {
        for (const group of this.data.groupedData) {
            for (const entry of group.entries) {
                if (entry.file != file)
                    continue;
                let label = "";
                let isFirst = true;
                for (const property of this.data.properties) {
                    const value = entry.getValue(property);
                    if (!value)
                        continue;
                    if (isFirst)
                        isFirst = false;
                    else
                        label += newLine;
                    if (showPropertyNames && property != "file.name" && property != "file.basename")
                        label += `${parsePropertyId(property).name}${colon} `;
                    label += value;
                }
                if (label == "")
                    return file.basename;
                else
                    return label;
            }
        }
        return file.basename;
    }
    ;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVybWFpZEJhc2VWaWV3QmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1lcm1haWRCYXNlVmlld0Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFFTixTQUFTLEVBRVQsZ0JBQWdCLEVBQ2hCLGVBQWUsRUFDZixNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sR0FDcEIsTUFBTSxVQUFVLENBQUM7QUFFbEIsTUFBTSxPQUFnQixtQkFBb0IsU0FBUSxTQUFTO0lBRzFELFlBQVksVUFBMkIsRUFBRSxRQUFxQjtRQUM3RCxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVNLGFBQWE7UUFDbkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDN0IsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUMsSUFBSSxFQUFFLG1EQUFtRCxFQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFJZSxhQUFhLENBQUMsV0FBbUI7OztZQUNoRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNuRCxNQUFNLFdBQVcsR0FBRyxPQUFPLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBRTFFLFdBQVcsR0FBRyxX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LElBQUksT0FBTyxDQUFDO29CQUVsQixJQUFJLGlCQUFpQixJQUFJLFFBQVEsSUFBSSxXQUFXLElBQUksUUFBUSxJQUFJLGVBQWU7d0JBQzlFLEtBQUssSUFBSSxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxHQUFHLENBQUM7b0JBRXZELEtBQUssSUFBSSxLQUFLLENBQUM7aUJBQ2Y7Z0JBRUQsSUFBSSxLQUFLLElBQUksRUFBRTtvQkFDZCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7O29CQUVyQixPQUFPLEtBQUssQ0FBQzthQUNkO1NBQ0Q7UUFFRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdEIsQ0FBQztJQUFBLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcblx0VEZpbGUsXHJcblx0QmFzZXNWaWV3LFxyXG5cdFF1ZXJ5Q29udHJvbGxlcixcclxuXHRNYXJrZG93blJlbmRlcmVyLFxyXG5cdHBhcnNlUHJvcGVydHlJZCxcclxuXHRLZXltYXAsIE1lbnUsIE5vdGljZSxcclxufSBmcm9tICdvYnNpZGlhbic7XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTWVybWFpZEJhc2VWaWV3QmFzZSBleHRlbmRzIEJhc2VzVmlldyB7XHJcblx0cHJvdGVjdGVkIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudDtcclxuXHJcblx0Y29uc3RydWN0b3IoY29udHJvbGxlcjogUXVlcnlDb250cm9sbGVyLCBwYXJlbnRFbDogSFRNTEVsZW1lbnQpIHtcclxuXHRcdHN1cGVyKGNvbnRyb2xsZXIpO1xyXG5cdFx0dGhpcy5jb250YWluZXJFbCA9IHBhcmVudEVsLmNyZWF0ZURpdignYmFzZS1tZXJtYWlkLXZpZXcnKTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBvbkRhdGFVcGRhdGVkKCk6IHZvaWQge1xyXG5cdFx0dGhpcy5jb250YWluZXJFbC5lbXB0eSgpO1xyXG5cdFx0dGhpcy5yZW5kZXIoKS5jYXRjaCgoZXJyb3IpID0+IHtcclxuXHRcdFx0Y29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlbmRlciBNZXJtYWlkJywgZXJyb3IpO1xyXG5cdFx0XHR0aGlzLmNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblx0XHRcdHRoaXMuY29udGFpbmVyRWwuY3JlYXRlRGl2KHt0ZXh0OiAnRXJyb3IgcmVuZGVyaW5nIE1lcm1haWQuIFNlZSBjb25zb2xlIGZvciBkZXRhaWxzLid9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0cHJvdGVjdGVkIGFic3RyYWN0IHJlbmRlcigpOiBQcm9taXNlPHZvaWQ+O1xyXG5cclxuXHRwcm90ZWN0ZWQgYXN5bmMgcmVuZGVyTWVybWFpZChtZXJtYWlkQ29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcblx0XHRjb25zdCByYXdDb25maWcgPSB0aGlzLmNvbmZpZy5nZXQoJ21lcm1haWRDb25maWcnKTtcclxuXHRcdGNvbnN0IGNvbmZpZ0Jsb2NrID0gdHlwZW9mIHJhd0NvbmZpZyA9PT0gJ3N0cmluZycgPyByYXdDb25maWcudHJpbSgpIDogJyc7XHJcblxyXG5cdFx0bWVybWFpZENvZGUgPSBtZXJtYWlkQ29kZS50cmltKCk7XHJcblx0XHRpZiAoY29uZmlnQmxvY2subGVuZ3RoID4gMClcclxuXHRcdFx0bWVybWFpZENvZGUgPSBgJHtjb25maWdCbG9ja31cXG4ke21lcm1haWRDb2RlfWA7XHJcblxyXG5cdFx0Y29uc3QgbWFya2Rvd246IHN0cmluZyA9IGBcXGBcXGBcXGBtZXJtYWlkXFxuJHttZXJtYWlkQ29kZX1cXG5cXGBcXGBcXGBgO1xyXG5cclxuXHRcdGNvbnN0IHNvdXJjZVBhdGggPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpPy5wYXRoID8/ICcnO1xyXG5cclxuXHRcdGF3YWl0IE1hcmtkb3duUmVuZGVyZXIucmVuZGVyKFxyXG5cdFx0XHR0aGlzLmFwcCxcclxuXHRcdFx0bWFya2Rvd24sXHJcblx0XHRcdHRoaXMuY29udGFpbmVyRWwsXHJcblx0XHRcdHNvdXJjZVBhdGgsXHJcblx0XHRcdHRoaXNcclxuXHRcdCk7XHJcblxyXG5cdFx0dGhpcy5ob29rVXBJbnRlcm5hbExpbmtzKHRoaXMuY29udGFpbmVyRWwsIHNvdXJjZVBhdGgpO1xyXG5cdH1cclxuXHJcblx0cHJvdGVjdGVkIGhvb2tVcEludGVybmFsTGlua3MoY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LCBzb3VyY2VQYXRoOiBzdHJpbmcpIHtcclxuXHRcdGNvbnN0IGFwcCA9IHRoaXMuYXBwO1xyXG5cclxuXHRcdGNvbnRhaW5lckVsXHJcblx0XHRcdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxBbmNob3JFbGVtZW50PignYS5pbnRlcm5hbC1saW5rJylcclxuXHRcdFx0LmZvckVhY2goKGVsKSA9PiB7XHJcblx0XHRcdFx0Y29uc3QgZ2V0TGlua1RleHQgPSAoKSA9PiBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaHJlZicpIHx8IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG5cclxuXHRcdFx0XHQvLyBIb3ZlciBwcmV2aWV3XHJcblx0XHRcdFx0dGhpcy5yZWdpc3RlckRvbUV2ZW50KGVsLCAnbW91c2VvdmVyJywgKGV2dDogTW91c2VFdmVudCkgPT4ge1xyXG5cdFx0XHRcdFx0Y29uc3QgbGlua3RleHQgPSBnZXRMaW5rVGV4dCgpO1xyXG5cdFx0XHRcdFx0aWYgKCFsaW5rdGV4dCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRcdGFwcC53b3Jrc3BhY2UudHJpZ2dlcignaG92ZXItbGluaycsIHtcclxuXHRcdFx0XHRcdFx0ZXZlbnQ6IGV2dCxcclxuXHRcdFx0XHRcdFx0c291cmNlOiAncHJldmlldycsXHJcblx0XHRcdFx0XHRcdGhvdmVyUGFyZW50OiB7aG92ZXJQb3BvdmVyOiBudWxsfSxcclxuXHRcdFx0XHRcdFx0dGFyZ2V0RWw6IGVsLFxyXG5cdFx0XHRcdFx0XHRsaW5rdGV4dCxcclxuXHRcdFx0XHRcdFx0c291cmNlUGF0aCxcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHQvLyBMZWZ0IGNsaWNrXHJcblx0XHRcdFx0dGhpcy5yZWdpc3RlckRvbUV2ZW50KGVsLCAnY2xpY2snLCAoZXZ0OiBNb3VzZUV2ZW50KSA9PiB7XHJcblx0XHRcdFx0XHRpZiAoZXZ0LmJ1dHRvbiAhPT0gMCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRcdGNvbnN0IGxpbmt0ZXh0ID0gZ2V0TGlua1RleHQoKTtcclxuXHRcdFx0XHRcdGlmICghbGlua3RleHQpIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdFx0XHRhcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChcclxuXHRcdFx0XHRcdFx0bGlua3RleHQsXHJcblx0XHRcdFx0XHRcdHNvdXJjZVBhdGgsXHJcblx0XHRcdFx0XHRcdEtleW1hcC5pc01vZEV2ZW50KGV2dClcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdC8vIE1pZGRsZSBjbGlja1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJEb21FdmVudChlbCwgJ2F1eGNsaWNrJywgKGV2dDogTW91c2VFdmVudCkgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKGV2dC5idXR0b24gIT09IDEpIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHRjb25zdCBsaW5rdGV4dCA9IGdldExpbmtUZXh0KCk7XHJcblx0XHRcdFx0XHRpZiAoIWxpbmt0ZXh0KSByZXR1cm47XHJcblxyXG5cdFx0XHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRcdFx0YXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQobGlua3RleHQsIHNvdXJjZVBhdGgsICd0YWInKTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0Ly8gUmlnaHQgY2xpY2tcclxuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyRG9tRXZlbnQoZWwsICdjb250ZXh0bWVudScsIGFzeW5jIChldnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuXHRcdFx0XHRcdGNvbnN0IGxpbmt0ZXh0ID0gZ2V0TGlua1RleHQoKTtcclxuXHRcdFx0XHRcdGlmICghbGlua3RleHQpIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcblx0XHRcdFx0XHRjb25zdCBmaWxlID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QobGlua3RleHQsIHNvdXJjZVBhdGgpO1xyXG5cdFx0XHRcdFx0aWYgKCFmaWxlKSB7XHJcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UoYEZpbGUgbm90IGZvdW5kIGZvciBsaW5rOiAke2xpbmt0ZXh0fWApO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgbWVudSA9IG5ldyBNZW51KCk7XHJcblx0XHRcdFx0XHRtZW51LmFkZEl0ZW0oKGl0ZW0pID0+XHJcblx0XHRcdFx0XHRcdGl0ZW1cclxuXHRcdFx0XHRcdFx0XHQuc2V0VGl0bGUoJ09wZW4gaW4gbmV3IHRhYicpXHJcblx0XHRcdFx0XHRcdFx0LnNldEljb24oJ2ZpbGUtcGx1cycpXHJcblx0XHRcdFx0XHRcdFx0LnNldFNlY3Rpb24oJ29wZW4nKVxyXG5cdFx0XHRcdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcclxuXHRcdFx0XHRcdFx0XHRcdGFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KGxpbmt0ZXh0LCBzb3VyY2VQYXRoLCAndGFiJyk7XHJcblx0XHRcdFx0XHRcdFx0fSksXHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0bWVudS5hZGRJdGVtKChpdGVtKSA9PlxyXG5cdFx0XHRcdFx0XHRpdGVtXHJcblx0XHRcdFx0XHRcdFx0LnNldFRpdGxlKCdPcGVuIHRvIHRoZSByaWdodCcpXHJcblx0XHRcdFx0XHRcdFx0LnNldEljb24oJ3NlcGFyYXRvci12ZXJ0aWNhbCcpXHJcblx0XHRcdFx0XHRcdFx0LnNldFNlY3Rpb24oJ29wZW4nKVxyXG5cdFx0XHRcdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcclxuXHRcdFx0XHRcdFx0XHRcdGFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KGxpbmt0ZXh0LCBzb3VyY2VQYXRoLCAnc3BsaXQnKTtcclxuXHRcdFx0XHRcdFx0XHR9KSxcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRtZW51LmFkZEl0ZW0oKGl0ZW0pID0+XHJcblx0XHRcdFx0XHRcdGl0ZW1cclxuXHRcdFx0XHRcdFx0XHQuc2V0VGl0bGUoJ1JlbmFtZS4uLicpXHJcblx0XHRcdFx0XHRcdFx0LnNldEljb24oJ3BlbmNpbC1saW5lJylcclxuXHRcdFx0XHRcdFx0XHQuc2V0U2VjdGlvbignYWN0aW9uJylcclxuXHRcdFx0XHRcdFx0XHQub25DbGljaygoKSA9PiB7XHJcblx0XHRcdFx0XHRcdFx0XHRhcHAud29ya3NwYWNlLnRyaWdnZXIoJ3JlbmFtZScsIGZpbGUpOy8vVE9ETzogZml4IHRoaXMgbm90IHdvcmtpbmcgKHdoeSBoYXZlIHRvIHJlaW1wbGVtZW50IGl0IGFueXdheXM/KVxyXG5cdFx0XHRcdFx0XHRcdH0pLFxyXG5cdFx0XHRcdFx0KTtcclxuXHJcblx0XHRcdFx0XHQvL1RPRE86IGFkZCBcIkNvcHkgLSBjb3B5XCIgdGhhdCBjb3BpZXMgbm90IG5hbWUgdG8gc2VjdGlvbiBcImNsaXBib2FyZFwiXHJcblx0XHRcdFx0XHQvL1RPRE86IHJlbW92ZSBtZXJnZSBlbnRpcmUgZmlsZSB3aXRoLi4uXHJcblxyXG5cdFx0XHRcdFx0YXBwLndvcmtzcGFjZS50cmlnZ2VyKCdmaWxlLW1lbnUnLCBtZW51LCBmaWxlKTtcclxuXHRcdFx0XHRcdG1lbnUuc2hvd0F0TW91c2VFdmVudChldnQpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHByb3RlY3RlZCBnZXRMYWJlbFdpdGhQcm9wZXJ0aWVzKGZpbGU6IFRGaWxlLCBzaG93UHJvcGVydHlOYW1lczogQm9vbGVhbiwgbmV3TGluZTogc3RyaW5nLCBjb2xvbjogc3RyaW5nKTogc3RyaW5nIHtcclxuXHRcdGZvciAoY29uc3QgZ3JvdXAgb2YgdGhpcy5kYXRhLmdyb3VwZWREYXRhKSB7XHJcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZ3JvdXAuZW50cmllcykge1xyXG5cclxuXHRcdFx0XHRpZiAoZW50cnkuZmlsZSAhPSBmaWxlKSBjb250aW51ZTtcclxuXHJcblx0XHRcdFx0bGV0IGxhYmVsID0gXCJcIjtcclxuXHJcblx0XHRcdFx0bGV0IGlzRmlyc3QgPSB0cnVlO1xyXG5cdFx0XHRcdGZvciAoY29uc3QgcHJvcGVydHkgb2YgdGhpcy5kYXRhLnByb3BlcnRpZXMpIHtcclxuXHRcdFx0XHRcdGNvbnN0IHZhbHVlID0gZW50cnkuZ2V0VmFsdWUocHJvcGVydHkpO1xyXG5cdFx0XHRcdFx0aWYgKCF2YWx1ZSkgY29udGludWU7XHJcblxyXG5cdFx0XHRcdFx0aWYgKGlzRmlyc3QpXHJcblx0XHRcdFx0XHRcdGlzRmlyc3QgPSBmYWxzZTtcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0bGFiZWwgKz0gbmV3TGluZTtcclxuXHJcblx0XHRcdFx0XHRpZiAoc2hvd1Byb3BlcnR5TmFtZXMgJiYgcHJvcGVydHkgIT0gXCJmaWxlLm5hbWVcIiAmJiBwcm9wZXJ0eSAhPSBcImZpbGUuYmFzZW5hbWVcIilcclxuXHRcdFx0XHRcdFx0bGFiZWwgKz0gYCR7cGFyc2VQcm9wZXJ0eUlkKHByb3BlcnR5KS5uYW1lfSR7Y29sb259IGA7XHJcblxyXG5cdFx0XHRcdFx0bGFiZWwgKz0gdmFsdWU7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAobGFiZWwgPT0gXCJcIilcclxuXHRcdFx0XHRcdHJldHVybiBmaWxlLmJhc2VuYW1lO1xyXG5cdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdHJldHVybiBsYWJlbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBmaWxlLmJhc2VuYW1lO1xyXG5cdH07XHJcbn1cclxuIl19