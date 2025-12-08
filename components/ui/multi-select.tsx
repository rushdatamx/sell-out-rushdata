"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  id: number | string
  nombre: string
}

interface MultiSelectProps {
  options: Option[]
  selected: (number | string)[]
  onChange: (selected: (number | string)[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleccionar...",
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleOption = (id: number | string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const removeOption = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== id))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedOptions = options.filter((opt) => selected.includes(opt.id))

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center justify-between gap-2 px-3 py-2 h-10 text-sm",
          "border border-input rounded-md bg-background",
          "hover:bg-primary/5 hover:border-primary/50",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "transition-colors",
          selected.length > 0 ? "min-w-[140px] border-primary/30" : "min-w-[120px]"
        )}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.length === 1 ? (
                <span className="truncate max-w-[100px]">{selectedOptions[0].nombre}</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {selected.length} seleccionados
                </span>
              )}
            </>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 min-w-[200px] mt-1 bg-popover border border-primary/20 rounded-md shadow-lg">
          {/* Header with Clear button */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10 bg-primary/5">
              <span className="text-xs font-medium text-foreground">
                {selected.length} seleccionado{selected.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-52 p-1">
            {options.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No hay opciones
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.id)
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm",
                      "hover:bg-primary/10",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-primary/30"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className={cn("flex-1 truncate", isSelected && "font-medium text-primary")}>
                      {option.nombre}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
