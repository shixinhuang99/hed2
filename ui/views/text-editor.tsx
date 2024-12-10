import { useAtomValue } from 'jotai';
import { currentGroupAtom, systemHostsTextDraftAtom } from '~/atom';

export function TextEditor() {
  const currentGroup = useAtomValue(currentGroupAtom);
  const systemHostsTextDraft = useAtomValue(systemHostsTextDraftAtom);

  if (!currentGroup) {
    return null;
  }

  return (
    <div className="whitespace-pre overflow-auto flex-1">
      {currentGroup.system ? systemHostsTextDraft : currentGroup.text}
    </div>
  );
}
