import { LitElement, html } from 'lit';
import { resolveRoute } from './router';

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
        class="block min-h-screen overflow-x-hidden bg-base-100 text-base-content transition-[background,color] duration-200 ease-in-out [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]"
      >
        <div class="relative isolate box-border min-h-screen p-[clamp(14px,5vw,24px)]">
          <web-api-navbar
            class="fixed inset-x-0 top-0 z-50 block bg-base-100/80 px-[clamp(14px,5vw,24px)] backdrop-blur-xl"
            .activeRouteTag=${this.activeRouteTag}
            .back=${this.activeRouteTag !== 'home-page'}
            .showGroupAdd=${this.activeRouteTag === 'groups-page' || this.activeRouteTag === 'group-rules-page'}
            .theme=${this.theme}
            @group-add=${this.handleGroupAdd}
            @theme-toggle=${this.toggleTheme}
          ></web-api-navbar>
          <div class="pt-8">${this.renderPage()}</div>
        </div>
      </section>
    `;
  }

  private renderPage() {
    switch (this.activeRouteTag) {
      case 'groups-page':
        return html`<groups-page></groups-page>`;
      case 'group-rules-page':
        return html`<group-rules-page></group-rules-page>`;
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

  private handleGroupAdd(): void {
    if (this.activeRouteTag === 'group-rules-page') {
      const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
      const groupId = Number(params.get('groupId') ?? 0);
      const width = 420;
      const height = 520;
      const dpr = window.devicePixelRatio || 1;
      void chrome.windows.create({
        height,
        left: Math.round((screen.width - width * dpr) / 2),
        top: Math.round((screen.height - height * dpr) / 2),
        type: 'popup',
        url: `add-rule.html?groupId=${groupId}`,
        width,
      });
      return;
    }

    const width = 420;
    const height = 260;
    const dpr = window.devicePixelRatio || 1;
    void chrome.windows.create({
      height,
      left: Math.round((screen.width - width * dpr) / 2),
      top: Math.round((screen.height - height * dpr) / 2),
      type: 'popup',
      url: 'group-add.html',
      width,
    });
  }

  private async toggleTheme(): Promise<void> {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    await chrome.storage.local.set({ [SIDE_PANEL_THEME_STORAGE_KEY]: nextTheme });
  }

  private applyTheme(theme: ThemeMode): void {
    this.theme = theme;
    document.documentElement.dataset.theme = theme;
  }
}

customElements.define('web-api-side-panel', WebApiSidePanel);

declare global {
  interface HTMLElementTagNameMap {
    'web-api-side-panel': WebApiSidePanel;
  }
}
