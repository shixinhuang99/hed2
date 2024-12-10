import { useAtomValue, useSetAtom, type PrimitiveAtom, useAtom } from 'jotai';
import {
  Ban,
  Check,
  Copy,
  EllipsisVertical,
  FilePenLine,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
  currentGroupAtom,
  deleteItemAtom,
  setEnabledHostsAtom,
  setItemIpAtom,
  itemAtomsAtom,
  setSameGroupItemAtom,
} from '~/atom';
import { Badge, Button, ScrollArea } from '~/components';
import { AdvancedInput } from '~/components/advanced-input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '~/components/toggle-group';
import type { Host, Item } from '~/types';
import { ipc } from '~/utils/ipc';
import { NOT_EXISTS_GROUP_NAME } from '~/consts';

export function ListEditor() {
  const currentGroup = useAtomValue(currentGroupAtom);

  if (currentGroup.name === NOT_EXISTS_GROUP_NAME) {
    return null;
  }

  return (
    <ScrollArea className="flex-1 px-3">
      <List />
    </ScrollArea>
  );
}

function List() {
  const itemAtoms = useAtomValue(itemAtomsAtom);

  return itemAtoms.map((itemAtom) => (
    <ListItem key={`${itemAtom}`} itemAtom={itemAtom} />
  ));
}

function ListItem(props: { itemAtom: PrimitiveAtom<Item> }) {
  const { itemAtom } = props;

  const [item, setItem] = useAtom(itemAtom);
  const setSameGroupItem = useSetAtom(setSameGroupItemAtom);

  const handleItemChange = (v: Partial<Item>) => {
    const newItem = { ...item, ...v };
    setItem(newItem);
    setSameGroupItem(item.ip, newItem);
  };

  return (
    <div className="border border-border/50 dark:border-border rounded-md mt-3 p-4 last:mb-3">
      <Title ip={item.ip} group={item.group} onItemChagne={handleItemChange} />
      <Hosts ip={item.ip} hosts={item.hosts} />
    </div>
  );
}

function Title(
  props: Pick<Item, 'ip' | 'group'> & {
    onItemChagne: (v: Partial<Item>) => void;
  },
) {
  const { ip, group, onItemChagne } = props;

  const currentGroup = useAtomValue(currentGroupAtom);
  const [showIpInput, setShowIpInput] = useState(false);

  const handleEditIp = () => {
    setShowIpInput(true);
  };

  const handleEditIpCancel = () => {
    setShowIpInput(false);
  };

  const handleEditIpOk = (newIp: string) => {
    if (newIp !== ip) {
      onItemChagne({ ip: newIp });
    }
    setShowIpInput(false);
  };

  const handleIpValidate = async (newIp: string) => {
    if (newIp === ip) {
      return;
    }
    const isIp = await ipc.isIp(newIp);
    if (!isIp) {
      return `\`${newIp}\` is not a valid ip`;
    }
  };

  const handleItemDelete = () => {
    // deleteItem(ip);
  };

  const showBedge = currentGroup.system && group !== 'System';

  return (
    <div className="flex justify-between pb-4 group">
      <div className="flex items-center gap-2">
        {showBedge && <Badge className="leading-3">{group}</Badge>}
        {showIpInput ? (
          <AdvancedInput
            className="w-[320px]"
            name="newIp"
            placeholder={ip}
            initValue={ip}
            onOk={handleEditIpOk}
            onCancel={handleEditIpCancel}
            onValidate={handleIpValidate}
            selectAllWhenMounted
          />
        ) : (
          <span className="select-text cursor-text text-lg font-semibold">
            {ip}
          </span>
        )}
        {!showIpInput && (
          <Button
            className="group-hover:visible invisible"
            variant="ghost"
            size="icon"
            onClick={handleEditIp}
          >
            <FilePenLine />
          </Button>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem destructive onClick={handleItemDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Hosts(props: { ip: string; hosts: Host[] }) {
  const { ip, hosts } = props;

  const setEnabledHosts = useSetAtom(setEnabledHostsAtom);

  const enabledHosts = hosts
    .filter((host) => host.enabled)
    .map((host) => host.content);

  const handleEnabledHostsChange = (v: string[]) => {
    setEnabledHosts(ip, v);
  };

  const handleCopy = (v: string) => {
    navigator.clipboard.writeText(v);
  };

  return (
    <ToggleGroup
      className="flex-wrap justify-start gap-2"
      type="multiple"
      variant="outline"
      value={enabledHosts}
      onValueChange={handleEnabledHostsChange}
    >
      {hosts.map((host) => {
        return (
          <ToggleGroupItem
            key={host.content}
            value={host.content}
            size="lg"
            className="px-0"
          >
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex items-center gap-2 h-full w-full px-2.5">
                  <span>{host.content}</span>
                  {host.enabled ? (
                    <Check className="text-green-400" />
                  ) : (
                    <Ban className="text-slate-400" />
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleCopy(host.content)}>
                  <Copy />
                  Copy
                </ContextMenuItem>
                <ContextMenuItem destructive>
                  <Trash2 />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
