import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Plus, Search, FilePenLine, Trash2 } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import {
  addGroupAtom,
  currentGroupNameAtom,
  groupsAtom,
  renameGroupAtom,
  toggleGroupEnableAtom,
  deleteGroupAtom,
  groupNamesAtom,
} from '~/atom';
import { Button, Input, ScrollArea, Switch } from '~/components';
import { AdvancedInput } from '~/components/advanced-input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/context-menu';
import type { Group } from '~/types';
import { checkGroupExists } from '~/utils/group';

export function GroupPanel() {
  const [search, setSearch] = useState<string>('');
  const deferredSearch = useDeferredValue(search);
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);

  const handleAddGroupClick = () => {
    setShowNewGroupInput(true);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-background">
      <div className="h-14 px-3 flex items-center relative gap-1">
        <Search className="pointer-events-auto absolute left-5 size-4 top-1/2 -translate-y-1/2 select-none opacity-50" />
        <Input
          className="bg-white dark:bg-black pl-8 placeholder:italic"
          placeholder="Search group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          name="searchGroup"
        />
        <Button variant="ghost" size="icon" onClick={handleAddGroupClick}>
          <Plus />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-3 pb-2">
        <GroupList search={deferredSearch} />
        <NewGroupInput
          show={showNewGroupInput}
          onShowChange={setShowNewGroupInput}
        />
      </ScrollArea>
    </div>
  );
}

function GroupList(props: { search: string }) {
  const { search } = props;

  const groups = useAtomValue(groupsAtom);

  return groups
    .filter((group) => group.name.includes(search))
    .map((group) => <GroupButton key={group.name} group={group} />);
}

function GroupButton(props: { group: Group }) {
  const { group } = props;

  const [currentGroupName, setCurrentGroupName] = useAtom(currentGroupNameAtom);
  const groupNames = useAtomValue(groupNamesAtom);
  const renameGroup = useSetAtom(renameGroupAtom);
  const [renameInputVisible, setRenameInputVisible] = useState(false);
  const toggleGroupEnable = useSetAtom(toggleGroupEnableAtom);
  const deleteGroup = useSetAtom(deleteGroupAtom);

  const handleClick = () => {
    if (group.name === currentGroupName) {
      return;
    }
    setCurrentGroupName(group.name);
  };

  const handleGroupRename = () => {
    setRenameInputVisible(true);
  };

  const handleGroupRenameOk = (newName: string) => {
    if (newName !== group.name) {
      renameGroup(group.name, newName);
    }
    setRenameInputVisible(false);
  };

  const handleGroupRenameCancel = () => {
    setRenameInputVisible(false);
  };

  const handleGroupRenameValidate = (newName: string) => {
    if (newName === group.name) {
      return;
    }
    return checkGroupExists(groupNames, newName);
  };

  const handleToggleGroupEnable = () => {
    toggleGroupEnable(group.name);
  };

  const handleDeleteGroup = () => {
    deleteGroup(group.name);
  };

  if (renameInputVisible) {
    return (
      <div className="px-0.5 pt-2.5 pb-1">
        <AdvancedInput
          name="newGroupName"
          placeholder={group.name}
          initValue={group.name}
          onOk={handleGroupRenameOk}
          onCancel={handleGroupRenameCancel}
          onValidate={handleGroupRenameValidate}
          maxLength={50}
          selectAllWhenMounted
        />
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          className="w-full min-h-12 h-auto justify-between mt-1 cursor-pointer"
          asChild
          variant={currentGroupName === group.name ? 'default' : 'ghost'}
          onClick={handleClick}
        >
          <div>
            <div className="whitespace-normal break-all text-left truncate">
              {group.name}
            </div>
            {!group.system && (
              <Switch
                className="ml-4"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                checked={group.enabled}
                onCheckedChange={handleToggleGroupEnable}
              />
            )}
          </div>
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={group.system} onClick={handleGroupRename}>
          <FilePenLine />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          disabled={group.system}
          destructive
          onClick={handleDeleteGroup}
        >
          <Trash2 />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function NewGroupInput(props: {
  show: boolean;
  onShowChange: (v: boolean) => void;
}) {
  const { show, onShowChange } = props;

  const groupNames = useAtomValue(groupNamesAtom);
  const addGroup = useSetAtom(addGroupAtom);

  const handleNewGroupCancel = () => {
    onShowChange(false);
  };

  const handleNewGroupOk = (name: string) => {
    addGroup(name);
    onShowChange(false);
  };

  const handleNewGroupValidate = (name: string) => {
    return checkGroupExists(groupNames, name);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="px-0.5 py-1 mt-1">
      <AdvancedInput
        placeholder="Group name"
        name="groupName"
        onOk={handleNewGroupOk}
        onValidate={handleNewGroupValidate}
        onCancel={handleNewGroupCancel}
        maxLength={50}
      />
    </div>
  );
}
