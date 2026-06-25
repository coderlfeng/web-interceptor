import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import {
  INTERCEPTOR_RULE_GROUPS_STORAGE_KEY,
  deleteInterceptorRule,
  getInterceptorRuleGroups,
  updateInterceptorRule,
  type InterceptorRule,
  type InterceptorRuleGroup,
} from '../../shared/interceptor-rules';
import { navigate } from '../router';

const METHOD_COLOR: Record<string, string> = {
  GET: 'badge-success',
  POST: 'badge-primary',
  PUT: 'badge-warning',
  PATCH: 'badge-info',
  DELETE: 'badge-error',
};

export class GroupRulesPage extends LitElement {
  static properties = { groupId: { state: true } };

  private groupId = 0;
  private group?: InterceptorRuleGroup;
  private loading = true;

  private handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === 'local' && changes[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY]) {
      void this.load();
    }
  };

  protected createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    this.groupId = Number(params.get('groupId') ?? 0);
    chrome.storage.onChanged.addListener(this.handleStorageChange);
    void this.load();
  }

  disconnectedCallback() {
    chrome.storage.onChanged.removeListener(this.handleStorageChange);
    super.disconnectedCallback();
  }

  render() {
    if (this.loading) {
      return html`
        <main class="mt-4 grid gap-3">
          ${[1,2,3].map(() => html`<div class="skeleton h-16 w-full rounded-box"></div>`)}
        </main>
      `;
    }

    if (!this.group) {
      return html`<main class="mt-4"><div class="alert alert-error">分组未找到</div></main>`;
    }

    return html`
      <main class="mt-4 grid gap-4">
        <div class="flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="m-0 truncate text-lg font-black tracking-[-0.04em] text-base-content">${this.group.name}</h2>
            <p class="m-0 mt-0.5 text-xs text-base-content/50">${this.group.rules.length} 条规则</p>
          </div>
        </div>

        ${this.group.rules.length === 0
          ? html`
            <div class="card card-sm border border-dashed border-base-content/15 bg-base-200/60 p-8 text-center shadow-inner shadow-base-content/5">
              <p class="text-sm font-medium text-base-content/50">该分组还没有规则</p>
              <p class="mt-1 text-xs text-base-content/35">点击「添加规则」开始创建</p>
            </div>
          `
          : html`
            <ul class="list rounded-box border border-base-content/8 bg-base-200/50 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              ${repeat(
                this.group.rules,
                (rule) => rule.id,
                (rule, i) => this.renderRule(rule, i),
              )}
            </ul>
          `}
      </main>
    `;
  }

  private renderRule(rule: InterceptorRule, index: number) {
    const disabled = !this.group!.enabled || !rule.enabled;

    return html`
      <li class="grid gap-1 px-3 py-2.5 transition-colors hover:bg-base-content/3 ${index === 0 ? '' : 'border-t border-base-content/8'}">
        <div class="flex min-w-0 items-center gap-2">
          <span class="badge badge-soft badge-sm font-mono font-bold w-14 shrink-0 justify-center ${METHOD_COLOR[rule.method] ?? 'badge-primary'}">
            ${rule.method}
          </span>
          <p class="m-0 min-w-0 truncate text-sm font-semibold text-base-content ${disabled ? 'opacity-40' : ''}" title=${rule.name}>${rule.name}</p>
        </div>

        <p class="m-0 min-w-0 truncate font-mono text-[11px] text-base-content/45 pl-0.5" title=${rule.urlFilter}>${rule.urlFilter}</p>

        <div class="flex items-center gap-1 pt-0.5">
          <div class="tooltip tooltip-right" data-tip="编辑规则">
            <button
              class="btn btn-ghost btn-xs rounded-lg px-2 text-[11px] text-base-content/50 hover:text-base-content"
              type="button"
              @click=${() => this.editRule(rule)}
              aria-label="编辑规则"
            >编辑</button>
          </div>
          <div class="tooltip tooltip-right" data-tip=${rule.enabled ? '禁用规则' : '启用规则'}>
            <button
              class="btn btn-ghost btn-xs rounded-lg px-2 text-[11px] text-base-content/50 hover:text-base-content"
              type="button"
              @click=${() => this.toggleRule(rule)}
              aria-label=${rule.enabled ? '禁用规则' : '启用规则'}
            >${rule.enabled ? '禁用' : '启用'}</button>
          </div>
          <div class="tooltip tooltip-right" data-tip="删除规则">
            <button
              class="btn btn-ghost btn-xs rounded-lg px-2 text-[11px] text-error/60 hover:text-error"
              type="button"
              @click=${() => this.deleteRule(rule.id)}
              aria-label="删除规则"
            >删除</button>
          </div>
        </div>
      </li>
    `;
  }

  private async load(): Promise<void> {
    this.loading = true;
    const groups = await getInterceptorRuleGroups();
    this.group = groups.find((g) => g.id === this.groupId);
    this.loading = false;
    this.requestUpdate();
  }

  private openRuleWindow(url: string): void {
    const width = 560;
    const height = screen.availHeight;
    const dpr = window.devicePixelRatio || 1;
    void chrome.windows.create({
      height,
      left: Math.round((screen.width - width * dpr) / 2),
      top: 0,
      type: 'popup',
      url,
      width,
    });
  }

  private editRule(rule: InterceptorRule): void {
    this.openRuleWindow(`add-rule.html?groupId=${this.groupId}&ruleId=${rule.id}`);
  }

  private async toggleRule(rule: InterceptorRule): Promise<void> {
    await updateInterceptorRule(this.groupId, rule.id, { enabled: !rule.enabled });
    await this.load();
  }

  private async deleteRule(ruleId: number): Promise<void> {
    if (!confirm('确认删除该规则？')) return;
    await deleteInterceptorRule(this.groupId, ruleId);
    await this.load();
  }
}

customElements.define('group-rules-page', GroupRulesPage);

declare global {
  interface HTMLElementTagNameMap {
    'group-rules-page': GroupRulesPage;
  }
}
