import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { splitAtom } from 'jotai/utils';
import type { Group, Item } from '~/types';
import { findTargetGroupsAndItems } from '~/utils/group';
import { ipc } from '~/utils/ipc';
import { storage } from '~/utils/storage';
import { SYSTEM_GROUP_NAME, NOT_EXISTS_GROUP } from '~/consts';

export const groupsAtom = atom<Group[]>([]);

export const currentGroupNameAtom = atom('');

export const systemHostsTextDraftAtom = atom('');

export const currentGroupAtom = atom(
  (get) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);
    return (
      groups.find((group) => group.name === currentGroupName) ||
      NOT_EXISTS_GROUP
    );
  },
  (get, set, newGroup: Group) => {
    const groups = get(groupsAtom);
    set(
      groupsAtom,
      groups.map((group) => {
        if (group.name === newGroup.name) {
          return { ...newGroup };
        }
        return group;
      }),
    );
    if (!newGroup.enabled) {
      storage.modifyDisabledGroup(newGroup);
    }
  },
);

const currentGroupListAtom = focusAtom(currentGroupAtom, (optic) => {
  return optic.prop('list');
});

export const itemAtomsAtom = splitAtom(
  currentGroupListAtom,
  (item) => `${item.group}-${item.ip}`,
);

export const groupNamesAtom = atom((get) => {
  const groups = get(groupsAtom);
  return groups.map((g) => g.name);
});

const updateTextByListAtom = atom(null, async (get, set, list: Item[]) => {
  const newText = await ipc.updateTextByList(
    list,
    get(systemHostsTextDraftAtom),
  );
  set(systemHostsTextDraftAtom, newText);
});

export const initGroupsAtom = atom(null, async (_, set) => {
  const groups = await ipc.getGroups();
  const systemGroup = groups.find((profile) => profile.system);
  if (systemGroup) {
    set(currentGroupNameAtom, systemGroup.name);
    set(systemHostsTextDraftAtom, systemGroup.text);
  }
  set(groupsAtom, groups);
});

export const addGroupAtom = atom(null, (_, set, groupName: string) => {
  const newGroup: Group = {
    name: groupName,
    text: '',
    list: [],
    system: false,
    enabled: false,
  };
  set(groupsAtom, (groups) => [...groups, newGroup]);
  set(currentGroupNameAtom, groupName);
  storage.addDisabledGroup(newGroup);
});

export const renameGroupAtom = atom(
  null,
  (get, set, oldName: string, newName: string) => {
    const groups = get(groupsAtom);

    const targetGroup = groups.find((g) => g.name === oldName);
    if (!targetGroup) {
      return;
    }

    targetGroup.name = newName;

    if (targetGroup.enabled) {
      const systemGroup = groups.find((g) => g.system);
      if (!systemGroup) {
        return;
      }
      systemGroup.list = systemGroup.list.map((item) => {
        if (item.group === oldName) {
          return {
            ...item,
            group: newName,
          };
        }
        return item;
      });
    } else {
      storage.renameDisabledGroup(oldName, newName);
    }

    set(
      groupsAtom,
      groups.map((group) => {
        if (group.name === targetGroup.name || group.system) {
          return { ...group };
        }
        return group;
      }),
    );
  },
);

export const toggleGroupEnableAtom = atom(
  null,
  async (get, set, groupName: string) => {
    const groups = get(groupsAtom);

    const targetGroup = groups.find((g) => g.name === groupName);
    if (!targetGroup) {
      return;
    }

    targetGroup.enabled = !targetGroup.enabled;

    const systemGroup = groups.find((g) => g.system);
    if (!systemGroup) {
      return;
    }

    if (targetGroup.enabled) {
      systemGroup.list = [...systemGroup.list, ...targetGroup.list];
      storage.deleteDisabledGroup(targetGroup.name);
    } else {
      systemGroup.list = systemGroup.list.filter(
        (item) => item.group !== targetGroup.name,
      );
      storage.addDisabledGroup(targetGroup);
    }

    set(
      groupsAtom,
      groups.map((group) => {
        if (group.name === targetGroup.name || group.system) {
          return { ...group };
        }
        return group;
      }),
    );
  },
);

export const deleteGroupAtom = atom(
  null,
  async (get, set, groupName: string) => {
    const groups = get(groupsAtom);

    const targetGroup = groups.find((g) => g.name === groupName);
    if (!targetGroup) {
      return;
    }

    if (targetGroup.enabled) {
      const systemGroup = groups.find((g) => g.system);
      if (!systemGroup) {
        return;
      }

      systemGroup.list = systemGroup.list.filter(
        (item) => item.group !== targetGroup.name,
      );
    } else {
      storage.deleteDisabledGroup(targetGroup.name);
    }

    set(
      groupsAtom,
      groups
        .filter((group) => group.name !== groupName)
        .map((group) => {
          if (group.system) {
            return { ...group };
          }
          return group;
        }),
    );

    if (get(currentGroupNameAtom) === groupName) {
      set(currentGroupNameAtom, SYSTEM_GROUP_NAME);
    }
  },
);

export const setSameGroupItemAtom = atom(
  null,
  (get, set, oldItemIp: string, newItem: Item) => {
    const currentGroup = get(currentGroupAtom);
    const groups = get(groupsAtom);

    if (currentGroup.system && newItem.group !== currentGroup.name) {
      set(
        groupsAtom,
        groups.map((group) => {
          return group.name === newItem.group
            ? {
                ...group,
                list: group.list.map((item) => {
                  return item.ip === oldItemIp ? { ...newItem } : item;
                }),
              }
            : group;
        }),
      );
    } else if (!currentGroup.system && currentGroup.enabled) {
      set(
        groupsAtom,
        groups.map((group) => {
          return group.system
            ? {
                ...group,
                list: group.list.map((item) => {
                  return item.ip === oldItemIp ? { ...newItem } : item;
                }),
              }
            : group;
        }),
      );
    }
  },
);

export const setItemIpAtom = atom(
  null,
  async (get, set, oldIp: string, newIp: string) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);

    const targets = findTargetGroupsAndItems(groups, currentGroupName, oldIp);

    await Promise.all(
      targets.map(async ({ group, item }) => {
        item.ip = newIp;
        group.text = await ipc.updateTextByList(group.list, group.text);
      }),
    );

    set(groupsAtom, structuredClone(groups));
  },
);

export const deleteItemAtom = atom(null, async (get, set, ip: string) => {
  const currentGroupName = get(currentGroupNameAtom);
  const groups = get(groupsAtom);

  const targets = findTargetGroupsAndItems(groups, currentGroupName, ip);

  await Promise.all(
    targets.map(async ({ group }) => {
      group.list = group.list.filter((v) => v.ip !== ip);
      group.text = await ipc.updateTextByList(group.list, group.text);
    }),
  );

  set(groupsAtom, structuredClone(groups));
});

export const setEnabledHostsAtom = atom(
  null,
  async (get, set, ip: string, enabledHosts: string[]) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);

    const targets = findTargetGroupsAndItems(groups, currentGroupName, ip);

    await Promise.all(
      targets.map(async ({ group, item }) => {
        for (const host of item.hosts) {
          host.enabled = enabledHosts.includes(host.content);
        }
        group.text = await ipc.updateTextByList(group.list, group.text);
      }),
    );

    set(groupsAtom, structuredClone(groups));
  },
);
