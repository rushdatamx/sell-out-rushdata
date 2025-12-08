"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface FilterOption {
  value: string
  label: string
  sublabel?: string
}

interface MultiSelectFilterProps {
  title: string
  icon?: React.ReactNode
  options: FilterOption[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxDisplay?: number
}

export function MultiSelectFilter({
  title,
  icon,
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  searchPlaceholder = "Buscar...",
  maxDisplay = 2,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onSelectionChange(newValues)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange([])
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selectedValues.filter((v) => v !== value))
  }

  const selectedLabels = selectedValues
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 px-3 py-1.5 rounded-full border-dashed gap-1 font-normal hover:bg-accent/50 transition-colors",
            selectedValues.length > 0 && "border-solid bg-accent/30"
          )}
        >
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className={cn(
            "text-sm",
            selectedValues.length === 0 && "text-muted-foreground"
          )}>
            {title}
          </span>

          {selectedValues.length > 0 && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <div className="flex gap-1 flex-wrap">
                {selectedLabels.slice(0, maxDisplay).map((label, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="rounded-md px-1.5 py-0 text-xs font-normal h-5 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {label}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 hover:text-destructive cursor-pointer"
                      onClick={(e) => handleRemove(selectedValues[i], e)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRemove(selectedValues[i], e as unknown as React.MouseEvent)}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {selectedValues.length > maxDisplay && (
                  <Badge
                    variant="secondary"
                    className="rounded-md px-1.5 py-0 text-xs font-normal h-5"
                  >
                    +{selectedValues.length - maxDisplay}
                  </Badge>
                )}
              </div>
              <span
                role="button"
                tabIndex={0}
                className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </>
          )}

          {selectedValues.length === 0 && (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.sublabel && (
                        <span className="text-xs text-muted-foreground">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onSelectionChange([])}
                    className="justify-center text-center text-sm text-muted-foreground cursor-pointer"
                  >
                    Limpiar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
