"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"
import { COLORES_PROMOCION } from "@/lib/promociones/constants"
import { combinarSeriesDiarias } from "@/lib/promociones/calculations"
import type { VentasPeriodo } from "@/lib/promociones/types"

interface PromocionVentasChartProps {
  ventasPromo: VentasPeriodo
  ventasBaseline: VentasPeriodo
  isLoading?: boolean
}

const chartConfig: ChartConfig = {
  ventaPromo: {
    label: "Promoción",
    color: COLORES_PROMOCION.promo,
  },
  ventaBaseline: {
    label: "Baseline",
    color: COLORES_PROMOCION.baseline,
  },
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export function PromocionVentasChart({
  ventasPromo,
  ventasBaseline,
  isLoading,
}: PromocionVentasChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Comparativa de Ventas</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <div className="skeleton-shimmer h-full w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = combinarSeriesDiarias(
    ventasPromo.serie_diaria,
    ventasBaseline.serie_diaria
  )

  // Calcular totales para mostrar en badges
  const totalPromo = ventasPromo.totales.venta_total
  const totalBaseline = ventasBaseline.totales.venta_total
  const diferencia = totalPromo - totalBaseline
  const diferenciaPct =
    totalBaseline > 0 ? ((diferencia / totalBaseline) * 100).toFixed(1) : "0"

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comparativa de Ventas Diarias</CardTitle>
            <CardDescription>
              Promoción vs período de referencia (baseline)
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground">Promoción</p>
              <p
                className="font-bold text-lg"
                style={{ color: COLORES_PROMOCION.promo }}
              >
                {formatCurrency(totalPromo)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Baseline</p>
              <p
                className="font-bold text-lg"
                style={{ color: COLORES_PROMOCION.baseline }}
              >
                {formatCurrency(totalBaseline)}
              </p>
            </div>
            <div className="text-right border-l pl-4">
              <p className="text-muted-foreground">Diferencia</p>
              <p
                className={`font-bold text-lg ${diferencia >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {diferencia >= 0 ? "+" : ""}
                {diferenciaPct}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Día ${value}`}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              <Tooltip
                cursor={{ fill: "rgba(0, 102, 255, 0.1)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">Día {data.dia}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <span style={{ color: COLORES_PROMOCION.promo }}>
                            Promoción:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(data.ventaPromo)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span style={{ color: COLORES_PROMOCION.baseline }}>
                            Baseline:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(data.ventaBaseline)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Legend />
              <Bar
                dataKey="ventaPromo"
                name="Promoción"
                fill={COLORES_PROMOCION.promo}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="ventaBaseline"
                name="Baseline"
                fill={COLORES_PROMOCION.baseline}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
