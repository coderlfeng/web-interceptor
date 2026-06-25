import { LitElement, html } from 'lit';
import { HTTP_METHODS, addRuleToGroup, getInterceptorRuleGroups, updateInterceptorRule, type HttpMethod } from '../shared/interceptor-rules';

const DEFAULT_MOCK_BODY = `{
  "success": true,
  "code": "200",
  "message": null,
  "errorMsg": null,
  "result": null
}`;

const INPUT_CLASS =
  'input w-full min-w-0 max-w-full rounded-field p-3 font-mono text-[13px] text-base-content outline-none transition-shadow placeholder:text-base-content/50 focus:border-primary focus:ring-3 focus:ring-primary/20';
const PRIMARY_BUTTON_CLASS =
  'btn btn-primary btn-sm rounded-field px-3.5 py-2 text-xs font-bold transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-55';

export class AddRuleForm extends LitElement {
  static properties = {
    enabled: { state: true },
    error: { state: true },
    groupId: { state: true },
    method: { state: true },
    mockBody: { state: true },
    name: { state: true },
    saving: { state: true },
    urlFilter: { state: true },
  };

  private enabled = true;
  private error = '';
  private groupId = 0;
  private ruleId = 0;
  private method: HttpMethod = 'GET';
  private mockBody = DEFAULT_MOCK_BODY;
  private name = '';
  private saving = false;
  private urlFilter = '/delivery/workbench/api/v1/xxx';

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    document.documentElement.dataset.theme = 'light';
    const params = new URLSearchParams(window.location.search);
    this.groupId = Number(params.get('groupId') ?? 0);
    this.ruleId = Number(params.get('ruleId') ?? 0);
    void this.init();
  }

  private async init(): Promise<void> {
    const groups = await getInterceptorRuleGroups();
    const group = groups.find((g) => g.id === this.groupId);
    if (group) document.title = this.ruleId ? `${group.name}-编辑规则` : `${group.name}-添加规则`;
    if (this.ruleId) {
      const rule = group?.rules.find((r) => r.id === this.ruleId);
      if (rule) {
        this.name = rule.name;
        this.urlFilter = rule.urlFilter;
        this.method = rule.method;
        this.mockBody = rule.mockBody;
        this.enabled = rule.enabled;
      }
    }
  }

  render() {
    const missingGroup = !Number.isInteger(this.groupId) || this.groupId <= 0;

    return html`
      <main class="grid min-h-screen min-w-0 content-start gap-4 bg-base-100 p-5 text-base-content [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
        <header class="grid gap-1">
          <h1 class="m-0 text-lg font-bold tracking-[-0.03em]">${this.ruleId ? '编辑规则' : '添加规则'}</h1>
          <p class="m-0 text-xs text-base-content/50">${this.ruleId ? '修改当前规则的配置。' : '为当前分组创建一条新的 Mock 规则。'}</p>
        </header>

        <form class="grid min-w-0 gap-3" @submit=${this.createRule}>
          <label class="grid gap-2 text-xs font-semibold text-base-content">
            Rule name
            <input class=${INPUT_CLASS} .value=${this.name} @input=${this.updateName} placeholder="Mock users" />
          </label>

          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_112px] gap-3">
            <label class="grid gap-2 text-xs font-semibold text-base-content">
              URL filter
              <input class=${INPUT_CLASS} .value=${this.urlFilter} @input=${this.updateUrlFilter} placeholder="example.com/api/users" />
            </label>
            <label class="grid gap-2 text-xs font-semibold text-base-content">
              Method
              <select class=${INPUT_CLASS} .value=${this.method} @change=${this.updateMethod}>
                ${HTTP_METHODS.map((method) => html`<option value=${method}>${method}</option>`)}
              </select>
            </label>
          </div>

          <label class="grid gap-2 text-xs font-semibold text-base-content">
            <span class="flex items-center gap-1.5">
              Mock JSON
              <span class="relative group cursor-default">
                <svg class="h-3.5 w-3.5 text-base-content/40 hover:text-base-content/70 transition-colors" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M12 11v5M12 8h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                <div class="pointer-events-none absolute left-5 top-0 z-50 w-72 rounded-lg border border-base-content/10 bg-base-100 p-3 text-xs font-normal text-base-content shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <p class="m-0 mb-2 font-semibold">动态表达式语法</p>
                  <ul class="m-0 grid gap-1.5 pl-3 list-disc text-base-content/70 [&_code]:break-all">
                    <li>Faker：<code class="font-mono text-primary">&#123;&#123;faker.food.description()&#125;&#125;</code></li>
                    <li>Faker 带参（参数须合法 JSON）：<code class="font-mono text-primary">&#123;&#123;faker.number.int({"min":1,"max":100})&#125;&#125;</code></li>
                    <li>URL 路径参数（URL 含 <code class="font-mono">/api/&#123;id&#125;</code>）：<code class="font-mono text-primary">&#123;&#123;id&#125;&#125;</code></li>
                    <li>JS 表达式：<code class="font-mono text-primary">&#123;&#123;id + '_suffix'&#125;&#125;</code></li>
                  </ul>
                </div>
              </span>
            </span>
            <textarea class="${INPUT_CLASS} min-h-[126px] resize-y" .value=${this.mockBody} @input=${this.updateMockBody}></textarea>
          </label>

          <label class="flex items-center justify-between gap-2.5 text-xs font-semibold text-base-content">
            Enabled
            <input class="checkbox checkbox-primary h-[18px] w-[18px]" type="checkbox" .checked=${this.enabled} @change=${this.updateEnabled} />
          </label>

          ${missingGroup ? html`<div class="alert alert-error rounded-field px-3 py-[11px] text-[13px]">缺少有效分组，无法添加规则。</div>` : null}
          ${this.error ? html`<div class="alert alert-error rounded-field px-3 py-[11px] text-[13px]">${this.error}</div>` : null}

          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm rounded-field px-3.5 py-2 text-xs font-bold" type="button" @click=${this.closeWindow}>
              Cancel
            </button>
            <button class=${PRIMARY_BUTTON_CLASS} type="submit" ?disabled=${this.saving || missingGroup}>
              ${this.saving ? 'Saving' : (this.ruleId ? 'Save changes' : 'Add rule')}
            </button>
          </div>
        </form>
      </main>
    `;
  }

  private async createRule(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.saving = true;
    this.error = '';

    try {
      if (this.ruleId) {
        await updateInterceptorRule(this.groupId, this.ruleId, {
          enabled: this.enabled,
          method: this.method,
          mockBody: this.mockBody,
          name: this.name,
          urlFilter: this.urlFilter,
        });
      } else {
        await addRuleToGroup(this.groupId, {
          enabled: this.enabled,
          method: this.method,
          mockBody: this.mockBody,
          name: this.name,
          urlFilter: this.urlFilter,
        });
      }
      await this.closeWindow();
    } catch (error) {
      this.error = error instanceof Error ? error.message : '规则保存失败';
    } finally {
      this.saving = false;
    }
  }

  private async closeWindow(): Promise<void> {
    const currentWindow = await chrome.windows.getCurrent();

    if (currentWindow.id !== undefined) {
      await chrome.windows.remove(currentWindow.id);
      return;
    }

    window.close();
  }

  private updateEnabled(event: Event): void {
    this.enabled = (event.target as HTMLInputElement).checked;
  }

  private updateMethod(event: Event): void {
    this.method = (event.target as HTMLSelectElement).value as HttpMethod;
  }

  private updateMockBody(event: Event): void {
    this.mockBody = (event.target as HTMLTextAreaElement).value;
  }

  private updateName(event: Event): void {
    this.name = (event.target as HTMLInputElement).value;
  }

  private updateUrlFilter(event: Event): void {
    this.urlFilter = (event.target as HTMLInputElement).value;
  }
}

customElements.define('add-rule-form', AddRuleForm);

declare global {
  interface HTMLElementTagNameMap {
    'add-rule-form': AddRuleForm;
  }
}
