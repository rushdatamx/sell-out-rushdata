"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
import {
  MapPin,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  LineChart,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  useAnalisisKpisYoY,
  useAnalisisCiudadesDisponibles,
} from "@/hooks/use-analisis"
import { MultiSelectFilter, FilterOption } from "@/components/ui/multi-select-filter"
import { AnalisisVentasMensualesChart } from "@/components/charts/analisis-ventas-mensuales-chart"
import { AnalisisProductosYoYChart } from "@/components/charts/analisis-productos-yoy-chart"
import { AnalisisTiendasYoYChart } from "@/components/charts/analisis-tiendas-yoy-chart"
import { AnalisisEstacionalidadChart } from "@/components/charts/analisis-estacionalidad-chart"
import { AnalisisCiudadesYoYChart } from "@/components/charts/analisis-ciudades-yoy-chart"
import { useActiveRetailer } from "@/components/retailer/retailer-context"
import { getRetailerLogo } from "@/lib/retailers/config"

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat("es-MX").format(value)
}

export default function RetailerAnalisisPage() {
  const { retailer, isLoading: isLoadingRetailer } = useActiveRetailer()
  const retailerId = retailer?.id || null

  const currentYear = new Date().getFullYear()
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(currentYear)
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<string[]>([])

  // Años disponibles para selección
  const aniosDisponibles = [currentYear, currentYear - 1, currentYear - 2]

  // Queries con retailerId
  const { data: kpis, isLoading: isLoadingKpis } = useAnalisisKpisYoY(
    anioSeleccionado,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    null,
    retailerId
  )

  // Obtener ciudades disponibles dinámicamente
  const { data: ciudadesDisponibles } = useAnalisisCiudadesDisponibles(retailerId)

  // Opciones para filtro de ciudades (dinámico basado en datos del retailer)
  const ciudadOptions: FilterOption[] = (ciudadesDisponibles || []).map(ciudad => ({
    value: ciudad,
    label: ciudad,
  }))

  const kpiCards = [
    {
      title: `Ventas ${anioSeleccionado}`,
      value: kpis ? formatCurrency(kpis.venta_actual) : "-",
      subtitle: `vs ${kpis?.anio_anterior || anioSeleccionado - 1}: ${kpis ? formatCurrency(kpis.venta_anterior) : "-"}`,
      change: kpis?.cambio_venta_pct || 0,
      icon: <BarChart3 className="h-5 w-5" />,
      color: "blue",
    },
    {
      title: `Unidades ${anioSeleccionado}`,
      value: kpis ? formatNumber(kpis.unidades_actual) : "-",
      subtitle: `vs ${kpis?.anio_anterior || anioSeleccionado - 1}: ${kpis ? formatNumber(kpis.unidades_anterior) : "-"}`,
      change: kpis?.cambio_unidades_pct || 0,
      icon: <Package className="h-5 w-5" />,
      color: "purple",
    },
    {
      title: "Tiendas Activas",
      value: kpis ? formatNumber(kpis.tiendas_actual) : "-",
      subtitle: `${kpis?.productos_actual || 0} productos`,
      icon: <Store className="h-5 w-5" />,
      color: "cyan",
    },
    {
      title: "Transacciones",
      value: kpis ? formatNumber(kpis.transacciones_actual) : "-",
      subtitle: `vs ${kpis?.anio_anterior || anioSeleccionado - 1}: ${kpis ? formatNumber(kpis.transacciones_anterior) : "-"}`,
      change: kpis ? Math.round(100 * (kpis.transacciones_actual - kpis.transacciones_anterior) / (kpis.transacciones_anterior || 1)) : 0,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "green",
    },
  ]

  if (isLoadingRetailer) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 premium-bg gradient-overlay min-h-screen">
      {/* Header */}
      <div className="sticky-header-blur flex items-center justify-between">
        <div className="flex items-center gap-4">
          {retailer && (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: `${retailer.color_hex}20` }}
            >
              {getRetailerLogo(retailer.codigo) ? (
                <Image
                  src={getRetailerLogo(retailer.codigo)!}
                  alt={`Logo ${retailer.nombre}`}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <LineChart className="w-6 h-6" style={{ color: retailer.color_hex }} />
              )}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Análisis - {retailer?.nombre || ""}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Comparativo Year-over-Year y estacionalidad
              <span className="w-2 h-2 rounded-full bg-green-500 pulse-soft" />
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="rounded-2xl border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Selector de año */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select
                value={anioSeleccionado.toString()}
                onValueChange={(v) => setAnioSeleccionado(parseInt(v))}
              >
                <SelectTrigger className="w-[120px] h-9 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aniosDisponibles.map((anio) => (
                    <SelectItem key={anio} value={anio.toString()}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">vs {anioSeleccionado - 1}</span>
            </div>

            {/* Ciudad Multiselect */}
            <MultiSelectFilter
              title="Ciudad"
              icon={<MapPin className="h-4 w-4" />}
              options={ciudadOptions}
              selectedValues={ciudadesSeleccionadas}
              onSelectionChange={setCiudadesSeleccionadas}
              searchPlaceholder="Buscar ciudad..."
            />
          </div>
        </CardContent>
      </Card>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="rounded-2xl overflow-hidden hover-lift group">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {kpi.title}
                </p>
                <div className={cn(
                  "p-1.5 rounded-lg",
                  kpi.color === "blue" && "bg-blue-100 text-blue-600",
                  kpi.color === "purple" && "bg-purple-100 text-purple-600",
                  kpi.color === "cyan" && "bg-cyan-100 text-cyan-600",
                  kpi.color === "green" && "bg-green-100 text-green-600",
                )}>
                  {kpi.icon}
                </div>
              </div>
              {isLoadingKpis ? (
                <div className="space-y-2">
                  <div className="skeleton-shimmer h-8 w-24" />
                  <div className="skeleton-shimmer h-3 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl premium-number gradient-text">
                      {kpi.value}
                    </p>
                    {kpi.change !== undefined && (
                      <Badge
                        variant={kpi.change >= 0 ? "default" : "destructive"}
                        className={cn(
                          "mb-1 gap-0.5",
                          kpi.change >= 0 ? "bg-green-500" : "bg-red-500"
                        )}
                      >
                        {kpi.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(kpi.change)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {kpi.subtitle}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfica de Ventas Mensuales YoY */}
      <AnalisisVentasMensualesChart
        anio={anioSeleccionado}
        ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
        retailerId={retailerId}
      />

      {/* Row de Productos y Tiendas */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalisisProductosYoYChart
          anio={anioSeleccionado}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
          retailerId={retailerId}
        />
        <AnalisisTiendasYoYChart
          anio={anioSeleccionado}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
          retailerId={retailerId}
        />
      </div>

      {/* Row de Estacionalidad y Ciudades */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalisisEstacionalidadChart
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
          retailerId={retailerId}
        />
        <AnalisisCiudadesYoYChart
          anio={anioSeleccionado}
          retailerId={retailerId}
        />
      </div>
    </div>
  )
}
