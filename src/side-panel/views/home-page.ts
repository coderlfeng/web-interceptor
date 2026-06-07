import { gsap } from 'gsap';
import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import {
  INTERCEPTOR_RULE_GROUPS_STORAGE_KEY,
  INTERCEPTOR_RULE_HITS_STORAGE_KEY,
  clearInterceptorRuleHits,
  flattenInterceptorRules,
  getEnabledInterceptorRules,
  getInterceptorRuleGroups,
  getInterceptorRuleHits,
  type InterceptorRule,
  type InterceptorRuleHit,
} from '../../shared/interceptor-rules';
import { navigate } from '../router';

const METHOD_BADGE_CLASS: Record<string, string> = {
  GET: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  POST: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300',
  PUT: 'bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300',
  PATCH: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300',
  DELETE: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
};

export class HomePage extends LitElement {
  private rules: InterceptorRule[] = [];

  private enabledRules: InterceptorRule[] = [];

  private hits: InterceptorRuleHit[] = [];

  private loading = true;

  private handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (
      areaName === 'local' &&
      (changes[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY] || changes[INTERCEPTOR_RULE_HITS_STORAGE_KEY])
    ) {
      void this.loadStats();
    }
  };

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    chrome.storage.onChanged.addListener(this.handleStorageChange);
    void this.loadStats();
  }

  disconnectedCallback() {
    chrome.storage.onChanged.removeListener(this.handleStorageChange);
    super.disconnectedCallback();
  }

  firstUpdated() {
    const title = this.renderRoot.querySelector('h1');

    if (!title) {
      return;
    }

    gsap.from(title, {
      autoAlpha: 0,
      duration: 1,
      ease: 'back.out(1.7)',
      rotation: -4,
      scale: 0.86,
      y: 34,
    });
  }

  render() {
    const disabledCount = this.rules.length - this.enabledRules.length;

    return html`
      <main class="mt-4 grid min-w-0 gap-5">
        <section
          class="relative isolate overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-600 via-violet-500 to-blue-600 p-5 text-white shadow-[0_24px_48px_rgba(96,49,220,0.28)]"
          aria-label="Rule statistics"
        >
          <div class="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl"></div>
          <div class="pointer-events-none absolute right-6 top-8 h-12 w-28 rounded-full border border-white/20 opacity-60 [transform:skewX(-18deg)]"></div>
          <div class="relative grid gap-4">
            <div class="flex items-center justify-between gap-3">
              <h1 class="m-0 text-xl font-extrabold tracking-[-0.04em]">总览</h1>
              <span class="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">Live Mock</span>
            </div>

            <div class="grid grid-cols-3 divide-x divide-violet-100/60 rounded-[18px] bg-white/95 p-4 text-center shadow-[0_18px_36px_rgba(31,21,95,0.16)] dark:bg-white/90">
              <div class="grid gap-1 px-1">
                <strong class="text-[30px] leading-none font-extrabold tracking-[-0.05em] text-violet-600">
                  ${this.loading ? '-' : this.rules.length}
                </strong>
                <span class="text-[11px] font-medium text-slate-500">所有规则</span>
              </div>
              <div class="grid gap-1 px-1">
                <strong class="text-[30px] leading-none font-extrabold tracking-[-0.05em] text-emerald-500">
                  ${this.loading ? '-' : this.enabledRules.length}
                </strong>
                <span class="text-[11px] font-medium text-slate-500">启用规则</span>
              </div>
              <div class="grid gap-1 px-1">
                <strong class="text-[30px] leading-none font-extrabold tracking-[-0.05em] text-rose-500">
                  ${this.loading ? '-' : disabledCount}
                </strong>
                <span class="text-[11px] font-medium text-slate-500">禁用规则</span>
              </div>
            </div>

            <button
              class="group grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 rounded-[18px] bg-white/14 p-3 text-left backdrop-blur transition-colors hover:bg-white/20"
              type="button"
              @click=${() => navigate('/requests')}
            >
              <span class="grid h-11 w-11 place-items-center rounded-[14px] bg-white/16 text-white shadow-inner">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2" />
                </svg>
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-bold">规则管理</span>
                <span class="mt-1 block truncate text-xs text-white/75">管理分组与规则，轻松配置 Mock</span>
              </span>
              <span class="grid h-11 w-11 place-items-center rounded-full bg-white text-violet-600 transition-transform group-hover:translate-x-0.5">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
          </div>
        </section>

        <section class="grid min-w-0 gap-3" aria-label="Recently effective rules">
          <div class="flex items-center justify-between gap-3 px-0.5">
            <h2 class="m-0 text-base font-extrabold tracking-[-0.03em] text-[var(--app-text-primary)]">最近命中</h2>
            ${this.hits.length > 0
              ? html`
                  <button class="text-xs font-semibold text-[var(--app-accent)]" type="button" @click=${this.clearHits}>
                    清空
                  </button>
                `
              : null}
          </div>
          ${this.renderHits()}
        </section>
      </main>
    `;
  }

  private renderHits() {
    if (this.hits.length === 0) {
      return html`
        <div class="rounded-[18px] border border-dashed border-[var(--app-input-border)] bg-[var(--app-surface)] p-5 text-center text-sm text-[var(--app-text-muted)] shadow-[var(--app-card-shadow)]">
          暂无最近生效规则。该记录依赖 declarativeNetRequestFeedback，通常只在 unpacked 开发模式下触发。
        </div>
      `;
    }

    return html`
      <div class="grid min-w-0 gap-2.5">
        ${repeat(
          this.hits,
          (hit) => `${hit.ruleId}-${hit.matchedAt}`,
          (hit) => html`
            <article
              class="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-[var(--app-surface-border)] bg-[var(--app-surface-raised)] p-3 shadow-[0_12px_28px_rgba(74,39,156,0.06)]"
            >
              <span
                class="rounded-[9px] px-2 py-1 text-center font-mono text-[11px] font-bold ${METHOD_BADGE_CLASS[hit.method] ??
                'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300'}"
              >
                ${hit.method}
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold text-[var(--app-text-primary)]">${hit.url}</span>
                <span class="mt-1 block truncate text-xs text-[var(--app-text-muted)]">${hit.ruleName} · ${hit.groupName}</span>
              </span>
              <span class="flex items-center gap-2 text-xs font-medium text-[var(--app-text-muted)]">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                ${this.formatDate(hit.matchedAt)}
              </span>
            </article>
          `,
        )}
      </div>
    `;
  }

  private async loadStats(): Promise<void> {
    const [groups, hits] = await Promise.all([getInterceptorRuleGroups(), getInterceptorRuleHits()]);
    this.rules = flattenInterceptorRules(groups);
    this.enabledRules = getEnabledInterceptorRules(groups);
    this.hits = hits;
    this.loading = false;
    this.requestUpdate();
  }

  private async clearHits(): Promise<void> {
    await clearInterceptorRuleHits();
    await this.loadStats();
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('zh-CN', {
      minute: '2-digit',
      hour: '2-digit',
    }).format(new Date(value));
  }
}

customElements.define('home-page', HomePage);

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
