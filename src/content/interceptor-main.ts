// Runs in MAIN world — has direct access to window.fetch / window.XMLHttpRequest.
// Receives rules from the isolated-world counterpart via CustomEvent.

interface SerializedRule { id: number; urlFilter: string; method: string; mockBody: string }

const __waiRules: SerializedRule[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let __faker: any = null;

import('@faker-js/faker').then(({ fakerZH_CN }) => { __faker = fakerZH_CN; }).catch(() => {});

console.log('%c[Web API Interceptor] active — fetch & XHR patched', 'color:#f59e0b;font-weight:bold');

window.addEventListener('__wai_push_rules__', (e) => {
  const rules = (e as CustomEvent<SerializedRule[]>).detail ?? [];
  __waiRules.length = 0;
  __waiRules.push(...rules);
});

function parseUrlFilter(urlFilter: string): { regex: RegExp; params: string[] } {
  const params: string[] = [];
  const escaped = urlFilter.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/\\\{([^}]+)\\\}/g, (_m, name: string) => {
    params.push(name);
    return '([^/?#]+)';
  });
  return { regex: new RegExp(regexStr + '(?=[?#]|$)'), params };
}

function extractUrlParams(url: string, urlFilter: string): Record<string, string> {
  const { regex, params } = parseUrlFilter(urlFilter);
  if (params.length === 0) return {};
  const m = url.match(regex);
  if (!m) return {};
  const result: Record<string, string> = {};
  params.forEach((name, i) => { result[name] = m[i + 1]; });
  return result;
}

function matchesRule(url: string, method: string, rule: SerializedRule): boolean {
  if (method.toUpperCase() !== rule.method.toUpperCase()) return false;
  try {
    const { regex } = parseUrlFilter(rule.urlFilter);
    return regex.test(url);
  } catch {
    return url.includes(rule.urlFilter);
  }
}

function resolveMockBody(mockBody: string, url: string, urlFilter: string): string {
  const urlParams = extractUrlParams(url, urlFilter);
  return mockBody.replace(/\{\{([\s\S]+)\}\}/g, (_match, expr: string) => {
    const trimmed = expr.trim();
    if (trimmed in urlParams) return JSON.stringify(urlParams[trimmed]);
    if (trimmed.startsWith('faker.')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const result = new Function('faker', `return ${trimmed}`)(__faker);
        console.log('[Web API Interceptor] faker eval result:', result);
        return JSON.stringify(result);
      } catch (e) {
        console.warn('[Web API Interceptor] faker eval failed:', e, '\nexpr:', trimmed);
        return JSON.stringify(null);
      }
    }
    try {
      const keys = Object.keys(urlParams);
      const vals = keys.map((k) => urlParams[k]);
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const result = new Function(...keys, `return ${trimmed}`)(...vals);
      return JSON.stringify(result);
    } catch {
      return JSON.stringify(null);
    }
  });
}

function logIntercepted(rule: SerializedRule, method: string, url: string, body: string): void {
  console.groupCollapsed(`%c[Web API Interceptor] ${method.toUpperCase()} ${url}`, 'color:#f59e0b;font-weight:bold');
  try { console.log('mock response:', JSON.parse(body)); } catch { console.log('mock response:', body); }
  console.groupEnd();
  window.dispatchEvent(new CustomEvent('__wai_rule_hit__', {
    detail: { ruleId: rule.id, method, url, matchedAt: Date.now() },
  }));
}

// Patch fetch
const _origFetch = window.fetch.bind(window);
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  const method = init?.method ?? (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).method : 'GET') ?? 'GET';
  const matched = __waiRules.find((r) => matchesRule(url, method, r));
  if (matched) {
    const body = resolveMockBody(matched.mockBody, url, matched.urlFilter);
    logIntercepted(matched, method, url, body);
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return _origFetch(input, init);
};

// Patch XHR via prototype so cached references in frameworks also get intercepted
const _origOpen = XMLHttpRequest.prototype.open;
const _origSend = XMLHttpRequest.prototype.send;
const _origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: unknown[]) {
  const urlStr = url.toString();
  const matched = __waiRules.find((r) => matchesRule(urlStr, method, r)) ?? null;
  (this as unknown as Record<string, unknown>)['_waiUrl'] = urlStr;
  (this as unknown as Record<string, unknown>)['_waiMethod'] = method;
  (this as unknown as Record<string, unknown>)['_waiRule'] = matched;
  if (matched) return;
  // @ts-ignore
  _origOpen.call(this, method, url, ...rest);
};

XMLHttpRequest.prototype.setRequestHeader = function(name: string, value: string) {
  if ((this as unknown as Record<string, unknown>)['_waiRule']) return;
  _origSetRequestHeader.call(this, name, value);
};

XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
  const rule = (this as unknown as Record<string, unknown>)['_waiRule'] as SerializedRule | null;
  if (rule) {
    const url = (this as unknown as Record<string, unknown>)['_waiUrl'] as string;
    const method = (this as unknown as Record<string, unknown>)['_waiMethod'] as string;
    const mockBody = resolveMockBody(rule.mockBody, url, rule.urlFilter);
    logIntercepted(rule, method, url, mockBody);

    const self = this;
    // Simulate XHR lifecycle: headers received → loading → done
    function defineProps(readyState: number) {
      Object.defineProperty(self, 'readyState', { get: () => readyState, configurable: true });
      Object.defineProperty(self, 'status', { get: () => 200, configurable: true });
      Object.defineProperty(self, 'statusText', { get: () => 'OK', configurable: true });
      Object.defineProperty(self, 'responseText', { get: () => mockBody, configurable: true });
      Object.defineProperty(self, 'response', { get: () => mockBody, configurable: true });
      Object.defineProperty(self, 'responseURL', { get: () => url, configurable: true });
    }

    setTimeout(() => {
      defineProps(2);
      if (typeof self.onreadystatechange === 'function') self.onreadystatechange(new Event('readystatechange'));
      self.dispatchEvent(new Event('readystatechange'));

      defineProps(3);
      if (typeof self.onreadystatechange === 'function') self.onreadystatechange(new Event('readystatechange'));
      self.dispatchEvent(new Event('readystatechange'));

      defineProps(4);
      if (typeof self.onreadystatechange === 'function') self.onreadystatechange(new Event('readystatechange'));
      self.dispatchEvent(new Event('readystatechange'));
      if (typeof self.onload === 'function') self.onload(new ProgressEvent('load'));
      self.dispatchEvent(new ProgressEvent('load'));
      self.dispatchEvent(new ProgressEvent('loadend'));
    }, 0);
    return;
  }
  _origSend.call(this, body);
};
