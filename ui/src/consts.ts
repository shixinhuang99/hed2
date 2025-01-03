import { isTauri } from '@tauri-apps/api/core';
import type { Group } from '~/types';

export const EditorKind = {
  List: 'list',
  Text: 'text',
} as const;

export const NOT_EXISTS_GROUP_NAME = '__NOT_EXISTS__';

export const NOT_EXISTS_GROUP: Group = {
  name: NOT_EXISTS_GROUP_NAME,
  list: [],
  text: '',
  system: false,
  enabled: false,
};

export const IS_MAC = navigator.userAgent.includes('Mac');

export const IS_TAURI = isTauri();

export const IS_TAURI_MAC = IS_TAURI && IS_MAC;

export const Theme = {
  Dark: 'dark',
  Light: 'light',
  System: 'system',
} as const;

export const DARK_MODE_MEDIA = '(prefers-color-scheme: dark)';
