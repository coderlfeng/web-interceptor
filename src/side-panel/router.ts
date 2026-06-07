export interface RouteEntry {
  path: string;
  tag: string;
  title: string;
}

const routes = new Map<string, RouteEntry>();
const defaultPath = '/';

export function registerRoute(path: string, tag: string, title: string) {
  routes.set(normalizePath(path), { path: normalizePath(path), tag, title });
}

export function resolveRoute(hash = window.location.hash): RouteEntry {
  const path = normalizePath(hash.replace(/^#/, ''));
  return routes.get(path) ?? routes.get(defaultPath) ?? { path: defaultPath, tag: 'home-page', title: 'Home' };
}

export function navigate(path: string) {
  window.location.hash = normalizePath(path);
}

function normalizePath(path: string) {
  if (!path || path === '#') {
    return defaultPath;
  }

  return path.startsWith('/') ? path : `/${path}`;
}
