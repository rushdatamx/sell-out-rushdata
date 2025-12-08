"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import { VentasMensualesChart } from "@/components/charts/ventas-mensuales-chart"
import { TopProductosChart } from "@/components/charts/top-productos-chart"
import { TopTiendasChart } from "@/components/charts/top-tiendas-chart"
import { MixCategoriasChart } from "@/components/charts/mix-categorias-chart"
import { EstacionalidadSemanalWidget } from "@/components/charts/estacionalidad-semanal-widget"

// Configuración de colores de RushData
const chartConfig = {
  value: {
    label: "Value",
    color: "#0066FF",
  },
} satisfies ChartConfig

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

function formatDateRange(fechaInicio: string, fechaFin: string): string {
  const inicio = new Date(fechaInicio + "T00:00:00")
  const fin = new Date(fechaFin + "T00:00:00")

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short"
  }

  return `${inicio.toLocaleDateString("es-MX", formatOptions)} - ${fin.toLocaleDateString("es-MX", formatOptions)}, ${fin.getFullYear()}`
}

export default function DashboardPage() {
  const [diasSeleccionados, setDiasSeleccionados] = useState<string>("30")
  const { data: metrics, isLoading, error } = useDashboardMetrics(Number(diasSeleccionados))

  // Datos para sparklines basados en métricas reales
  const ventasSparkline = metrics?.ventasPorDia.map((d) => ({ value: d.value })) || []

  // Generar sparkline inverso para quiebres
  const quiebresSparkline = [...ventasSparkline].reverse()

  const kpis = [
    {
      title: "Ventas Totales",
      value: metrics ? formatCurrency(metrics.ventasTotales) : "-",
      change: metrics ? formatPercent(metrics.cambioVentas) : "-",
      changeValue: metrics?.cambioVentas || 0,
      changeText: `vs ${diasSeleccionados} días anteriores`,
      data: ventasSparkline,
    },
    {
      title: "Unidades Vendidas",
      value: metrics ? formatNumber(metrics.unidadesVendidas) : "-",
      change: metrics ? formatPercent(metrics.cambioUnidades) : "-",
      changeValue: metrics?.cambioUnidades || 0,
      changeText: `vs ${diasSeleccionados} días anteriores`,
      data: ventasSparkline,
    },
    {
      title: "Quiebres de Stock",
      value: metrics ? formatNumber(metrics.quiebresStock) : "-",
      change: metrics ? formatPercent(metrics.cambioQuiebres) : "-",
      changeValue: metrics?.cambioQuiebres || 0,
      changeText: `vs ${diasSeleccionados} días anteriores`,
      data: quiebresSparkline,
    },
    {
      title: "SKUs Activos",
      value: metrics ? formatNumber(metrics.skusActivos) : "-",
      change: metrics ? formatPercent(metrics.cambioSkus) : "-",
      changeValue: metrics?.cambioSkus || 0,
      changeText: `vs ${diasSeleccionados} días anteriores`,
      data: ventasSparkline,
    },
  ]

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-red-500">Error al cargar las métricas</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 premium-bg gradient-overlay min-h-screen">
      {/* Header with sticky blur */}
      <div className="sticky-header-blur flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {isLoading
              ? "Cargando..."
              : metrics
                ? formatDateRange(metrics.fechaInicio, metrics.ultimaFecha)
                : "Datos en tiempo real"
            }
            {!isLoading && <span className="w-2 h-2 rounded-full bg-green-500 pulse-soft" title="Datos actualizados" />}
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={diasSeleccionados}
          onValueChange={(value) => {
            if (value) setDiasSeleccionados(value)
          }}
          className="bg-muted rounded-xl p-1 shadow-sm border"
        >
          <ToggleGroupItem
            value="30"
            aria-label="Últimos 30 días"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            30 días
          </ToggleGroupItem>
          <ToggleGroupItem
            value="60"
            aria-label="Últimos 60 días"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            60 días
          </ToggleGroupItem>
          <ToggleGroupItem
            value="90"
            aria-label="Últimos 90 días"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            90 días
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="rounded-2xl overflow-hidden p-0 hover-lift group">
            <CardContent className="p-0">
              <div className="p-6 pb-0">
                <p className="text-sm text-muted-foreground font-medium">
                  {kpi.title}
                </p>
                {isLoading ? (
                  <div className="mt-2 space-y-2">
                    <div className="skeleton-shimmer h-10 w-32" />
                    <div className="skeleton-shimmer h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <p className="text-4xl premium-number mt-2 gradient-text group-hover:glow-blue transition-all duration-300">
                      {kpi.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className={`font-semibold ${kpi.changeValue >= 0 ? "gradient-text-success" : "gradient-text-warning"}`}>
                        {kpi.change}
                      </span>{" "}
                      {kpi.changeText}
                    </p>
                  </>
                )}
              </div>
              <ChartContainer config={chartConfig} className="h-[100px] w-full mt-4">
                <AreaChart
                  data={kpi.data.length > 0 ? kpi.data : [{ value: 0 }, { value: 0 }]}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={`fillGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066FF" stopOpacity={0.25} />
                      <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id={`strokeGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0066FF" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={`url(#strokeGradient-${index})`}
                    strokeWidth={2.5}
                    fill={`url(#fillGradient-${index})`}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ventas Mensuales YoY - Full Width */}
      <VentasMensualesChart />

      {/* Top Productos y Top Tiendas */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopProductosChart dias={Number(diasSeleccionados)} />
        <TopTiendasChart dias={Number(diasSeleccionados)} />
      </div>

      {/* Mix por Categoría y Estacionalidad */}
      <div className="grid gap-6 md:grid-cols-2">
        <MixCategoriasChart dias={Number(diasSeleccionados)} />
        <EstacionalidadSemanalWidget dias={Number(diasSeleccionados)} />
      </div>

      {/* Crecimiento del Período */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Growth Indicator - Premium */}
        <Card className="rounded-2xl overflow-hidden relative hover-lift">
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/8 via-[#06B6D4]/5 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <CardContent className="pt-6 h-full flex flex-col justify-center relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Crecimiento del Período</h3>
                <p className={`text-5xl premium-number ${metrics && metrics.cambioVentas >= 0 ? 'gradient-text glow-blue' : 'gradient-text-warning'}`}>
                  {metrics ? formatPercent(metrics.cambioVentas) : "-"}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  Comparado con los {diasSeleccionados} días anteriores
                </p>
                {metrics && (
                  <div className="mt-5 space-y-2">
                    <p className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
                      <span className="text-muted-foreground">Ventas período actual:</span>
                      <span className="font-semibold">{formatCurrency(metrics.ventasTotales)}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                      <span className="text-muted-foreground">Unidades vendidas:</span>
                      <span className="font-semibold">{formatNumber(metrics.unidadesVendidas)}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-[#0066FF]/20 to-[#06B6D4]/10 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(0,102,255,0.3)]">
                {metrics && metrics.cambioVentas >= 0 ? (
                  <TrendingUp className="h-14 w-14 text-[#0066FF]" />
                ) : (
                  <TrendingDown className="h-14 w-14 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
