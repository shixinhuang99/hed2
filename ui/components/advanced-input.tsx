import { useEffect, useRef, useState } from 'react';
import { cn } from '~/utils/cn';
import { Input } from './input';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';

interface AdvancedInputProps
  extends Pick<
    React.ComponentProps<'input'>,
    'className' | 'placeholder' | 'name' | 'maxLength'
  > {
  initValue?: string;
  onOk: (v: string) => void;
  onValidate?: (v: string) => string | Promise<string | undefined> | undefined;
  onCancel?: () => void;
  selectAllWhenMounted?: boolean;
}

export function AdvancedInput(props: AdvancedInputProps) {
  const {
    className,
    initValue,
    onOk,
    onValidate,
    onCancel,
    selectAllWhenMounted,
    ...restProps
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initValue || '');
  const [err, setErr] = useState('');

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (selectAllWhenMounted) {
        inputRef.current.select();
      }
    }
  }, []);

  const handleOk = async () => {
    if (err) {
      return;
    }
    const finalValue = value.trim();
    if (!finalValue && onCancel) {
      onCancel();
      return;
    }
    if (onValidate) {
      const ret = onValidate(finalValue);
      if (ret instanceof Promise) {
        const err = await ret;
        if (err) {
          setErr(err);
          return;
        }
      } else {
        if (ret) {
          setErr(ret);
          return;
        }
      }
    }
    onOk(finalValue);
  };

  return (
    <Tooltip open={!!err}>
      <TooltipTrigger asChild>
        <Input
          ref={inputRef}
          className={cn(
            'bg-white dark:bg-black placeholder:italic data-[state=instant-open]:border-red-500 data-[state=instant-open]:focus-visible:ring-red-500',
            className,
          )}
          value={value}
          onChange={(e) => {
            if (err) {
              setErr('');
            }
            setValue(e.target.value);
          }}
          onBlur={handleOk}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleOk();
            } else if (e.key === 'Escape' && onCancel) {
              onCancel();
            }
          }}
          {...restProps}
        />
      </TooltipTrigger>
      <TooltipContent className="bg-red-500">
        <TooltipArrow className="fill-red-500 dark:fill-bg-500" />
        {err}
      </TooltipContent>
    </Tooltip>
  );
}
