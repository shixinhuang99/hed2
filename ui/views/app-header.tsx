import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { RefreshCcw } from 'lucide-react';
import { Button } from '~/components';
import { Icons } from '~/components/icons';
import { ThemeToggle } from './theme-toggle';
import { initGroupsAtom } from '~/atom';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '~/components/tooltip';

export function AppHeader() {
  return (
    <header className="w-full h-14 flex justify-between items-center px-4 py-1 border-b border-border/50 dark:border-border">
      <div>
        <span className="font-bold text-lg">Hed2</span>
        <span className="font-light text-xs ml-2">0.1.0</span>
      </div>
      <div className="flex items-center gap-1.5">
        <RefreshButton />
        <ViewGitHubButton />
        <ThemeToggle />
      </div>
    </header>
  );
}

function RefreshButton() {
  const initGroups = useSetAtom(initGroupsAtom);

  useEffect(() => {
    initGroups();
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={initGroups}>
          <RefreshCcw />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <TooltipArrow />
        Refresh groups
      </TooltipContent>
    </Tooltip>
  );
}

function ViewGitHubButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icons.GitHub />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <TooltipArrow />
        View GitHub
      </TooltipContent>
    </Tooltip>
  );
}
