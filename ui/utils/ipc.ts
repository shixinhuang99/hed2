import { invoke } from '@tauri-apps/api/core';
import type { Group, Item } from '~/types';
import { storage } from './storage';
import { SYSTEM_GROUP_NAME } from '~/consts';

type RawGroup = Pick<Group, 'name' | 'text' | 'list'>;

export const ipc = {
  async getGroups(): Promise<Group[]> {
    const enabledGroups: Group[] = await invoke<RawGroup[]>('get_groups').then(
      (rawGroups) => {
        return rawGroups.map((group) => {
          return {
            ...group,
            system: group.name === SYSTEM_GROUP_NAME,
            enabled: true,
          };
        });
      },
    );
    const disabledGroups = storage.getDisabledGroups();
    return [...enabledGroups, ...disabledGroups];
  },

  isIp(text: string): Promise<boolean> {
    return invoke('is_ip', { text });
  },

  updateTextByList(list: Item[], text: string): Promise<string> {
    return invoke('update_text_by_list', { list, text });
  },
};
