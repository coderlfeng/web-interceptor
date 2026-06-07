export const INTERCEPTOR_RULE_GROUPS_STORAGE_KEY = 'interceptor-rule-groups';
export const INTERCEPTOR_RULE_HITS_STORAGE_KEY = 'interceptor-rule-hits';

export const INTERCEPTOR_RULE_ID_START = 10_000;
const INTERCEPTOR_GROUP_ID_START = 1;

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface InterceptorRule {
  id: number;
  name: string;
  urlFilter: string;
  method: HttpMethod;
  mockBody: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface InterceptorRuleGroup {
  id: number;
  name: string;
  enabled: boolean;
  rules: InterceptorRule[];
}

export interface InterceptorRuleHit {
  ruleId: number;
  groupId: number;
  ruleName: string;
  groupName: string;
  url: string;
  method: string;
  matchedAt: string;
}

export type InterceptorRuleDraft = Omit<InterceptorRule, 'id' | 'updatedAt'>;
export type InterceptorRuleGroupDraft = Omit<InterceptorRuleGroup, 'id' | 'rules'>;

export function validateInterceptorRule(rule: InterceptorRuleDraft): string | undefined {
  if (!rule.name.trim()) {
    return '请输入规则名称';
  }

  if (!rule.urlFilter.trim()) {
    return '请输入要拦截的 URL filter';
  }

  if (!HTTP_METHODS.includes(rule.method)) {
    return '请选择有效的 HTTP method';
  }

  try {
    JSON.parse(rule.mockBody);
  } catch {
    return 'Mock 数据必须是合法 JSON';
  }

  return undefined;
}

export function validateInterceptorRuleGroup(group: InterceptorRuleGroupDraft): string | undefined {
  if (!group.name.trim()) {
    return '请输入分组名称';
  }

  return undefined;
}

export function flattenInterceptorRules(groups: InterceptorRuleGroup[]): InterceptorRule[] {
  return groups.flatMap((group) => group.rules);
}

export function getEnabledInterceptorRules(groups: InterceptorRuleGroup[]): InterceptorRule[] {
  return groups.flatMap((group) => (group.enabled ? group.rules.filter((rule) => rule.enabled) : []));
}

function withUpdatedAt(rule: InterceptorRule): InterceptorRule {
  return { ...rule, updatedAt: new Date().toISOString() };
}

export async function getInterceptorRuleGroups(): Promise<InterceptorRuleGroup[]> {
  const result = await chrome.storage.local.get(INTERCEPTOR_RULE_GROUPS_STORAGE_KEY);
  const groups = result[INTERCEPTOR_RULE_GROUPS_STORAGE_KEY];

  return Array.isArray(groups) ? groups : [];
}

export async function saveInterceptorRuleGroups(groups: InterceptorRuleGroup[]): Promise<void> {
  await chrome.storage.local.set({ [INTERCEPTOR_RULE_GROUPS_STORAGE_KEY]: groups });
}

export async function createInterceptorRuleGroup(
  draft: InterceptorRuleGroupDraft,
): Promise<InterceptorRuleGroup> {
  const error = validateInterceptorRuleGroup(draft);

  if (error) {
    throw new Error(error);
  }

  const groups = await getInterceptorRuleGroups();
  const nextId = Math.max(INTERCEPTOR_GROUP_ID_START - 1, ...groups.map((group) => group.id)) + 1;
  const group: InterceptorRuleGroup = {
    id: nextId,
    name: draft.name.trim(),
    enabled: draft.enabled,
    rules: [],
  };

  await saveInterceptorRuleGroups([...groups, group]);

  return group;
}

export async function updateInterceptorRuleGroup(
  groupId: number,
  patch: Partial<InterceptorRuleGroupDraft>,
): Promise<void> {
  const groups = await getInterceptorRuleGroups();
  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    const nextGroup = { ...group, ...patch };
    const error = validateInterceptorRuleGroup(nextGroup);

    if (error) {
      throw new Error(error);
    }

    return {
      ...nextGroup,
      name: nextGroup.name.trim(),
    };
  });

  await saveInterceptorRuleGroups(nextGroups);
}

export async function toggleInterceptorRuleGroup(groupId: number, enabled: boolean): Promise<void> {
  const groups = await getInterceptorRuleGroups();
  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    return {
      ...group,
      enabled,
      rules: group.rules.map((rule) => withUpdatedAt({ ...rule, enabled })),
    };
  });

  await saveInterceptorRuleGroups(nextGroups);
}

export async function deleteInterceptorRuleGroup(groupId: number): Promise<void> {
  const groups = await getInterceptorRuleGroups();
  await saveInterceptorRuleGroups(groups.filter((group) => group.id !== groupId));
}

export async function addRuleToGroup(
  groupId: number,
  draft: InterceptorRuleDraft,
): Promise<InterceptorRule> {
  const error = validateInterceptorRule(draft);

  if (error) {
    throw new Error(error);
  }

  const groups = await getInterceptorRuleGroups();
  const rules = flattenInterceptorRules(groups);
  const nextId = Math.max(INTERCEPTOR_RULE_ID_START - 1, ...rules.map((rule) => rule.id)) + 1;
  const rule: InterceptorRule = withUpdatedAt({
    ...draft,
    id: nextId,
    name: draft.name.trim(),
    urlFilter: draft.urlFilter.trim(),
  });
  let foundGroup = false;
  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    foundGroup = true;

    return {
      ...group,
      rules: [...group.rules, rule],
    };
  });

  if (!foundGroup) {
    throw new Error('未找到目标分组');
  }

  await saveInterceptorRuleGroups(nextGroups);

  return rule;
}

export async function updateInterceptorRule(
  groupId: number,
  ruleId: number,
  patch: Partial<InterceptorRuleDraft>,
): Promise<void> {
  const groups = await getInterceptorRuleGroups();
  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    return {
      ...group,
      rules: group.rules.map((rule) => {
        if (rule.id !== ruleId) {
          return rule;
        }

        const nextRule = { ...rule, ...patch };
        const error = validateInterceptorRule(nextRule);

        if (error) {
          throw new Error(error);
        }

        return withUpdatedAt({
          ...nextRule,
          name: nextRule.name.trim(),
          urlFilter: nextRule.urlFilter.trim(),
        });
      }),
    };
  });

  await saveInterceptorRuleGroups(nextGroups);
}

export async function deleteInterceptorRule(groupId: number, ruleId: number): Promise<void> {
  const groups = await getInterceptorRuleGroups();
  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    return {
      ...group,
      rules: group.rules.filter((rule) => rule.id !== ruleId),
    };
  });

  await saveInterceptorRuleGroups(nextGroups);
}

export async function getInterceptorRuleHits(): Promise<InterceptorRuleHit[]> {
  const result = await chrome.storage.local.get(INTERCEPTOR_RULE_HITS_STORAGE_KEY);
  const hits = result[INTERCEPTOR_RULE_HITS_STORAGE_KEY];

  return Array.isArray(hits) ? hits : [];
}

export async function recordInterceptorRuleHit(hit: InterceptorRuleHit): Promise<void> {
  const hits = await getInterceptorRuleHits();
  const nextHits = [hit, ...hits.filter((item) => item.ruleId !== hit.ruleId)]
    .sort((a, b) => Date.parse(b.matchedAt) - Date.parse(a.matchedAt))
    .slice(0, 10);

  await chrome.storage.local.set({ [INTERCEPTOR_RULE_HITS_STORAGE_KEY]: nextHits });
}

export async function clearInterceptorRuleHits(): Promise<void> {
  await chrome.storage.local.set({ [INTERCEPTOR_RULE_HITS_STORAGE_KEY]: [] });
}
