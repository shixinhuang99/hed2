import { useState } from 'react';
import { EditorKind } from '~/consts';
import { EditorBody } from './editor-body';
import { EditorHeader } from './editor-header';

export function Editor() {
  const [editorKind, setEditorKind] = useState<string>(EditorKind.List);

  return (
    <>
      <EditorHeader
        editorKind={editorKind}
        onEditorKindChange={setEditorKind}
      />
      <EditorBody editorKind={editorKind} />
    </>
  );
}
