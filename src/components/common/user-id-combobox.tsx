'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePlayers } from '@/hooks/players';

interface UserIdComboboxProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
  excludeIds?: number[]; // Danh sách ID người dùng cần loại trừ khỏi kết quả
}

function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd');
}

export function UserIdCombobox({
  value,
  onChange,
  excludeIds,
  disabled = false,
}: UserIdComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { players } = usePlayers();
  const [internalValue, setInternalValue] = React.useState(value);
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);



  const selectedCategoryJudge = React.useMemo(
    () => players.filter((a) => internalValue.includes(a.id)),
    [players, internalValue],
  );

  const handleSelect = (newValue: number[]) => {
    onChange(newValue);
    setInternalValue(newValue);
  };

  const handleClear = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onChange([]);
    setInternalValue([]);
  };

  const customFilter = (value: string, search: string): number => {
    const unaccentedValue = removeAccents(value.toLowerCase());
    const unaccentedSearch = removeAccents(search.toLowerCase());

    return unaccentedValue.includes(unaccentedSearch) ? 1 : 0;
  };

  return (
    <Popover open={open} onOpenChange={setOpen} >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !selectedCategoryJudge && 'text-muted-foreground',
          )}
          disabled={disabled}
        >
          <span className=" overflow-hidden">
            {selectedCategoryJudge.length>0
              ? `${selectedCategoryJudge[0].name} ${selectedCategoryJudge.length> 1? "+"+( selectedCategoryJudge.length-1): ""}`
              : 'Chặt 2'}
          </span>
          <div className="ml-2">
            {selectedCategoryJudge ? (
              <X
                className="h-4 w-4 shrink-0 opacity-50 cursor-pointer hover:opacity-100"
                onClick={handleClear}
              />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 ">
        <Command filter={customFilter}>
          <CommandInput placeholder="Tìm kiếm" />
          <CommandList>
            <CommandEmpty>Không tìm thấy</CommandEmpty>
            <CommandGroup>
              {players
                .filter((player) => !excludeIds?.includes(player.id))
                .map((p) => {
                  return (
                    <CommandItem
                      key={p.id}
                      value={`${p.name}`}
                      onSelect={() => {
                      if (internalValue.includes(p.id))
                        handleSelect([
                          ...internalValue.filter((id) => id !== p.id),
                        ]);
                      else handleSelect([...internalValue, p.id]);
                    }}
                    // className={cn(
                    //   isDisabled && 'opacity-50 cursor-not-allowed',
                    // )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        internalValue.includes(p.id)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    <span className="text-sm">{p.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
