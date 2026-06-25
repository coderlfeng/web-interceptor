import { LitElement, html } from 'lit';
import { navigate } from '../router';

type ThemeMode = 'dark' | 'light';

type BackTarget = boolean | string;

export class WebApiNavbar extends LitElement {
  static properties = {
    activeRouteTag: { type: String },
    back: { type: String },
    showGroupAdd: { type: Boolean },
    theme: { type: String },
  };

  activeRouteTag = 'home-page';

  back: BackTarget = false;

  showGroupAdd = false;

  theme: ThemeMode = 'light';

  protected createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <nav class="navbar min-h-0 px-2 py-1" aria-label="Side panel navigation">
        <div class="navbar-start">
          ${this.back
            ? html`
                <button class="btn btn-circle btn-ghost btn-sm" type="button" @click=${this.handleBack} aria-label="Back">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              `
            : null}
        </div>
        <div class="navbar-end gap-1">
          <label class="btn btn-circle btn-ghost btn-sm swap swap-rotate" aria-label="Toggle theme">
            <input type="checkbox" .checked=${this.theme === 'light'} @change=${this.handleThemeToggle} />
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
          ${this.showGroupAdd
            ? html`
                <button class="btn btn-circle btn-ghost btn-sm" type="button" @click=${this.handleGroupAdd} aria-label="添加分组">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
              `
            : null}
        </div>
      </nav>
    `;
  }

  private handleBack(): void {
    if (typeof this.back === 'string') {
      navigate(this.back);
      return;
    }

    window.history.back();
  }

  private handleThemeToggle(): void {
    this.dispatchEvent(new CustomEvent('theme-toggle'));
  }

  private handleGroupAdd(): void {
    this.dispatchEvent(new CustomEvent('group-add'));
  }
}

customElements.define('web-api-navbar', WebApiNavbar);

declare global {
  interface HTMLElementTagNameMap {
    'web-api-navbar': WebApiNavbar;
  }
}
