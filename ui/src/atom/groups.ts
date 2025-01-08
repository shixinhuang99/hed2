import { parser } from 'hed2-parser';
import { atom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import { xorWith } from 'lodash-es';
import { toastError } from '~/components';
import { ipc } from '~/ipc';
import type { Group } from '~/types';
import { filterDisabledGroups, mergeGroups } from '~/utils/group';
import { storage } from '~/utils/storage';
import { addHostsHistoryAtom } from './hosts-history';
import {
  currentGroupNameAtom,
  groupsAtom,
  hostsHistoryAtom,
  systemHostsAtom,
} from './primitive';

export const groupsWithWriterAtom = atom(
  (get) => {
    return get(groupsAtom);
  },
  (get, set, newGroups: Group[]) => {
    const groups = get(groupsAtom);
    const systemGroup = newGroups.find((group) => group.system);
    const xor = xorWith(groups, newGroups, (a, b) => {
      return a.name === b.name && a.enabled === b.enabled;
    });
    const currentGroupName = get(currentGroupNameAtom);
    const groupNameMap: Record<string, string> = {};

    if (xor.length === 1 && systemGroup) {
      const removed = xor[0];
      if (removed.enabled) {
        systemGroup.list = systemGroup.list.filter(
          (item) => item.group !== removed.name,
        );
      }
      if (currentGroupName === removed.name) {
        set(currentGroupNameAtom, systemGroup.name);
      }
    }

    if (xor.length === 2) {
      const [previous, current] = xor;
      if (previous.name !== current.name) {
        current.list = current.list.map((item) => {
          return { ...item, group: current.name };
        });
        if (current.enabled && systemGroup) {
          systemGroup.list = systemGroup.list.map((item) => {
            return item.group === previous.name
              ? { ...item, group: current.name }
              : item;
          });
        }
        if (currentGroupName === previous.name) {
          set(currentGroupNameAtom, current.name);
        }
        groupNameMap[current.name] = previous.name;
        groupNameMap[previous.name] = current.name;
      }
      if (!previous.enabled && current.enabled && systemGroup) {
        systemGroup.list = [...systemGroup.list, ...current.list];
      }
      if (previous.enabled && !current.enabled && systemGroup) {
        systemGroup.list = systemGroup.list.filter(
          (item) => item.group !== current.name,
        );
      }
    }
    if (systemGroup) {
      systemGroup.text = parser.listToText(systemGroup.list, systemGroup.text, {
        groupNameMap,
      });
    }
    set(
      groupsAtom,
      newGroups.map((group) => {
        return group.system ? { ...group } : group;
      }),
    );
    storage.setDisabledGroups(filterDisabledGroups(newGroups));
  },
);

export const groupAtomsAtom = splitAtom(
  groupsWithWriterAtom,
  (group) => group.name,
);

export const initGroupsAtom = atom(null, async (get, set) => {
  let systemHosts = await ipc.readSystemHosts().catch((error) => {
    toastError('Failed to read system hosts file', error);
    return null;
  });
  if (!systemHosts) {
    return;
  }
  if (systemHosts.includes('\r\n')) {
    systemHosts = systemHosts.replaceAll('\r\n', '\n');
  }
  const rawGroups = parser.textToGroups(systemHosts);
  const disabledGroups = storage.getDisabledGroups();
  const groups = mergeGroups(rawGroups, disabledGroups);
  if (groups.length) {
    set(currentGroupNameAtom, groups[0].name);
  }
  set(groupsAtom, groups);
  set(systemHostsAtom, systemHosts);
  if (!get(hostsHistoryAtom).length) {
    set(addHostsHistoryAtom, systemHosts);
  }
});

export const addGroupAtom = atom(null, (get, set, groupName: string) => {
  const newGroup: Group = {
    name: groupName,
    text: '',
    list: [],
    system: false,
    enabled: false,
  };
  const newGroups = get(groupsAtom).concat(newGroup);
  set(groupsAtom, newGroups);
  set(currentGroupNameAtom, groupName);
  storage.setDisabledGroups(filterDisabledGroups(newGroups));
});

export const formatAllAtom = atom(null, (get, set) => {
  const groups = get(groupsAtom);
  const newGroups = groups.map((group) => {
    return { ...group, text: parser.format(group.text) };
  });
  set(groupsAtom, newGroups);
  storage.setDisabledGroups(filterDisabledGroups(newGroups));
});

export const saveSystemHostsAtom = atom(null, async (get, set) => {
  const groups = get(groupsAtom);
  const systemGroup = groups.find((group) => group.system);
  if (!systemGroup) {
    return;
  }
  try {
    await ipc.writeSystemHosts(systemGroup.text);
  } catch (error) {
    toastError('Failed to write system hosts file', error);
    return;
  }
  set(addHostsHistoryAtom, systemGroup.text);
  set(initGroupsAtom);
});
