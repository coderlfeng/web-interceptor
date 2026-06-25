import { LitElement, html } from 'lit';
import { createInterceptorRuleGroup } from '../shared/interceptor-rules';

const INPUT_CLASS =
  'input w-full min-w-0 max-w-full rounded-field p-3 text-[13px] text-base-content outline-none transition-shadow placeholder:text-base-content/50 focus:border-primary focus:ring-3 focus:ring-primary/20';
const PRIMARY_BUTTON_CLASS =
  'btn btn-primary btn-sm rounded-field px-3.5 py-2 text-xs font-bold transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-55';

export class GroupAddForm extends LitElement {
  static properties = {
    error: { state: true },
    groupName: { state: true },
    saving: { state: true },
  };

  private error = '';

  private groupName = '';

  private saving = false;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    document.documentElement.dataset.theme = 'light';
  }

  render() {
    return html`
      <main class="grid min-h-screen min-w-0 content-start gap-4 bg-base-100 p-5 text-base-content [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
        <header class="grid gap-1">
          <h1 class="m-0 text-lg font-bold tracking-[-0.03em]">添加分组</h1>
          <p class="m-0 text-xs text-base-content/50">创建一个新的 Mock 规则分组。</p>
        </header>

        <form class="grid min-w-0 gap-3" @submit=${this.createGroup}>
          <label class="grid gap-2 text-xs font-semibold text-base-content">
            Group name
            <input
              class=${INPUT_CLASS}
              .value=${this.groupName}
              @input=${this.updateGroupName}
              placeholder="用户相关"
              autofocus
            />
          </label>

          ${this.error ? html`<div class="alert alert-error rounded-field px-3 py-[11px] text-[13px]">${this.error}</div>` : null}

          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm rounded-field px-3.5 py-2 text-xs font-bold" type="button" @click=${this.closeWindow}>
              Cancel
            </button>
            <button class=${PRIMARY_BUTTON_CLASS} type="submit" ?disabled=${this.saving}>
              ${this.saving ? 'Saving' : 'Add group'}
            </button>
          </div>
        </form>
      </main>
    `;
  }

  private async createGroup(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.saving = true;
    this.error = '';

    try {
      await createInterceptorRuleGroup({ name: this.groupName, enabled: true });
      await this.closeWindow();
    } catch (error) {
      this.error = error instanceof Error ? error.message : '分组保存失败';
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

  private updateGroupName(event: Event): void {
    this.groupName = (event.target as HTMLInputElement).value;
  }
}

customElements.define('group-add-form', GroupAddForm);

declare global {
  interface HTMLElementTagNameMap {
    'group-add-form': GroupAddForm;
  }
}
