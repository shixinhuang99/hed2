import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/resizable';
import { TooltipProvider } from '~/components/tooltip';
import { ThemeProvider } from '~/context/theme';
import { AppHeader } from '~/views/app-header';
import { Editor } from '~/views/editor';
import { GroupPanel } from '~/views/groups';

export function App() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <ThemeProvider>
        <TooltipProvider delayDuration={100}>
          <AppHeader />
          <ResizablePanelGroup
            className="select-none"
            direction="horizontal"
            autoSaveId="main"
          >
            <ResizablePanel defaultSize={20} minSize={20} maxSize={30}>
              <GroupPanel />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel className="flex flex-col" defaultSize={80}>
              <Editor />
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>
      </ThemeProvider>
    </div>
  );
}
