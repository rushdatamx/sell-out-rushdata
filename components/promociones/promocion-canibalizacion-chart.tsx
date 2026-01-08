"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
  ReferenceLine,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { COLORES_PROMOCION, UMBRALES } from "@/lib/promociones/constants"
import type { CanibalizacionAnalisis } from "@/lib/promociones/types"

interface PromocionCanibalizacionChartProps {
  canibalizacion: CanibalizacionAnalisis | null
  isLoading?: boolean
}

const chartConfig: ChartConfig = {
  variacion: {
    label: "Variación",
    color: COLORES_PROMOCION.baseline,
  },
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export function PromocionCanibalizacionChart({
  canibalizacion,
  isLoading,
}: PromocionCanibalizacionChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Análisis de Canibalización</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <div className="skeleton-shimmer h-full w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!canibalizacion || canibalizacion.productos.length === 0) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Análisis de Canibalización
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardTitle>
          <CardDescription>
            No se detectó canibalización significativa en productos de la misma
            categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500/50" />
              <p>Sin datos de canibalización</p>
              <p className="text-sm">
                Los productos de la categoría mantuvieron sus ventas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Preparar datos para el chart
  const chartData = canibalizacion.productos
    .slice(0, 10)
    .map((p) => ({
      nombre: p.producto_nombre.length > 20
        ? p.producto_nombre.substring(0, 20) + "..."
        : p.producto_nombre,
      nombreCompleto: p.producto_nombre,
      variacion: p.variacion_pct,
      ventaPromo: p.venta_periodo_promo,
      ventaBaseline: p.venta_baseline,
    }))

  const hayCanibalizacion = canibalizacion.productosAfectados > 0

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Análisis de Canibalización
              {hayCanibalizacion ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              Variación de ventas en productos de la misma categoría
            </CardDescription>
          </div>
          <div className="text-right">
            {hayCanibalizacion ? (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">
                {canibalizacion.productosAfectados} productos afectados
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                Sin canibalización
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={["dataMin - 5", "dataMax + 5"]}
                className="text-xs"
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tickLine={false}
                axisLine={false}
                width={150}
                className="text-xs"
              />
              <Tooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{data.nombreCompleto}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            Durante promo:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(data.ventaPromo)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Baseline:</span>
                          <span className="font-medium">
                            {formatCurrency(data.ventaBaseline)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t">
                          <span className="text-muted-foreground">Variación:</span>
                          <span
                            className={`font-medium ${data.variacion >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {data.variacion >= 0 ? "+" : ""}
                            {data.variacion.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <ReferenceLine
                x={0}
                stroke="#888"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                x={UMBRALES.canibalizacion.bajo}
                stroke={COLORES_PROMOCION.negativo}
                strokeDasharray="3 3"
                label={{ value: "Umbral", position: "top", fill: "#888", fontSize: 10 }}
              />
              <Bar dataKey="variacion" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.variacion < UMBRALES.canibalizacion.bajo
                        ? COLORES_PROMOCION.negativo
                        : entry.variacion < 0
                          ? COLORES_PROMOCION.neutral
                          : COLORES_PROMOCION.positivo
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {canibalizacion.totalCanibalizacion > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm">
              <span className="font-medium text-amber-700">
                Impacto estimado:
              </span>{" "}
              <span className="text-amber-600">
                {formatCurrency(canibalizacion.totalCanibalizacion)} en ventas
                perdidas de otros productos
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
