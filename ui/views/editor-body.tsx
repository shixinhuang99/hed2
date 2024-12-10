import { EditorKind } from '~/consts';
import { ListEditor } from './list-editor';
import { TextEditor } from './text-editor';

interface EditorBodyProps {
  editorKind: string;
}

export function EditorBody(props: EditorBodyProps) {
  const { editorKind } = props;

  if (editorKind === EditorKind.List) {
    return <ListEditor />;
  }

  return <TextEditor />;
}
