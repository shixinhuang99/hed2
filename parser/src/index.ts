import { isIP } from 'is-ip';

type Line =
  | {
      type: 'valid';
      value: {
        ip: string;
        hosts: string[];
        enabled: boolean;
      };
    }
  | { type: 'empty' }
  | { type: 'group'; value: string }
  | { type: 'other'; value: string };

export interface Item {
  ip: string;
  hosts: Host[];
  group: string;
}

export interface Host {
  content: string;
  enabled: boolean;
}

export interface Group {
  name: string;
  text: string;
  list: Item[];
}

export const SYSTEM_GROUP = 'System';

function splitWhitespace(text: string): string[] {
  return text.replaceAll('\r\n', '\n').split('\n');
}

export function textToLines(text: string): Line[] {
  const lines: Line[] = [];

  for (const line of splitWhitespace(text)) {
    const tokens = line.split(' ').filter((s) => s.length);

    if (!tokens.length) {
      lines.push({ type: 'empty' });
      continue;
    }

    if (tokens.length === 1) {
      const token = tokens[0];
      if (token.length > 3 && token.startsWith('#[') && token.endsWith(']')) {
        lines.push({
          type: 'group',
          value: token.slice(2, token.length - 1).trim(),
        });
        continue;
      }
    }

    if (tokens.length > 1) {
      const enabled = tokens[0] !== '#';
      const mayIp = tokens[enabled ? 0 : 1];

      if (isIP(mayIp)) {
        const hosts: string[] = [];
        const skip = enabled ? 1 : 2;

        for (const host of tokens.slice(skip)) {
          const sharpIdx = host.indexOf('#');
          if (sharpIdx !== -1) {
            const slice = host.slice(0, sharpIdx);
            if (slice.length) {
              hosts.push(slice);
            }
            break;
          }
          hosts.push(host);
        }

        if (hosts.length) {
          lines.push({
            type: 'valid',
            value: {
              ip: mayIp,
              hosts,
              enabled,
            },
          });
          continue;
        }
      }
    }

    lines.push({ type: 'other', value: line.trim() });
  }

  return lines;
}

export function linesToList(lines: Line[], group?: string): Item[] {
  const itemMap: Map<string, Item> = new Map();
  const tmpMap: Map<string, Item> = new Map();
  let currentGroup = group ?? SYSTEM_GROUP;

  for (const line of lines) {
    if (line.type === 'valid') {
      const { ip, hosts: hostStrs, enabled } = line.value;

      if (!hostStrs.length) {
        continue;
      }

      const hosts: Host[] = hostStrs.map((content) => {
        return { content, enabled };
      });

      const key = `${currentGroup}_${ip}`;

      const item = tmpMap.get(key);
      if (item) {
        item.hosts.push(...hosts);
      } else {
        tmpMap.set(key, { ip, hosts, group: currentGroup });
      }
    } else if (line.type === 'group') {
      const { value: groupName } = line;

      if (
        group ||
        groupName === SYSTEM_GROUP ||
        (currentGroup !== SYSTEM_GROUP && currentGroup !== groupName)
      ) {
        continue;
      }

      for (const [k, v] of tmpMap) {
        const item = itemMap.get(k);
        if (item) {
          item.hosts.push(...v.hosts);
        } else {
          itemMap.set(k, v);
        }
      }

      tmpMap.clear();

      if (currentGroup === groupName) {
        currentGroup = SYSTEM_GROUP;
      } else {
        currentGroup = groupName;
      }
    }
  }

  if (tmpMap.size) {
    for (const [k, v] of tmpMap) {
      if (!group) {
        v.group = SYSTEM_GROUP;
      }
      const item = itemMap.get(k);
      if (item) {
        item.hosts.push(...v.hosts);
      } else {
        itemMap.set(k, v);
      }
    }
  }

  for (const item of itemMap.values()) {
    item.hosts = [...new Set(item.hosts)];
  }

  return [...itemMap.values()];
}

interface Range {
  start: number;
  end: number;
}

export function textToGroups(text: string): Group[] {
  const lines = textToLines(text);
  const rangeMap: Map<string, Range[]> = new Map();
  const currentRange: Range = { start: 0, end: 0 };
  let currentGroup: string | null = null;

  lines.forEach((line, idx) => {
    if (line.type !== 'group' || line.value === SYSTEM_GROUP) {
      return;
    }

    const { value: group } = line;

    if (currentGroup) {
      if (currentGroup === group) {
        currentGroup = null;
        currentRange.end = idx;
        const ranges = rangeMap.get(group);
        if (ranges) {
          ranges.push({ ...currentRange });
        } else {
          rangeMap.set(group, [{ ...currentRange }]);
        }
      }
    } else {
      currentGroup = group;
      currentRange.start = idx;
    }
  });

  const rawLines = splitWhitespace(text);
  const groupMap: Map<string, Group> = new Map();

  for (const [group, ranges] of rangeMap) {
    const vs: string[] = [];
    for (const range of ranges) {
      vs.push(...rawLines.slice(range.start, range.end));
    }
    groupMap.set(group, { name: group, text: vs.join('\n'), list: [] });
  }

  const systemGroup: Group = {
    name: SYSTEM_GROUP,
    text,
    list: linesToList(lines),
  };

  for (const item of systemGroup.list) {
    const group = groupMap.get(item.group);
    if (group) {
      group.list.push(item);
    }
  }

  return [systemGroup, ...groupMap.values()];
}

function chunk(hosts: Host[], count: number): Host[][] {
  const result: Host[][] = [];
  let currentChunk: Host[] = [];

  for (const host of hosts) {
    if (currentChunk.length >= count) {
      result.push([...currentChunk]);
      currentChunk = [];
    }
    currentChunk.push(host);
  }

  if (currentChunk.length) {
    result.push(currentChunk);
  }

  return result;
}

function hostsChunk(hosts: Host[], ip: string): Line[] {
  const lines: Line[] = [];

  const enabledHosts = [];
  const disabledHosts = [];

  for (const host of hosts) {
    if (host.enabled) {
      enabledHosts.push(host);
    } else {
      disabledHosts.push(host);
    }
  }

  const mapFn = (chunk: Host[], enabled: boolean): Line => {
    return {
      type: 'valid',
      value: { ip, hosts: chunk.map((v) => v.content), enabled },
    };
  };

  lines.push(...chunk(enabledHosts, 10).map((v) => mapFn(v, true)));
  lines.push(...chunk(disabledHosts, 10).map((v) => mapFn(v, false)));

  return lines;
}

export function listToLines(list: Item[], oldLines: Line[]): Line[] {
  const lines: Line[] = [];
  const sysHostsMap: Map<string, Host[]> = new Map();
  const otherItemMap: Map<string, Item[]> = new Map();

  for (const item of list) {
    if (item.group === SYSTEM_GROUP) {
      const hosts = sysHostsMap.get(item.ip);
      if (hosts) {
        hosts.push(...item.hosts);
      } else {
        sysHostsMap.set(item.ip, item.hosts);
      }
    } else {
      const items = otherItemMap.get(item.group);
      if (items) {
        items.push(item);
      } else {
        otherItemMap.set(item.group, [item]);
      }
    }
  }

  let currentGroup: string | null = null;

  const pushItemToLines = (items: Item[], group: string) => {
    lines.push({ type: 'group', value: group });
    let first = true;
    for (const item of items) {
      if (!first) {
        lines.push({ type: 'empty' });
      }
      lines.push(...hostsChunk(item.hosts, item.ip));
      first = false;
    }
    lines.push({ type: 'group', value: group });
  };

  for (const line of oldLines) {
    if (line.type === 'valid') {
      if (currentGroup) {
        continue;
      }

      const { ip } = line.value;

      const hosts = sysHostsMap.get(ip);
      if (hosts) {
        if (!hosts.length) {
          lines.push({ type: 'empty' });
          continue;
        }
        lines.push(...hostsChunk(hosts, ip));
        sysHostsMap.set(ip, []);
      } else {
        lines.push({ type: 'empty' });
      }
    } else if (line.type === 'group') {
      const { value: group } = line;

      if (group === SYSTEM_GROUP) {
        continue;
      }

      if (currentGroup) {
        if (currentGroup === group) {
          currentGroup = null;
          const items = otherItemMap.get(group);
          if (!items?.length) {
            continue;
          }
          pushItemToLines(items, group);
          otherItemMap.set(group, []);
        }
      } else {
        currentGroup = group;
      }
    } else {
      lines.push(line);
    }
  }

  for (const [ip, hosts] of sysHostsMap) {
    if (!hosts.length) {
      continue;
    }
    lines.push({ type: 'empty' });
    lines.push(...hostsChunk(hosts, ip));
  }

  for (const [group, items] of otherItemMap) {
    if (!items.length) {
      continue;
    }
    lines.push({ type: 'empty' });
    pushItemToLines(items, group);
  }

  return lines;
}

export function linesToText(lines: Line[]): string {
  const textLines: string[] = [];
  let isPreEmpty = lines.length > 0 && lines[0].type === 'empty';

  for (const line of lines) {
    if (line.type === 'valid') {
      const { ip, hosts, enabled } = line.value;
      const vs: string[] = [];
      if (!enabled) {
        vs.push('#');
      }
      vs.push(ip);
      vs.push(...hosts);
      textLines.push(vs.join(' '));
    }
    if (line.type === 'group') {
      textLines.push(`#[${line.value}]`);
    }
    if (line.type === 'other') {
      textLines.push(line.value);
    }
    if (line.type === 'empty') {
      if (!isPreEmpty) {
        textLines.push('');
      }
    }
    isPreEmpty = line.type === 'empty';
  }

  if (!isPreEmpty) {
    textLines.push('');
  }

  return textLines.join('\n');
}

export function listToText(
  list: Item[],
  oldText: string,
  group?: string,
): string {
  const lines = textToLines(oldText);
  if (group) {
    lines.unshift({ type: 'group', value: group });
    lines.push({ type: 'group', value: group });
  }
  let newLines = listToLines(list, lines);
  if (group) {
    newLines = newLines.filter((line) => line.type !== 'group');
  }
  return linesToText(newLines);
}

export function textToList(text: string, group?: string): Item[] {
  const lines = textToLines(text);
  return linesToList(lines, group);
}

export const parser = {
  textToGroups,
  listToText,
  textToList,
};

export { isIP };
