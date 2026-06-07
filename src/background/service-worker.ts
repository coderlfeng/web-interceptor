import {
  INTERCEPTOR_RULE_GROUPS_STORAGE_KEY,
  INTERCEPTOR_RULE_ID_START,
  getEnabledInterceptorRules,
  getInterceptorRuleGroups,
  recordInterceptorRuleHit,
  type InterceptorRule,
} from '../shared/interceptor-rules';

function toDataUrl(mockBody: string): string {
  return `data:application/json;charset=utf-8,${encodeURIComponent(mockBody)}`;
}

function toDynamicRule(rule: InterceptorRule): chrome.declarativeNetRequest.Rule {
  return {
    id: rule.id,
    priority: 100,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        url: toDataUrl(rule.mockBody),
      },
    },
    condition: {
      urlFilter: rule.urlFilter,
      requestMethods: [rule.method.toLowerCase() as chrome.declarativeNetRequest.RequestMethod],
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
    },
  };
}

async function syncDynamicRules(): Promise<void> {
  const [configuredGroups, activeRules] = await Promise.all([
    getInterceptorRuleGroups(),
    chrome.declarativeNetRequest.getDynamicRules(),
  ]);
  const addRules = getEnabledInterceptorRules(configuredGroups).map(toDynamicRule);
  const removeRuleIds = activeRules
    .filter((rule) => rule.id >= INTERCEPTOR_RULE_ID_START)
    .map((rule) => rule.id);

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

async function handleRuleMatched(info: chrome.declarativeNetRequest.MatchedRuleInfoDebug): Promise<void> {
  if (info.rule.ruleId < INTERCEPTOR_RULE_ID_START) {
    return;
  }

  const groups = await getInterceptorRuleGroups();

  for (const group of groups) {
    const rule = group.rules.find((candidate) => candidate.id === info.rule.ruleId);

    if (!rule) {
      continue;
    }

    await recordInterceptorRuleHit({
      ruleId: rule.id,
      groupId: group.id,
      ruleName: rule.name,
      groupName: group.name,
      url: info.request.url,
      method: info.request.method,
      matchedAt: new Date().toISOString(),
    });

    return;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  void syncDynamicRules();
});

chrome.runtime.onStartup.addListener(() => {
  void syncDynamicRules();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY]) {
    void syncDynamicRules();
  }
});

if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    void handleRuleMatched(info);
  });
}

void syncDynamicRules();
