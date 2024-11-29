import { Tabs, TabsList, TabsTrigger } from '~/components/tabs';
import { EditorKind } from '~/enum';

interface EditorHeaderProps {
  editorKind: string;
  onEditorKindChange: (v: string) => void;
}

export function EditorHeader(props: EditorHeaderProps) {
  const { editorKind, onEditorKindChange } = props;

  return (
    <div className="w-full h-14 flex justify-between items-center px-4 py-1 border-b border-border/40 bg-background/95 dark:border-border">
      <Tabs value={editorKind} onValueChange={onEditorKindChange}>
        <TabsList>
          <TabsTrigger value={EditorKind.List}>LIST</TabsTrigger>
          <TabsTrigger value={EditorKind.Text}>TEXT</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
