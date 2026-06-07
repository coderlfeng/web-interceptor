import { LitElement, html } from 'lit';
import { navigate, resolveRoute } from './router';

type ThemeMode = 'dark' | 'light';

const SIDE_PANEL_THEME_STORAGE_KEY = 'side-panel-theme';

export class WebApiSidePanel extends LitElement {
  static properties = {
    activeRouteTag: { state: true },
    theme: { state: true },
  };

  private activeRouteTag = resolveRoute().tag;

  private theme: ThemeMode = 'light';

  private handleHashChange = () => {
    this.activeRouteTag = resolveRoute().tag;
  };

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', this.handleHashChange);
    this.handleHashChange();
    void this.loadTheme();
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.handleHashChange);
    super.disconnectedCallback();
  }

  render() {
    return html`
      <section
        class="block min-h-screen overflow-x-hidden text-[var(--app-text-primary)] transition-[background,color] duration-200 ease-in-out [background:var(--app-bg-gradient-1),var(--app-bg-gradient-2),var(--app-bg-gradient-3)] [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]"
      >
        <div class="relative isolate box-border min-h-screen p-[clamp(14px,5vw,24px)]">
          ${this.renderNavbar()} ${this.renderPage()}
        </div>
      </section>
    `;
  }

  private renderNavbar() {
    const homeActive = this.activeRouteTag === 'home-page';
    const requestsActive = this.activeRouteTag === 'requests-page';
    const inactiveTabClass = 'text-[var(--app-text-muted)] hover:bg-[var(--app-button-bg)] hover:text-[var(--app-text-primary)]';
    const activeTabClass = 'bg-[var(--app-accent)] text-[var(--app-accent-text)] shadow-[0_8px_18px_rgba(124,58,237,0.24)]';

    return html`
      <nav
        class="flex min-w-0 items-center gap-2 rounded-[18px] border border-[var(--app-surface-border)] bg-[var(--app-surface)] px-2.5 py-2 shadow-[var(--app-card-shadow)] backdrop-blur-xl"
        aria-label="Side panel navigation"
      >
        <button class="flex min-w-0 items-center gap-2 rounded-[14px] px-2 py-1.5 text-left" type="button" @click=${() => navigate('/')}>
          <span
            class="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-linear-to-br from-violet-500 via-fuchsia-500 to-blue-500 text-base font-black text-white shadow-[0_12px_22px_rgba(124,58,237,0.3)]"
          >
            M
          </span>
          <span class="hidden min-w-0 text-sm font-bold tracking-[-0.02em] text-[var(--app-text-primary)] min-[380px]:block">
            Request Mock
          </span>
        </button>

        <div class="ml-auto flex shrink-0 rounded-[14px] bg-[var(--app-surface-soft)] p-1">
          <button
            class="rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors ${homeActive ? activeTabClass : inactiveTabClass}"
            type="button"
            @click=${() => navigate('/')}
          >
            Home
          </button>
          <button
            class="rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors ${requestsActive
              ? activeTabClass
              : inactiveTabClass}"
            type="button"
            @click=${() => navigate('/requests')}
          >
            Requests
          </button>
        </div>

        <label
          class="swap swap-rotate grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-[var(--app-button-bg)] text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-button-bg)] hover:text-[var(--app-text-primary)]"
          aria-label="Toggle theme"
        >
          <input type="checkbox" .checked=${this.theme === 'light'} @change=${this.toggleTheme} />
          <svg class="swap-on h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M5.64 17l-.71.71a1 1 0 0 0 1.41 1.41l.71-.71A1 1 0 0 0 5.64 17ZM5 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1Zm7-7a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1Zm5.66 2.34.71-.71a1 1 0 1 0-1.41-1.41l-.71.71a1 1 0 0 0 1.41 1.41ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm9 4h-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2Zm-3.34 5.66a1 1 0 0 0-1.41 1.41l.71.71a1 1 0 0 0 1.41-1.41l-.71-.71ZM12 19a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1Zm-5.66-2.34a1 1 0 0 0-1.41 1.41l.71.71a1 1 0 0 0 1.41-1.41l-.71-.71Z"
            />
          </svg>
          <svg class="swap-off h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-10.45-10.45A1 1 0 0 0 9 1.36 10 10 0 1 0 22.64 15a1 1 0 0 0-1-2Zm-9.5 6.69A8 8 0 0 1 7.08 5.22a10.06 10.06 0 0 0 11.7 11.7 8 8 0 0 1-6.64 2.77Z"
            />
          </svg>
        </label>
      </nav>
    `;
  }

  private renderPage() {
    switch (this.activeRouteTag) {
      case 'requests-page':
        return html`<requests-page></requests-page>`;
      case 'home-page':
      default:
        return html`<home-page></home-page>`;
    }
  }

  private async loadTheme(): Promise<void> {
    const result = await chrome.storage.local.get(SIDE_PANEL_THEME_STORAGE_KEY);
    const savedTheme = result[SIDE_PANEL_THEME_STORAGE_KEY];
    this.applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  }

  private async toggleTheme(): Promise<void> {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    await chrome.storage.local.set({ [SIDE_PANEL_THEME_STORAGE_KEY]: nextTheme });
  }

  private applyTheme(theme: ThemeMode): void {
    this.theme = theme;
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }
}

customElements.define('web-api-side-panel', WebApiSidePanel);

declare global {
  interface HTMLElementTagNameMap {
    'web-api-side-panel': WebApiSidePanel;
  }
}
