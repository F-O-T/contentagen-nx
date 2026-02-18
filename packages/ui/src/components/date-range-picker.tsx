"use client";

import { Button } from "@packages/ui/components/button";
import { Calendar } from "@packages/ui/components/calendar";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

function CalendarDropdown({
   value,
   onChange,
   options,
   components: _components,
   classNames: _classNames,
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
   components?: unknown;
   classNames?: unknown;
   options?: { value: number; label: string; disabled?: boolean }[];
}) {
   return (
      <Select
         onValueChange={(v) => {
            const event = {
               target: { value: v },
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange?.(event);
         }}
         value={String(value)}
      >
         <SelectTrigger className="h-7 w-auto min-w-[70px] border-input text-sm font-medium gap-1 focus:ring-0 focus:ring-offset-0 shadow-none cursor-pointer">
            <SelectValue />
         </SelectTrigger>
         <SelectContent>
            {options?.map((opt) => (
               <SelectItem
                  disabled={opt.disabled}
                  key={opt.value}
                  value={String(opt.value)}
               >
                  {opt.label}
               </SelectItem>
            ))}
         </SelectContent>
      </Select>
   );
}

export interface DateRangePreset {
   label: string;
   value: string;
}

export interface DateRangePickerProps {
   presets: readonly DateRangePreset[];
   selectedPreset?: string | null;
   selectedRange?: { from: Date; to?: Date } | null;
   onPresetSelect: (value: string) => void;
   onRangeSelect: (range: { from: Date; to: Date }) => void;
   heading?: string;
}

export function DateRangePicker({
   presets,
   selectedPreset,
   selectedRange,
   onPresetSelect,
   onRangeSelect,
   heading = "Período",
}: DateRangePickerProps) {
   const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
      selectedRange
         ? { from: selectedRange.from, to: selectedRange.to }
         : undefined,
   );

   useEffect(() => {
      setPendingRange(
         selectedRange
            ? { from: selectedRange.from, to: selectedRange.to }
            : undefined,
      );
   }, [selectedRange]);

   const handlePresetClick = (value: string) => {
      setPendingRange(undefined);
      onPresetSelect(value);
   };

   const handleCalendarSelect = (range: DateRange | undefined) => {
      setPendingRange(range);
      if (range?.from && range?.to) {
         onRangeSelect({ from: range.from, to: range.to });
      }
   };

   const calendarSelected: DateRange | undefined =
      pendingRange ??
      (selectedRange
         ? { from: selectedRange.from, to: selectedRange.to }
         : undefined);

   return (
      <div className="flex">
         {/* Left: preset list */}
         <div className="flex flex-col gap-1 p-2 min-w-[160px] border-r">
            {heading && (
               <p className="text-xs font-medium text-muted-foreground px-2 pb-1 pt-0.5 uppercase tracking-wide">
                  {heading}
               </p>
            )}
            {presets.map((preset) => {
               const isActive =
                  selectedPreset === preset.value && !pendingRange?.from;
               return (
                  <Button
                     className="justify-start text-sm font-normal"
                     key={preset.value}
                     onClick={() => handlePresetClick(preset.value)}
                     size="sm"
                     variant={isActive ? "default" : "ghost"}
                  >
                     {preset.label}
                  </Button>
               );
            })}
         </div>

         {/* Right: dual-month calendar */}
         <div className="p-2">
            <Calendar
               captionLayout="dropdown"
               classNames={{
                  months: "flex gap-0 flex-col md:flex-row relative",
                  // react-day-picker v9 renders a <nav> as the 1st child of the months container,
                  // so month panels start at position 2. n+3 targets the 2nd month panel (position 3)
                  // to add a divider. If upgrading react-day-picker, verify nav placement hasn't changed.
                  month: "flex flex-col w-full gap-4 px-2 pb-2 [&:nth-child(n+3)]:border-l",
               }}
               components={{ Dropdown: CalendarDropdown }}
               fromYear={2020}
               mode="range"
               numberOfMonths={2}
               onSelect={handleCalendarSelect}
               selected={calendarSelected}
               toYear={new Date().getFullYear()}
            />
         </div>
      </div>
   );
}
