"use client";

import { Button } from "@packages/ui/components/button";
import { Calendar } from "@packages/ui/components/calendar";
import { cn } from "@packages/ui/lib/utils";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export interface DateRangePreset {
   label: string;
   value: string;
}

export interface DateRangePickerProps {
   presets: DateRangePreset[];
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
