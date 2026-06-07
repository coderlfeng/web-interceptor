import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import {
  HTTP_METHODS,
  addRuleToGroup,
  createInterceptorRuleGroup,
  deleteInterceptorRule,
  deleteInterceptorRuleGroup,
  flattenInterceptorRules,
  getEnabledInterceptorRules,
  getInterceptorRuleGroups,
  toggleInterceptorRuleGroup,
  updateInterceptorRule,
  type HttpMethod,
  type InterceptorRule,
  type InterceptorRuleGroup,
} from '../../shared/interceptor-rules';
import { navigate } from '../router';

const DEFAULT_MOCK_BODY = `{
  "ok": true,
  "source": "web-api-interceptor"
}`;

const PANEL_CLASS =
  'grid min-w-0 gap-3 rounded-[22px] border border-[var(--app-surface-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-card-shadow)] backdrop-blur-xl';
const FORM_CLASS = 'grid min-w-0 gap-3';
const SECTION_TITLE_CLASS = 'm-0 text-base font-extrabold tracking-[-0.03em] text-[var(--app-text-primary)]';
const LABEL_CLASS = 'grid gap-2 text-xs font-semibold text-[var(--app-text-primary)]';
const INPUT_CLASS =
  'w-full min-w-0 max-w-full appearance-none rounded-[14px] border border-[var(--app-input-border)] bg-[var(--app-input-bg)] p-3 font-mono text-[13px] text-[var(--app-text-primary)] outline-none transition-shadow placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-focus-border)] focus:ring-3 focus:ring-[var(--app-focus-ring)]';
const BUTTON_CLASS =
  'justify-self-start cursor-pointer appearance-none rounded-[13px] border border-[var(--app-button-border)] bg-[var(--app-button-bg)] px-3.5 py-2 text-xs font-bold text-[var(--app-text-primary)] transition-colors hover:border-[var(--app-accent)] hover:bg-[var(--app-accent)] hover:text-[var(--app-accent-text)] max-[320px]:w-full max-[320px]:justify-self-stretch max-[320px]:text-center disabled:cursor-not-allowed disabled:opacity-55';
const PRIMARY_BUTTON_CLASS = `${BUTTON_CLASS} border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-text)] shadow-[0_14px_26px_rgba(124,58,237,0.24)]`;
const DANGER_BUTTON_CLASS = `${BUTTON_CLASS} border-[var(--app-danger-border)] text-[var(--app-danger-text)] hover:border-[var(--app-danger-border)] hover:bg-[var(--app-danger-bg)] hover:text-[var(--app-danger-text)]`;
const ACTIONS_CLASS = 'flex min-w-0 flex-wrap gap-2.5 max-[320px]:grid max-[320px]:grid-cols-1';
const EMPTY_CLASS =
  'rounded-[18px] border border-dashed border-[var(--app-input-border)] bg-[var(--app-surface-soft)] p-5 text-center text-sm text-[var(--app-text-muted)]';

export class RequestsPage extends LitElement {
  private groups: InterceptorRuleGroup[] = [];

  private loading = true;

  private saving = false;

  private error = '';

  private groupName = 'Default';

  private selectedGroupId = 0;

  private name = 'Mock users';

  private urlFilter = 'jsonplaceholder.typicode.com/users/1';

  private method: HttpMethod = 'GET';

  private mockBody = DEFAULT_MOCK_BODY;

  private enabled = true;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    void this.loadGroups();
  }

  render() {
    const allRules = flattenInterceptorRules(this.groups);
    const activeRules = getEnabledInterceptorRules(this.groups);
    const disabledRules = allRules.length - activeRules.length;

    return html`
      <main class="mt-4 grid min-w-0 gap-4">
        <header class="flex min-w-0 items-center gap-3 border-b border-[var(--app-surface-border)] pb-4">
          <button
            class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--app-text-primary)] transition-colors hover:bg-[var(--app-button-bg)]"
            type="button"
            @click=${() => navigate('/')}
            aria-label="Back home"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div class="min-w-0 flex-1">
            <h1 class="m-0 truncate text-xl font-extrabold tracking-[-0.04em] text-[var(--app-text-primary)]">规则管理</h1>
            <p class="m-0 mt-1 text-xs text-[var(--app-text-muted)]">
              ${this.groups.length} groups · ${activeRules.length} 启用 · ${disabledRules} 禁用 · ${allRules.length} 总数
            </p>
          </div>
          <button class="${PRIMARY_BUTTON_CLASS} shrink-0" type="button" @click=${this.focusGroupName}>+ 添加分组</button>
        </header>

        <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-[360px]:grid-cols-1">
          <div
            class="flex min-w-0 items-center gap-2 rounded-[16px] border border-[var(--app-input-border)] bg-[var(--app-input-bg)] px-3 py-3 text-sm text-[var(--app-text-muted)]"
          >
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="truncate">搜索分组名称</span>
          </div>
          <span class="flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-[var(--app-text-secondary)]">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 7h10M9 12h8M11 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            按名称排序
          </span>
        </div>

        <section class="${PANEL_CLASS}" aria-label="Create mock group">
          <h2 class="${SECTION_TITLE_CLASS}">添加分组</h2>
          <form class="${FORM_CLASS}" @submit=${this.createGroup}>
            <label class="${LABEL_CLASS}">
              Group name
              <input id="group-name-input" class="${INPUT_CLASS}" .value=${this.groupName} @input=${this.updateGroupName} placeholder="用户相关" />
            </label>
            <button class="${PRIMARY_BUTTON_CLASS}" type="submit" ?disabled=${this.saving}>Add group</button>
          </form>
        </section>

        <section class="grid min-w-0 gap-3" aria-label="Mock rule groups">
          ${this.renderGroups()}
        </section>

        <section class="${PANEL_CLASS}" aria-label="Create mock rule">
          <h2 class="${SECTION_TITLE_CLASS}">添加规则</h2>
          <form class="${FORM_CLASS}" @submit=${this.createRule}>
            <label class="${LABEL_CLASS}">
              Group
              <select
                class="${INPUT_CLASS}"
                .value=${String(this.selectedGroupId)}
                @change=${this.updateSelectedGroup}
                ?disabled=${this.groups.length === 0}
              >
                ${this.groups.map((group) => html`<option value=${group.id}>${group.name}</option>`)}
              </select>
              <span class="text-[11px] leading-normal text-[var(--app-text-muted)]">
                规则必须创建在分组下；没有分组时请先创建分组。
              </span>
            </label>

            <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(94px,112px)] gap-3 max-[320px]:grid-cols-1">
              <label class="${LABEL_CLASS}">
                Rule name
                <input class="${INPUT_CLASS}" .value=${this.name} @input=${this.updateName} placeholder="Mock users" />
              </label>
              <label class="${LABEL_CLASS}">
                Method
                <select class="${INPUT_CLASS}" .value=${this.method} @change=${this.updateMethod}>
                  ${HTTP_METHODS.map((method) => html`<option value=${method}>${method}</option>`)}
                </select>
              </label>
            </div>

            <label class="${LABEL_CLASS}">
              URL filter
              <input
                class="${INPUT_CLASS}"
                .value=${this.urlFilter}
                @input=${this.updateUrlFilter}
                placeholder="example.com/api/users"
              />
              <span class="text-[11px] leading-normal text-[var(--app-text-muted)]">
                使用 Chrome DNR URL filter；例如 example.com/api/users/1 或 |https://api.example.com/users。
              </span>
            </label>

            <label class="${LABEL_CLASS}">
              Mock JSON
              <textarea class="${INPUT_CLASS} min-h-[126px] resize-y" .value=${this.mockBody} @input=${this.updateMockBody}></textarea>
            </label>

            <label class="${LABEL_CLASS} flex items-center justify-between gap-2.5 max-[320px]:items-stretch max-[320px]:flex-col">
              Enabled
              <input
                class="h-[18px] w-[18px] accent-[var(--app-accent)]"
                type="checkbox"
                .checked=${this.enabled}
                @change=${this.updateEnabled}
              />
            </label>

            ${this.error
              ? html`
                  <div
                    class="rounded-[14px] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)] px-3 py-[11px] text-[13px] text-[var(--app-danger-text)]"
                  >
                    ${this.error}
                  </div>
                `
              : null}

            <div class="${ACTIONS_CLASS}">
              <button class="${PRIMARY_BUTTON_CLASS}" type="submit" ?disabled=${this.saving || this.groups.length === 0}>
                ${this.saving ? 'Saving' : 'Add rule'}
              </button>
              <button class="${BUTTON_CLASS}" type="button" @click=${() => navigate('/')}>Back home</button>
            </div>
          </form>
        </section>
      </main>
    `;
  }

  private renderGroups() {
    if (this.loading) {
      return html`<div class="${EMPTY_CLASS}">Loading groups...</div>`;
    }

    if (this.groups.length === 0) {
      return html`<div class="${EMPTY_CLASS}">还没有分组。先创建一个分组，再向其中添加 mock rule。</div>`;
    }

    return html`
      <div class="grid min-w-0 gap-3">
        ${repeat(
          this.groups,
          (group) => group.id,
          (group) => this.renderGroup(group),
        )}
      </div>
    `;
  }

  private renderGroup(group: InterceptorRuleGroup) {
    const enabledCount = group.enabled ? group.rules.filter((rule) => rule.enabled).length : 0;
    const disabledCount = group.rules.length - enabledCount;

    return html`
      <article
        class="overflow-hidden rounded-[22px] border border-[var(--app-surface-border)] bg-[var(--app-surface-raised)] shadow-[0_14px_34px_rgba(74,39,156,0.07)] ${group.enabled
          ? ''
          : 'opacity-60'}"
      >
        <div class="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3 p-4">
          <span class="grid h-11 w-11 place-items-center rounded-[14px] bg-violet-100 text-violet-600 shadow-[0_10px_20px_rgba(124,58,237,0.12)] dark:bg-violet-400/15 dark:text-violet-200">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H10l2 2h5.5A2.5 2.5 0 0 1 20 10.5v5A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-7Z" fill="currentColor" opacity="0.22" />
              <path d="M8 13h8M8 15h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </span>
          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-2">
              <h3 class="m-0 truncate text-base font-extrabold tracking-[-0.03em] text-[var(--app-text-primary)]">${group.name}</h3>
              <span class="rounded-[8px] bg-[var(--app-button-bg)] px-2 py-0.5 text-xs font-bold text-[var(--app-text-secondary)]">
                ${group.rules.length}
              </span>
            </div>
            <div class="mt-1 text-xs text-[var(--app-text-muted)]">${group.name} 管理相关接口</div>
          </div>
          <button class="rounded-full p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-button-bg)]" type="button" @click=${() => this.deleteGroup(group)} aria-label="Delete group">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 6.5v.01M12 12v.01M12 17.5v.01" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="mx-4 border-t border-[var(--app-surface-border)]"></div>

        <div class="flex items-center justify-between gap-3 p-4 text-xs text-[var(--app-text-muted)] max-[340px]:flex-col max-[340px]:items-stretch">
          <div class="flex min-w-0 flex-wrap items-center gap-3">
            <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>启用 ${enabledCount}</span>
            <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-orange-400"></span>禁用 ${disabledCount}</span>
            <span>总数 ${group.rules.length}</span>
          </div>
          <button class="flex items-center gap-1 self-end font-semibold text-[var(--app-text-secondary)]" type="button" @click=${() => this.toggleGroup(group)}>
            ${group.enabled ? 'Disable' : 'Enable'}
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        ${group.rules.length === 0
          ? null
          : html`
              <div class="grid min-w-0 gap-2 border-t border-[var(--app-surface-border)] p-3">
                ${repeat(
                  group.rules,
                  (rule) => rule.id,
                  (rule) => this.renderRule(group, rule),
                )}
              </div>
            `}
      </article>
    `;
  }

  private renderRule(group: InterceptorRuleGroup, rule: InterceptorRule) {
    const disabled = !group.enabled || !rule.enabled;

    return html`
      <web-api-rule .name=${rule.name} .method=${rule.method} .path=${rule.urlFilter} .disabled=${disabled}>
        <pre
          class="m-0 max-h-[180px] overflow-auto whitespace-pre-wrap break-words rounded-[12px] bg-[var(--app-code-bg)] p-2.5 font-mono text-xs leading-normal text-[var(--app-text-secondary)]"
        >${rule.mockBody}</pre>
        <div class="${ACTIONS_CLASS}">
          <button class="${BUTTON_CLASS}" type="button" @click=${() => this.toggleRule(group.id, rule)}>
            ${rule.enabled ? 'Disable rule' : 'Enable rule'}
          </button>
          <button class="${DANGER_BUTTON_CLASS}" type="button" @click=${() => this.deleteRule(group.id, rule.id)}>
            Delete rule
          </button>
        </div>
      </web-api-rule>
    `;
  }

  private async loadGroups(): Promise<void> {
    this.loading = true;
    this.groups = await getInterceptorRuleGroups();
    this.selectedGroupId = this.resolveSelectedGroupId();
    this.loading = false;
    this.requestUpdate();
  }

  private async createGroup(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.saving = true;
    this.error = '';
    this.requestUpdate();

    try {
      const group = await createInterceptorRuleGroup({ name: this.groupName, enabled: true });
      this.groupName = '';
      this.selectedGroupId = group.id;
      await this.loadGroups();
    } catch (error) {
      this.error = error instanceof Error ? error.message : '分组保存失败';
    } finally {
      this.saving = false;
      this.requestUpdate();
    }
  }

  private async createRule(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.saving = true;
    this.error = '';
    this.requestUpdate();

    try {
      if (!this.groups.some((group) => group.id === this.selectedGroupId)) {
        throw new Error('请先选择一个分组');
      }

      await addRuleToGroup(this.selectedGroupId, {
        name: this.name,
        urlFilter: this.urlFilter,
        method: this.method,
        mockBody: this.mockBody,
        enabled: this.enabled,
      });
      this.mockBody = DEFAULT_MOCK_BODY;
      await this.loadGroups();
    } catch (error) {
      this.error = error instanceof Error ? error.message : '规则保存失败';
    } finally {
      this.saving = false;
      this.requestUpdate();
    }
  }

  private async toggleGroup(group: InterceptorRuleGroup): Promise<void> {
    this.error = '';
    await toggleInterceptorRuleGroup(group.id, !group.enabled);
    await this.loadGroups();
  }

  private async deleteGroup(group: InterceptorRuleGroup): Promise<void> {
    if (!confirm(`删除分组 “${group.name}” 会同时删除其中 ${group.rules.length} 条规则，确认删除？`)) {
      return;
    }

    this.error = '';
    await deleteInterceptorRuleGroup(group.id);
    await this.loadGroups();
  }

  private async toggleRule(groupId: number, rule: InterceptorRule): Promise<void> {
    this.error = '';

    try {
      await updateInterceptorRule(groupId, rule.id, { enabled: !rule.enabled });
      await this.loadGroups();
    } catch (error) {
      this.error = error instanceof Error ? error.message : '规则更新失败';
      this.requestUpdate();
    }
  }

  private async deleteRule(groupId: number, ruleId: number): Promise<void> {
    this.error = '';
    await deleteInterceptorRule(groupId, ruleId);
    await this.loadGroups();
  }

  private resolveSelectedGroupId(): number {
    if (this.groups.some((group) => group.id === this.selectedGroupId)) {
      return this.selectedGroupId;
    }

    return this.groups[0]?.id ?? 0;
  }

  private focusGroupName(): void {
    this.querySelector<HTMLInputElement>('#group-name-input')?.focus();
  }

  private updateGroupName(event: Event): void {
    this.groupName = (event.target as HTMLInputElement).value;
  }

  private updateSelectedGroup(event: Event): void {
    this.selectedGroupId = Number((event.target as HTMLSelectElement).value);
  }

  private updateName(event: Event): void {
    this.name = (event.target as HTMLInputElement).value;
  }

  private updateUrlFilter(event: Event): void {
    this.urlFilter = (event.target as HTMLInputElement).value;
  }

  private updateMethod(event: Event): void {
    this.method = (event.target as HTMLSelectElement).value as HttpMethod;
  }

  private updateMockBody(event: Event): void {
    this.mockBody = (event.target as HTMLTextAreaElement).value;
  }

  private updateEnabled(event: Event): void {
    this.enabled = (event.target as HTMLInputElement).checked;
  }
}

customElements.define('requests-page', RequestsPage);

declare global {
  interface HTMLElementTagNameMap {
    'requests-page': RequestsPage;
  }
}
