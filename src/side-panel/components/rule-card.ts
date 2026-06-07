import { LitElement, html } from 'lit';
import type { HttpMethod } from '../../shared/interceptor-rules';

const METHOD_BADGE_CLASS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  POST: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300',
  PUT: 'bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300',
  PATCH: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300',
  DELETE: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
};

export class RuleCard extends LitElement {
  static properties = {
    name: { type: String },
    method: { type: String },
    path: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  name = '';

  method: HttpMethod = 'GET';

  path = '';

  disabled = false;

  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <article
        class="grid min-w-0 gap-3 rounded-[16px] border border-[var(--app-surface-border)] bg-[var(--app-surface)] p-3 shadow-[0_10px_24px_rgba(74,39,156,0.05)] ${this
          .disabled
          ? 'opacity-60'
          : ''}"
      >
        <div class="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-start gap-3">
          <span class="rounded-[9px] px-2 py-1 text-center font-mono text-[11px] font-bold ${METHOD_BADGE_CLASS[this.method]}">
            ${this.method}
          </span>
          <div class="min-w-0">
            <h3 class="m-0 wrap-anywhere text-sm font-bold text-[var(--app-text-primary)]">${this.name}</h3>
            <div class="mt-1 wrap-anywhere font-mono text-xs text-[var(--app-text-secondary)]">${this.path}</div>
          </div>
        </div>
        <div class="grid min-w-0 gap-3 pl-0 min-[360px]:pl-[76px]">
          <slot></slot>
        </div>
      </article>
    `;
  }
}

customElements.define('web-api-rule', RuleCard);

declare global {
  interface HTMLElementTagNameMap {
    'web-api-rule': RuleCard;
  }
}
