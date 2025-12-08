"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface DateRange {
  from: Date
  to: Date
}

interface FiltersContextType {
  dateRange: DateRange | null
  selectedProducts: string[]
  selectedClients: string[]
  dateFilter: "30" | "60" | "90" | "custom" | null
  setDateRange: (range: DateRange | null) => void
  setSelectedProducts: (products: string[]) => void
  setSelectedClients: (clients: string[]) => void
  setDateFilter: (filter: "30" | "60" | "90" | "custom" | null) => void
  resetFilters: () => void
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<"30" | "60" | "90" | "custom" | null>(null)

  const resetFilters = () => {
    setDateRange(null)
    setSelectedProducts([])
    setSelectedClients([])
    setDateFilter(null)
  }

  return (
    <FiltersContext.Provider
      value={{
        dateRange,
        selectedProducts,
        selectedClients,
        dateFilter,
        setDateRange,
        setSelectedProducts,
        setSelectedClients,
        setDateFilter,
        resetFilters,
      }}
    >
      {children}
    </FiltersContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FiltersContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FiltersProvider")
  }
  return context
}
