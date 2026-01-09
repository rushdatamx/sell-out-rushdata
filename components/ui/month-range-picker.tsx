"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, setMonth, setYear, getYear, getMonth } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MonthRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  minDate?: Date
  maxDate?: Date
}

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const presets = [
  {
    label: "Últimos 3 meses",
    getValue: () => {
      const now = new Date()
      return {
        from: startOfMonth(subMonths(now, 2)),
        to: endOfMonth(now),
      }
    },
  },
  {
    label: "Últimos 6 meses",
    getValue: () => {
      const now = new Date()
      return {
        from: startOfMonth(subMonths(now, 5)),
        to: endOfMonth(now),
      }
    },
  },
  {
    label: "Este año",
    getValue: () => {
      const now = new Date()
      return {
        from: startOfYear(now),
        to: endOfMonth(now),
      }
    },
  },
  {
    label: "Año anterior",
    getValue: () => {
      const lastYear = subMonths(new Date(), 12)
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
      }
    },
  },
]

export function MonthRangePicker({
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
}: MonthRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(() => {
    if (dateRange?.to) return getYear(dateRange.to)
    if (maxDate) return getYear(maxDate)
    return getYear(new Date())
  })
  const [selectingStart, setSelectingStart] = React.useState(true)

  const handlePresetClick = (preset: typeof presets[0]) => {
    onDateRangeChange(preset.getValue())
    setOpen(false)
  }

  const handleMonthClick = (monthIndex: number) => {
    const selectedDate = setMonth(setYear(new Date(), viewYear), monthIndex)

    if (selectingStart) {
      // Seleccionando inicio
      onDateRangeChange({
        from: startOfMonth(selectedDate),
        to: undefined,
      })
      setSelectingStart(false)
    } else {
      // Seleccionando fin
      if (dateRange?.from) {
        const fromDate = dateRange.from
        const toDate = startOfMonth(selectedDate)

        // Asegurar que from <= to
        if (toDate < fromDate) {
          onDateRangeChange({
            from: startOfMonth(toDate),
            to: endOfMonth(fromDate),
          })
        } else {
          onDateRangeChange({
            from: startOfMonth(fromDate),
            to: endOfMonth(toDate),
          })
        }
      }
      setSelectingStart(true)
      setOpen(false)
    }
  }

  const isMonthInRange = (monthIndex: number) => {
    if (!dateRange?.from) return false
    const monthDate = setMonth(setYear(new Date(), viewYear), monthIndex)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    if (dateRange.to) {
      return monthStart >= startOfMonth(dateRange.from) && monthEnd <= endOfMonth(dateRange.to)
    }

    return getYear(dateRange.from) === viewYear && getMonth(dateRange.from) === monthIndex
  }

  const isMonthStart = (monthIndex: number) => {
    if (!dateRange?.from) return false
    return getYear(dateRange.from) === viewYear && getMonth(dateRange.from) === monthIndex
  }

  const isMonthEnd = (monthIndex: number) => {
    if (!dateRange?.to) return false
    return getYear(dateRange.to) === viewYear && getMonth(dateRange.to) === monthIndex
  }

  const isMonthDisabled = (monthIndex: number) => {
    const monthDate = setMonth(setYear(new Date(), viewYear), monthIndex)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    if (minDate && monthEnd < minDate) return true
    if (maxDate && monthStart > maxDate) return true
    return false
  }

  const canGoToPrevYear = () => {
    if (!minDate) return true
    return viewYear > getYear(minDate)
  }

  const canGoToNextYear = () => {
    if (!maxDate) return true
    return viewYear < getYear(maxDate)
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
                {format(dateRange.from, "MMM yyyy", { locale: es })} – {format(dateRange.to, "MMM yyyy", { locale: es })}
              </span>
            ) : (
              <span className="font-medium">{format(dateRange.from, "MMM yyyy", { locale: es })}</span>
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

          {/* Month grid */}
          <div className="p-4">
            {/* Year navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewYear(viewYear - 1)}
                disabled={!canGoToPrevYear()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{viewYear}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewYear(viewYear + 1)}
                disabled={!canGoToNextYear()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Selection hint */}
            <p className="text-xs text-muted-foreground text-center mb-3">
              {selectingStart ? "Selecciona mes inicio" : "Selecciona mes fin"}
            </p>

            {/* Month grid */}
            <div className="grid grid-cols-4 gap-2">
              {monthNames.map((month, index) => {
                const inRange = isMonthInRange(index)
                const isStart = isMonthStart(index)
                const isEnd = isMonthEnd(index)
                const disabled = isMonthDisabled(index)

                return (
                  <Button
                    key={month}
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className={cn(
                      "h-10 w-16 text-sm font-normal transition-all",
                      inRange && !isStart && !isEnd && "bg-primary/15 text-foreground",
                      (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                      disabled && "text-muted-foreground/30 cursor-not-allowed",
                      !inRange && !disabled && "hover:bg-muted"
                    )}
                    onClick={() => handleMonthClick(index)}
                  >
                    {month}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
