"use client"

import { LayoutGrid } from "lucide-react"
import { useRetailersSummary } from "@/hooks/use-retailer-summary"
import { RetailerCard, RetailerCardSkeleton } from "./retailer-card"

export function RetailerHub() {
  const { data: retailers, isLoading, error } = useRetailersSummary()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-500 mb-2">Error al cargar las cadenas</div>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <LayoutGrid className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tus Cadenas</h1>
          <p className="text-muted-foreground">
            Selecciona una cadena para ver su dashboard
          </p>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Skeletons mientras carga
          <>
            <RetailerCardSkeleton />
            <RetailerCardSkeleton />
            <RetailerCardSkeleton />
          </>
        ) : retailers && retailers.length > 0 ? (
          // Cards de retailers
          retailers.map((retailer) => (
            <RetailerCard key={retailer.id} retailer={retailer} />
          ))
        ) : (
          // Estado vacío
          <div className="col-span-full">
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <LayoutGrid className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No hay cadenas configuradas</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Contacta al administrador para configurar las cadenas comerciales
                de tu cuenta.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer informativo */}
      {retailers && retailers.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-4">
          {retailers.length} cadena{retailers.length !== 1 ? "s" : ""} activa{retailers.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}
