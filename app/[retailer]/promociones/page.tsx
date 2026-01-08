"use client"

import * as React from "react"
import Image from "next/image"
import { Target, RefreshCcw, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActiveRetailer } from "@/components/retailer/retailer-context"
import { getRetailerConfig, getRetailerLogo } from "@/lib/retailers/config"

import { PromocionWizard } from "@/components/promociones/promocion-wizard"
import { PromocionKpisGrid } from "@/components/promociones/promocion-kpis-grid"
import { PromocionInsightsCard } from "@/components/promociones/promocion-insights-card"
import { PromocionVentasChart } from "@/components/promociones/promocion-ventas-chart"
import { PromocionProductosTabla } from "@/components/promociones/promocion-productos-tabla"
import { PromocionCanibalizacionChart } from "@/components/promociones/promocion-canibalizacion-chart"
import { PromocionRetencionChart } from "@/components/promociones/promocion-retencion-chart"

import {
  usePromocionFiltros,
  usePromocionAnalisis,
} from "@/hooks/use-promociones"
import type { PromocionConfig } from "@/lib/promociones/types"
import { TIPOS_PROMOCION } from "@/lib/promociones/constants"

export default function PromocionesPage() {
  const { retailer, isLoading: isLoadingRetailer } = useActiveRetailer()
  const config = retailer ? getRetailerConfig(retailer.codigo) : null
  const logo = retailer ? getRetailerLogo(retailer.codigo) : null

  // Estado de la página
  const [configPromocion, setConfigPromocion] = React.useState<PromocionConfig | null>(null)
  const [mostrarResultados, setMostrarResultados] = React.useState(false)

  // Hooks de datos
  const { data: filtros, isLoading: isLoadingFiltros } = usePromocionFiltros(
    retailer?.id ?? null
  )

  const {
    data: resultado,
    isLoading: isLoadingAnalisis,
    ventasPromo,
    ventasBaseline,
  } = usePromocionAnalisis(configPromocion, retailer?.id ?? null)

  // Handlers
  function handleAnalizar(config: PromocionConfig) {
    setConfigPromocion(config)
    setMostrarResultados(true)
  }

  function handleNuevoAnalisis() {
    setConfigPromocion(null)
    setMostrarResultados(false)
  }

  function handleExportar() {
    // TODO: Implementar exportación a Excel
    console.log("Exportar resultados", resultado)
  }

  // Verificar acceso al módulo
  if (!isLoadingRetailer && config && !config.modulos.promociones) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Target className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Módulo no disponible
        </h2>
        <p className="text-muted-foreground max-w-md">
          El análisis de promociones no está disponible para este retailer.
          Esta funcionalidad requiere datos diarios de ventas.
        </p>
      </div>
    )
  }

  // Loading
  if (isLoadingRetailer) {
    return (
      <div className="space-y-6">
        <div className="skeleton-shimmer h-12 w-64" />
        <div className="skeleton-shimmer h-96 w-full rounded-2xl" />
      </div>
    )
  }

  // Obtener descripción del tipo de promoción
  const tipoPromocionConfig = configPromocion
    ? TIPOS_PROMOCION.find((t) => t.value === configPromocion.tipo)
    : null

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {logo && (
            <div className="h-10 w-10 relative">
              <Image
                src={logo}
                alt={retailer?.nombre || ""}
                fill
                className="object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Análisis de Promociones
            </h1>
            <p className="text-muted-foreground">
              {mostrarResultados && configPromocion
                ? `${tipoPromocionConfig?.label || "Promoción"} - ${configPromocion.productoIds.length} producto${configPromocion.productoIds.length !== 1 ? "s" : ""}`
                : "Evalúa el impacto de tus promociones en ventas"}
            </p>
          </div>
        </div>

        {mostrarResultados && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNuevoAnalisis}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Nuevo Análisis
            </Button>
            <Button variant="outline" onClick={handleExportar}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        )}
      </div>

      {/* Wizard o Resultados */}
      {!mostrarResultados ? (
        <PromocionWizard
          filtros={filtros}
          isLoadingFiltros={isLoadingFiltros}
          onAnalizar={handleAnalizar}
        />
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          {resultado && (
            <PromocionKpisGrid
              kpis={resultado.kpis}
              isLoading={isLoadingAnalisis}
            />
          )}

          {/* Insights Card */}
          {resultado && <PromocionInsightsCard resultado={resultado} />}

          {/* Tabs con diferentes vistas */}
          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="productos">Por Producto</TabsTrigger>
              <TabsTrigger value="canibalizacion">Canibalización</TabsTrigger>
              <TabsTrigger value="retencion">Retención</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="mt-6">
              {ventasPromo && ventasBaseline && (
                <PromocionVentasChart
                  ventasPromo={ventasPromo}
                  ventasBaseline={ventasBaseline}
                  isLoading={isLoadingAnalisis}
                />
              )}
            </TabsContent>

            <TabsContent value="productos" className="mt-6">
              {resultado && (
                <PromocionProductosTabla
                  productos={resultado.porProducto}
                  isLoading={isLoadingAnalisis}
                />
              )}
            </TabsContent>

            <TabsContent value="canibalizacion" className="mt-6">
              <PromocionCanibalizacionChart
                canibalizacion={resultado?.canibalizacion ?? null}
                isLoading={isLoadingAnalisis}
              />
            </TabsContent>

            <TabsContent value="retencion" className="mt-6">
              <PromocionRetencionChart
                retencion={resultado?.retencion ?? null}
                isLoading={isLoadingAnalisis}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
