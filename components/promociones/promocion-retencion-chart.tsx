"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { COLORES_PROMOCION, INTERPRETACIONES } from "@/lib/promociones/constants"
import type { RetencionAnalisis } from "@/lib/promociones/types"

interface PromocionRetencionChartProps {
  retencion: RetencionAnalisis | null
  isLoading?: boolean
}

const chartConfig: ChartConfig = {
  venta: {
    label: "Ventas",
    color: COLORES_PROMOCION.postPromo,
  },
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function getRetencionIcon(interpretacion: RetencionAnalisis["interpretacion"]) {
  switch (interpretacion) {
    case "excelente":
    case "buena":
      return <TrendingUp className="h-5 w-5 text-green-500" />
    case "baja":
      return <TrendingDown className="h-5 w-5 text-red-500" />
    default:
      return <Minus className="h-5 w-5 text-amber-500" />
  }
}

function getRetencionBadge(interpretacion: RetencionAnalisis["interpretacion"]) {
  const colors = {
    excelente: "bg-green-500/10 text-green-700",
    buena: "bg-green-500/10 text-green-700",
    regular: "bg-amber-500/10 text-amber-700",
    baja: "bg-red-500/10 text-red-700",
  }

  const labels = {
    excelente: "Excelente",
    buena: "Buena",
    regular: "Regular",
    baja: "Baja",
  }

  return (
    <Badge variant="secondary" className={colors[interpretacion]}>
      {labels[interpretacion]}
    </Badge>
  )
}

export function PromocionRetencionChart({
  retencion,
  isLoading,
}: PromocionRetencionChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Retención Post-Promoción</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <div className="skeleton-shimmer h-full w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!retencion || retencion.ventasDiariasPostPromo.length === 0) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Retención Post-Promoción</CardTitle>
          <CardDescription>
            No hay datos suficientes para analizar la retención
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <div className="text-center">
              <Minus className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>Sin datos de retención</p>
              <p className="text-sm">
                Puede que no hayan pasado suficientes días post-promoción
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Preparar datos para el chart
  const chartData = retencion.ventasDiariasPostPromo.map((d, index) => ({
    dia: index + 1,
    fecha: d.fecha,
    fechaFormateada: format(new Date(d.fecha), "d MMM", { locale: es }),
    venta: d.venta,
  }))

  const indiceRetencionPct = (retencion.indiceRetencion * 100).toFixed(0)
  const indiceVsBaselinePct = (retencion.indiceVsBaseline * 100).toFixed(0)

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Retención Post-Promoción
              {getRetencionIcon(retencion.interpretacion)}
            </CardTitle>
            <CardDescription>
              Comportamiento de ventas después de terminar la promoción
            </CardDescription>
          </div>
          {getRetencionBadge(retencion.interpretacion)}
        </div>
      </CardHeader>
      <CardContent>
        {/* KPIs de retención */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Durante Promo</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(retencion.ventaPromedioDurantePromo)}
            </p>
            <p className="text-xs text-muted-foreground">promedio/día</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Post-Promo</p>
            <p
              className="text-lg font-bold"
              style={{ color: COLORES_PROMOCION.postPromo }}
            >
              {formatCurrency(retencion.ventaPromedioPostPromo)}
            </p>
            <p className="text-xs text-muted-foreground">promedio/día</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Índice Retención</p>
            <p
              className={`text-lg font-bold ${
                retencion.indiceRetencion >= 0.5
                  ? "text-green-500"
                  : retencion.indiceRetencion >= 0.3
                    ? "text-amber-500"
                    : "text-red-500"
              }`}
            >
              {indiceRetencionPct}%
            </p>
            <p className="text-xs text-muted-foreground">vs durante promo</p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVenta" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORES_PROMOCION.postPromo}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORES_PROMOCION.postPromo}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="fechaFormateada"
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-1">
                        Día {data.dia} post-promo
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {data.fechaFormateada}
                      </p>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Ventas:</span>
                        <span className="font-medium">
                          {formatCurrency(data.venta)}
                        </span>
                      </div>
                    </div>
                  )
                }}
              />
              <ReferenceLine
                y={retencion.ventaPromedioBaseline}
                stroke={COLORES_PROMOCION.baseline}
                strokeDasharray="5 5"
                label={{
                  value: "Baseline",
                  position: "right",
                  fill: COLORES_PROMOCION.baseline,
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={retencion.ventaPromedioDurantePromo}
                stroke={COLORES_PROMOCION.promo}
                strokeDasharray="5 5"
                label={{
                  value: "Durante promo",
                  position: "right",
                  fill: COLORES_PROMOCION.promo,
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="venta"
                stroke={COLORES_PROMOCION.postPromo}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVenta)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 p-3 rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {INTERPRETACIONES.retencion[retencion.interpretacion]}
            {retencion.indiceVsBaseline > 1 && (
              <span className="text-green-600 font-medium">
                {" "}
                Las ventas post-promo están {indiceVsBaselinePct}% por encima
                del baseline.
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
