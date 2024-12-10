import type { Group } from '~/types';

const DISABLED_GROUPS_KEY = 'disabled-groups';

type StoreGroup = Pick<Group, 'name' | 'text' | 'list'>;

function getStorageGroups(): StoreGroup[] {
  const str = localStorage.getItem(DISABLED_GROUPS_KEY);
  return str ? JSON.parse(str) : [];
}

function setStorageGroups(groups: StoreGroup[]) {
  localStorage.setItem(DISABLED_GROUPS_KEY, JSON.stringify(groups));
}

export const storage = {
  getDisabledGroups(): Group[] {
    const storageGroups = getStorageGroups();
    return storageGroups.map((group) => {
      return {
        ...group,
        system: false,
        enabled: false,
      };
    });
  },

  renameDisabledGroup(oldName: string, newName: string) {
    const storageGroups = getStorageGroups();
    const targetGroup = storageGroups.find((g) => g.name === oldName);
    if (!targetGroup) {
      return;
    }
    targetGroup.name = newName;
    setStorageGroups(storageGroups);
  },

  addDisabledGroup(group: Group) {
    const storageGroups = getStorageGroups();
    storageGroups.push({
      name: group.name,
      list: group.list,
      text: group.text,
    });
    setStorageGroups(storageGroups);
  },

  deleteDisabledGroup(groupName: string) {
    const storageGroups = getStorageGroups();
    setStorageGroups(storageGroups.filter((g) => g.name !== groupName));
  },

  modifyDisabledGroup(newGroup: Group) {
    const storageGroups = getStorageGroups();
    setStorageGroups(
      storageGroups.map((group) => {
        if (group.name === newGroup.name) {
          return newGroup;
        }
        return group;
      }),
    );
  },
};
