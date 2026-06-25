import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import {
  INTERCEPTOR_RULE_GROUPS_STORAGE_KEY,
  getInterceptorRuleGroups,
  type InterceptorRuleGroup,
} from '../../shared/interceptor-rules';

const EMPTY_CLASS = 'card card-sm border border-dashed border-base-content/15 bg-base-200/60 p-6 text-center text-sm text-base-content/50 shadow-inner shadow-base-content/5';

export class GroupsPage extends LitElement {
  private groups: InterceptorRuleGroup[] = [];

  private loading = true;

  private query = '';

  private handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName === 'local' && changes[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY]) {
      void this.loadGroups();
    }
  };

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    chrome.storage.onChanged.addListener(this.handleStorageChange);
    void this.loadGroups();
  }

  disconnectedCallback() {
    chrome.storage.onChanged.removeListener(this.handleStorageChange);
    super.disconnectedCallback();
  }

  render() {
    return html`
      <main class="mt-4 grid min-w-0 gap-4">
        <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-[360px]:grid-cols-1">
          <label class="input input-sm flex w-full min-w-0 items-center gap-2 bg-base-200/70 shadow-inner shadow-base-content/5">
            <svg class="h-4 w-4 shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <input class="grow text-xs font-semibold" type="text" placeholder="搜索分组名称" aria-label="搜索分组名称" .value=${this.query} @blur=${this.handleSearch} @keydown=${this.handleKeydown} />
          </label>
          <span class="badge badge-soft gap-2 whitespace-nowrap py-3 text-[11px] font-bold text-base-content/60">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 7h10M9 12h8M11 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            按名称排序
          </span>
        </div>

        <section class="grid min-w-0 gap-3" aria-label="Mock rule groups">
          ${this.renderGroups()}
        </section>
      </main>
    `;
  }

  private renderGroups() {
    if (this.loading) {
      return html`<div class="${EMPTY_CLASS}">Loading groups...</div>`;
    }

    const filtered = this.query
      ? this.groups.filter((g) => g.name.toLowerCase().includes(this.query.toLowerCase()))
      : this.groups;

    if (filtered.length === 0) {
      return html`<div class="${EMPTY_CLASS}">${this.groups.length === 0 ? '还没有分组。先创建一个分组，再向其中添加 mock rule。' : '没有匹配的分组。'}</div>`;
    }

    return html`
      <div class="grid min-w-0 gap-3">
        ${repeat(
          filtered,
          (group) => group.id,
          (group) => html`<group-display .group=${group} @groups-changed=${this.loadGroups}></group-display>`,
        )}
      </div>
    `;
  }

  private async loadGroups(): Promise<void> {
    this.loading = true;
    this.groups = await getInterceptorRuleGroups();
    this.loading = false;
    this.requestUpdate();
  }

  private handleSearch(e: Event): void {
    this.query = (e.target as HTMLInputElement).value;
    this.requestUpdate();
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.query = (e.target as HTMLInputElement).value;
      this.requestUpdate();
    }
  }
}

customElements.define('groups-page', GroupsPage);

declare global {
  interface HTMLElementTagNameMap {
    'groups-page': GroupsPage;
  }
}
