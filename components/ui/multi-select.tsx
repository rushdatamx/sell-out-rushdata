"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"

interface Option {
  id: number
  nombre: string
}

interface MultiSelectProps {
  options: Option[]
  selected: number[]
  onChange: (selected: number[]) => void
  placeholder?: string
  label?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleccionar...",
  label,
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

  const toggleOption = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const removeOption = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== id))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedOptions = options.filter((opt) => selected.includes(opt.id))

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex flex-wrap gap-1.5 min-h-[20px]">
            {selected.length === 0 ? (
              <span className="text-sm text-gray-500">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((option) => (
                  <span
                    key={option.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                  >
                    {option.nombre}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-blue-900"
                      onClick={(e) => removeOption(option.id, e)}
                    />
                  </span>
                ))}
                {selected.length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                    +{selected.length - 2} más
                  </span>
                )}
              </>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Header with Clear button */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
              <span className="text-xs font-semibold text-gray-600">
                {selected.length} seleccionado{selected.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-52">
            {options.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500">
                No hay opciones disponibles
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.id)
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOption(option.id)}
                        className="sr-only"
                      />
                      <div
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <span
                      className={`text-sm flex-1 ${
                        isSelected ? "font-medium text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {option.nombre}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
