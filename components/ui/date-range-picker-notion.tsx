"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerNotionProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  minDate?: Date
  maxDate?: Date
}

const presets = [
  {
    label: "Últimos 7 días",
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "Últimos 30 días",
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: "Últimos 90 días",
    getValue: () => ({ from: subDays(new Date(), 90), to: new Date() }),
  },
  {
    label: "Este mes",
    getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    label: "Mes anterior",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "Este año",
    getValue: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
]

export function DateRangePickerNotion({
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
}: DateRangePickerNotionProps) {
  const [open, setOpen] = React.useState(false)

  const handlePresetClick = (preset: typeof presets[0]) => {
    onDateRangeChange(preset.getValue())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start text-left font-normal gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80 hover:border-primary/30 transition-all duration-200",
            !dateRange?.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4 text-primary/70" />
          {dateRange?.from ? (
            dateRange.to ? (
              <span className="font-medium">
                {format(dateRange.from, "d MMM", { locale: es })} – {format(dateRange.to, "d MMM yyyy", { locale: es })}
              </span>
            ) : (
              <span className="font-medium">{format(dateRange.from, "d MMM yyyy", { locale: es })}</span>
            )
          ) : (
            <span>Seleccionar período</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-border/50 shadow-xl shadow-black/10 bg-background/95 backdrop-blur-xl"
        align="start"
        sideOffset={8}
      >
        <div className="flex">
          {/* Presets sidebar */}
          <div className="flex flex-col gap-1 p-3 border-r border-border/50 min-w-[140px] bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Acceso rápido</p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start h-8 px-2 text-sm font-normal hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={es}
              className="rounded-lg"
              classNames={{
                months: "flex gap-6",
                month: "space-y-3",
                caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
                caption_label: "text-sm font-semibold",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted rounded-md transition-all",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "text-muted-foreground w-9 font-normal text-xs",
                row: "flex w-full mt-1",
                cell: cn(
                  "relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: cn(
                  "h-9 w-9 p-0 font-normal text-xs rounded-md transition-all hover:bg-muted aria-selected:opacity-100"
                ),
                day_range_start: "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_range_end: "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground/40 aria-selected:bg-primary/5 aria-selected:text-muted-foreground",
                day_disabled: "text-muted-foreground/30",
                day_range_middle: "aria-selected:bg-primary/15 aria-selected:text-foreground",
                day_hidden: "invisible",
              }}
              disabled={(date) => {
                if (minDate && date < minDate) return true
                if (maxDate && date > maxDate) return true
                return false
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
