import { LitElement, html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import folderSvg from '../../images/folder.svg?raw';
import {
    deleteInterceptorRuleGroup,
    toggleInterceptorRuleGroup,
    type InterceptorRuleGroup,
} from '../../shared/interceptor-rules';
import { navigate } from '../router';

const BUTTON_CLASS = 'btn btn-ghost btn-xs rounded-full font-bold text-base-content/70 hover:text-primary max-[320px]:btn-block';
const DANGER_BUTTON_CLASS = 'btn btn-ghost btn-xs rounded-full font-bold text-error hover:bg-error/10 max-[320px]:btn-block';

export class GroupDisplay extends LitElement {
    static properties = {
        group: { type: Object },
    };

    group?: InterceptorRuleGroup;

    protected createRenderRoot() {
        return this;
    }

    render() {
        if (!this.group) {
            return null;
        }

        const enabledCount = this.group.enabled ? this.group.rules.filter((rule) => rule.enabled).length : 0;
        const disabledCount = this.group.rules.length - enabledCount;

        return html`
      <article
        class="relative isolate overflow-hidden rounded-box border border-base-content/10 bg-base-200/65 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)] cursor-pointer ${this.group.enabled ? '' : 'opacity-60'}"
        @click=${this.handleCardClick}
      >
        <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 pl-5">
          <div class="min-w-0">
            <h3 class="m-0 flex items-center gap-1.5 truncate text-lg font-black tracking-[-0.06em] text-base-content">
              <div aria-label="success" class="status ${this.group.enabled ? 'status-success' : 'status-neutral'}"></div>
              <span class="inline-flex h-5 w-5 shrink-0">${unsafeHTML(folderSvg)}</span>
              ${this.group.name}
            </h3>
          </div>
        </div>

        <div class="stats w-full rounded-none border-y border-base-content/10 bg-base-100/45 text-xs shadow-none">
          ${this.renderGroupStat('总数', this.group.rules.length, 'text-base-content')}
          ${this.renderGroupStat('启用', enabledCount, 'text-success')}
          ${this.renderGroupStat('禁用', disabledCount, 'text-warning')}
        </div>

        <div class="flex flex-wrap gap-2 p-3 pl-5">
          <button class="${BUTTON_CLASS}" type="button" @click=${this.handleAddRuleClick}>Add rule</button>
          <button class="${BUTTON_CLASS}" type="button" @click=${this.toggleGroupClick}>
            ${this.group.enabled ? 'Disable group' : 'Enable group'}
          </button>
          <button class="${DANGER_BUTTON_CLASS}" type="button" @click=${this.deleteGroupClick}>Delete group</button>
        </div>
      </article>
    `;
    }

    private renderGroupStat(label: string, count: number, valueClass: string) {
        return html`
      <div class="stat min-w-0 p-3">
        <div class="stat-title text-[10px] font-black uppercase tracking-[0.2em] text-base-content/35 text-center mb-2">${label}</div>
        <div class="stat-value font-mono text-lg leading-none tracking-[-0.08em] text-center ${valueClass}">${count}</div>
      </div>
    `;
    }

    private handleAddRuleClick(event: Event): void {
        event.stopPropagation();

        if (!this.group) {
            return;
        }

        const width = 560;
        const height = screen.availHeight;
        const dpr = window.devicePixelRatio || 1;

        void chrome.windows.create({
            height,
            left: Math.round((screen.width - width * dpr) / 2),
            top: 0,
            type: 'popup',
            url: `add-rule.html?groupId=${this.group.id}`,
            width,
        });
    }

    private async deleteGroupClick(event: Event): Promise<void> {
        event.stopPropagation();

        if (!this.group || !confirm(`删除分组 "${this.group.name}" 会同时删除其中 ${this.group.rules.length} 条规则，确认删除？`)) {
            return;
        }

        await deleteInterceptorRuleGroup(this.group.id);
        this.dispatchGroupsChanged();
    }

    private async toggleGroupClick(event: Event): Promise<void> {
        event.stopPropagation();

        if (!this.group) {
            return;
        }

        await toggleInterceptorRuleGroup(this.group.id, !this.group.enabled);
        this.dispatchGroupsChanged();
    }

    private handleCardClick(): void {
        if (!this.group) return;
        navigate(`/group-rules?groupId=${this.group.id}`);
    }

    private dispatchGroupsChanged(): void {
        this.dispatchEvent(new CustomEvent('groups-changed', { bubbles: true, composed: true }));
    }
}

customElements.define('group-display', GroupDisplay);

declare global {
    interface HTMLElementTagNameMap {
        'group-display': GroupDisplay;
    }
}
