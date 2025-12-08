"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell, ReferenceLine } from "recharts"
import { useReabastecimientoFillRate } from "@/hooks/use-reabastecimiento"
import { Percent } from "lucide-react"

interface ReabastecimientoFillRateChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  ciudades?: string[] | null
}

const chartConfig = {
  fill_rate: {
    label: "Fill Rate",
    color: "#0066FF",
  },
} satisfies ChartConfig

export function ReabastecimientoFillRateChart({
  fechaInicio,
  fechaFin,
  ciudades,
}: ReabastecimientoFillRateChartProps) {
  const { data: productos, isLoading } = useReabastecimientoFillRate(
    fechaInicio,
    fechaFin,
    ciudades,
    12
  )

  const chartData = productos?.map((item) => ({
    nombre: item.producto.length > 25 ? item.producto.substring(0, 25) + "..." : item.producto,
    nombreCompleto: item.producto,
    fill_rate: item.fill_rate,
    dias_con_stock: item.dias_con_stock,
    dias_sin_stock: item.dias_sin_stock,
    dias_totales: item.dias_totales,
  })) || []

  const getBarColor = (fillRate: number) => {
    if (fillRate >= 95) return "#22C55E" // green
    if (fillRate >= 80) return "#F59E0B" // amber
    return "#EF4444" // red
  }

  const avgFillRate = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.fill_rate, 0) / chartData.length
    : 0

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-500" />
              Fill Rate por Producto
            </CardTitle>
            <CardDescription>% de días con stock disponible (menor a mayor)</CardDescription>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50">
            <p className="text-[10px] text-muted-foreground">Promedio</p>
            <p className="text-sm font-bold text-blue-600">{avgFillRate.toFixed(1)}%</p>
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
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={140}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine x={90} stroke="#22C55E" strokeDasharray="3 3" />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <p className="font-medium text-sm mb-2">{data.nombreCompleto}</p>
                      <div className="space-y-1 text-sm">
                        <p className={`font-medium ${data.fill_rate >= 90 ? "text-green-600" : data.fill_rate >= 70 ? "text-amber-600" : "text-red-600"}`}>
                          Fill Rate: {data.fill_rate}%
                        </p>
                        <p className="text-muted-foreground">
                          Días con stock: <span className="font-medium text-green-600">{data.dias_con_stock}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Días sin stock: <span className="font-medium text-red-500">{data.dias_sin_stock}</span>
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="fill_rate"
                radius={[0, 4, 4, 0]}
                label={{
                  position: "right",
                  formatter: (value: number) => `${value}%`,
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.fill_rate)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de fill rate disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
