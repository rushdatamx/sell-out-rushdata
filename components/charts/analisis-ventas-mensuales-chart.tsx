"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { useAnalisisVentasMensualesYoY } from "@/hooks/use-analisis"
import { BarChart3 } from "lucide-react"

interface AnalisisVentasMensualesChartProps {
  anio: number
  ciudades?: string[] | null
  productoIds?: number[] | null
}

const chartConfig = {
  venta_actual: {
    label: "Año Actual",
    color: "#0066FF",
  },
  venta_anterior: {
    label: "Año Anterior",
    color: "#94A3B8",
  },
} satisfies ChartConfig

export function AnalisisVentasMensualesChart({
  anio,
  ciudades,
  productoIds,
}: AnalisisVentasMensualesChartProps) {
  const { data: ventas, isLoading } = useAnalisisVentasMensualesYoY(
    anio,
    ciudades,
    productoIds
  )

  const chartData = ventas?.map((item) => ({
    mes: item.mes_nombre,
    venta_actual: item.venta_actual,
    venta_anterior: item.venta_anterior,
    cambio_pct: item.cambio_pct,
  })) || []

  const totalActual = chartData.reduce((sum, item) => sum + item.venta_actual, 0)
  const totalAnterior = chartData.reduce((sum, item) => sum + item.venta_anterior, 0)

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Ventas Mensuales Comparativas
            </CardTitle>
            <CardDescription>{anio} vs {anio - 1}</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-blue-50">
              <p className="text-[10px] text-muted-foreground">{anio}</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(totalActual)}</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-100">
              <p className="text-[10px] text-muted-foreground">{anio - 1}</p>
              <p className="text-sm font-bold text-slate-500">{formatCurrency(totalAnterior)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="skeleton-shimmer h-full w-full rounded-lg" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatCurrency}
                width={60}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <p className="font-medium text-sm mb-2">{data.mes}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-600">
                          {anio}: <span className="font-medium">{formatCurrency(data.venta_actual)}</span>
                        </p>
                        <p className="text-slate-500">
                          {anio - 1}: <span className="font-medium">{formatCurrency(data.venta_anterior)}</span>
                        </p>
                        <p className={`font-medium ${data.cambio_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                          Cambio: {data.cambio_pct >= 0 ? "+" : ""}{data.cambio_pct}%
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="venta_actual"
                fill="#0066FF"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type="monotone"
                dataKey="venta_anterior"
                stroke="#94A3B8"
                strokeWidth={2}
                dot={{ fill: "#94A3B8", r: 4 }}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
