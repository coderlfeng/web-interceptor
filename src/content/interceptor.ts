import {
  INTERCEPTOR_RULE_GROUPS_STORAGE_KEY,
  getEnabledInterceptorRules,
  recordInterceptorRuleHit,
  type InterceptorRule,
  type InterceptorRuleHit,
} from '../shared/interceptor-rules';

type SerializedRule = { id: number; groupId: number; ruleName: string; groupName: string; urlFilter: string; method: string; mockBody: string };

function pushRulesToMain(rules: SerializedRule[]): void {
  window.dispatchEvent(new CustomEvent('__wai_push_rules__', { detail: rules }));
}

async function loadAndPush(): Promise<void> {
  const result = await chrome.storage.local.get(INTERCEPTOR_RULE_GROUPS_STORAGE_KEY);
  const groups = Array.isArray(result[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY])
    ? result[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY]
    : [];
  const enabled: InterceptorRule[] = getEnabledInterceptorRules(groups);
  const serialized: SerializedRule[] = enabled.map((r) => {
    const group = groups.find((g: { rules: InterceptorRule[] }) => g.rules.some((rule: InterceptorRule) => rule.id === r.id));
    return {
      id: r.id,
      groupId: group?.id ?? 0,
      ruleName: r.name,
      groupName: group?.name ?? '',
      urlFilter: r.urlFilter,
      method: r.method,
      mockBody: r.mockBody,
    };
  });
  pushRulesToMain(serialized);
}

window.addEventListener('__wai_rule_hit__', (e) => {
  const { ruleId, method, url, matchedAt } = (e as CustomEvent).detail as { ruleId: number; method: string; url: string; matchedAt: number };
  void (async () => {
    const result = await chrome.storage.local.get(INTERCEPTOR_RULE_GROUPS_STORAGE_KEY);
    const groups = Array.isArray(result[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY]) ? result[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY] : [];
    for (const group of groups) {
      const rule = group.rules?.find((r: InterceptorRule) => r.id === ruleId);
      if (rule) {
        const hit: InterceptorRuleHit = {
          ruleId,
          groupId: group.id,
          ruleName: rule.name,
          groupName: group.name,
          url,
          method,
          matchedAt: new Date(matchedAt).toISOString(),
        };
        await recordInterceptorRuleHit(hit);
        break;
      }
    }
  })();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY]) {
    void loadAndPush();
  }
});

void loadAndPush();
