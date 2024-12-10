import type { Group, Item } from '~/types';

export function checkGroupExists(groupNames: string[], name: string) {
  if (groupNames.includes(name)) {
    return `\`${name}\` already exists`;
  }
}

function findGroupAndItem(groups: Group[], groupName: string, ip: string) {
  const group = groups.find((v) => v.name === groupName);
  if (!group) {
    return;
  }
  const item = group.list.find((v) => v.ip === ip);
  if (!item) {
    return;
  }
  return { group, item };
}

export function findTargetGroupsAndItems(
  groups: Group[],
  groupName: string,
  ip: string,
) {
  const ret: { group: Group; item: Item }[] = [];

  const target = findGroupAndItem(groups, groupName, ip);
  if (target) {
    ret.push(target);
    if (target.group.system && target.item.group !== target.group.name) {
      const anotherTarget = findGroupAndItem(groups, target.item.group, ip);
      if (anotherTarget) {
        ret.push(anotherTarget);
      }
    } else if (!target.group.system && target.group.enabled) {
      const anotherTarget = findGroupAndItem(groups, 'System', ip);
      if (anotherTarget) {
        ret.push(anotherTarget);
      }
    }
  }

  return ret;
}
