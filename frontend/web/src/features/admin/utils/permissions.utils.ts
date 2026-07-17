import { STANDARD_ACTIONS } from '../constants/permissions.constants';
import type { PermissionApi } from '../types/admin.type';

export function groupByResource(permissions: PermissionApi[]): Map<string, PermissionApi[]> {
  const map = new Map<string, PermissionApi[]>();
  for (const p of permissions) {
    const key = p.resource ?? (p.permission_name.split('.').slice(0, -1).join('_') || 'other');
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  return map;
}

export function getAllActions(permissions: PermissionApi[]): string[] {
  const actions = new Set(
    permissions.map((p) => p.action ?? p.permission_name.split('.').pop() ?? 'read'),
  );
  const standard = STANDARD_ACTIONS.filter((a) => actions.has(a));
  const others = [...actions]
    .filter((a) => !(STANDARD_ACTIONS as readonly string[]).includes(a))
    .sort();
  return [...standard, ...others];
}
