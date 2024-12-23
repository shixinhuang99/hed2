import fs from 'node:fs/promises';
import path from 'node:path';
import {
  SYSTEM_GROUP,
  linesToList,
  linesToText,
  listToLines,
  listToText,
  textToGroups,
  textToLines,
} from 'hed2-parser';
import { expect, test } from 'vitest';

function snapshotFile(name: string) {
  return path.join('__snapshots__', `${name}.snap`);
}

test('test parser', async () => {
  const mockText = await fs.readFile(path.join('parser', 'fixture', 'hosts'), {
    encoding: 'utf-8',
  });

  const lines = textToLines(mockText);
  await expect(lines).toMatchFileSnapshot(snapshotFile('text-to-lines'));

  const list = linesToList(lines);
  await expect(list).toMatchFileSnapshot(snapshotFile('lines-to-list'));

  for (const item of list) {
    if (item.ip === '1.1.1.1') {
      item.hosts.pop();
      item.hosts.push({ content: 'o.com', enabled: true });
      item.hosts.push({ content: '13.com', enabled: false });
    } else if (item.ip === '3.3.3.3' && item.group === 'foo') {
      item.hosts.push({ content: 'd.com', enabled: true });
    }
  }

  list.push({
    ip: '2.2.2.2',
    hosts: [
      { content: 'foo.com', enabled: true },
      { content: 'bar.com', enabled: false },
    ],
    group: 'Another Group',
  });

  const newLines = listToLines(list, lines);
  await expect(newLines).toMatchFileSnapshot(snapshotFile('list-to-lines'));

  const text = linesToText(newLines);
  await expect(text).toMatchFileSnapshot(snapshotFile('lines-to-text'));

  const groups = textToGroups(mockText);
  await expect(groups).toMatchFileSnapshot(snapshotFile('text-to-groups'));

  const nonSystemGroup = groups.find((group) => group.name !== SYSTEM_GROUP);
  expect(nonSystemGroup).toBeTruthy();
  if (nonSystemGroup) {
    const nonSystemGroupText = listToText(
      nonSystemGroup.list,
      nonSystemGroup.text,
      nonSystemGroup.name,
    );
    await expect(nonSystemGroupText).toMatchFileSnapshot(
      snapshotFile('list-to-text'),
    );
  }
});
