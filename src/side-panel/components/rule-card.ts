import { LitElement, html } from 'lit';
import type { HttpMethod } from '../../shared/interceptor-rules';

const METHOD_BADGE_CLASS: Record<HttpMethod, string> = {
  GET: 'badge-success',
  POST: 'badge-primary',
  PUT: 'badge-warning',
  PATCH: 'badge-info',
  DELETE: 'badge-error',
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
        class="card card-sm min-w-0 border border-base-content/10 bg-base-100/80 shadow-sm transition-colors hover:border-primary/20 ${this.disabled ? 'opacity-55' : ''}"
      >
        <div class="card-body min-w-0 gap-3">
          <div class="grid min-w-0 gap-2">
            <div class="flex min-w-0 items-start gap-2">
              <span class="badge badge-soft badge-sm shrink-0 font-mono text-[11px] font-black ${METHOD_BADGE_CLASS[this.method]}">
                ${this.method}
              </span>
              <div class="wrap-anywhere min-w-0 font-mono text-[11px] font-bold text-base-content/45">${this.path}</div>
            </div>
            <h3 class="card-title m-0 wrap-anywhere text-sm font-black tracking-[-0.04em] text-base-content">${this.name}</h3>
          </div>
          <div class="card-actions min-w-0 justify-start">
            <slot></slot>
          </div>
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
