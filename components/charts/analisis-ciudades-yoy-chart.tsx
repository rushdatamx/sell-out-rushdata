"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell, CartesianGrid } from "recharts"
import { useAnalisisCiudadesYoY } from "@/hooks/use-analisis"
import { MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AnalisisCiudadesYoYChartProps {
  anio: number
  productoIds?: number[] | null
  retailerId?: number | null
}

const chartConfig = {
  venta_actual: {
    label: "Venta Actual",
    color: "#0066FF",
  },
} satisfies ChartConfig

const cityColors = ["#0066FF", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"]

export function AnalisisCiudadesYoYChart({
  anio,
  productoIds,
  retailerId,
}: AnalisisCiudadesYoYChartProps) {
  const { data: ciudades, isLoading } = useAnalisisCiudadesYoY(anio, productoIds, retailerId)

  const chartData = (ciudades || []).map((item, index) => ({
    ciudad: item.ciudad || "",
    tiendas: item.tiendas || 0,
    venta_actual: item.venta_actual || 0,
    venta_anterior: item.venta_anterior || 0,
    cambio_pct: item.cambio_pct || 0,
    color: cityColors[index % cityColors.length],
  }))

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  const totalActual = chartData.reduce((sum, item) => sum + item.venta_actual, 0)

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Ventas por Ciudad
            </CardTitle>
            <CardDescription>Comparativo YoY por ciudad</CardDescription>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-green-50">
            <p className="text-[10px] text-muted-foreground">Total {anio}</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(totalActual)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="skeleton-shimmer h-full w-full rounded-lg" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatCurrency}
              />
              <YAxis
                type="category"
                dataKey="ciudad"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={90}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <p className="font-medium text-sm mb-2">{data.ciudad}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-600 font-medium">
                          {anio}: {formatCurrency(data.venta_actual)}
                        </p>
                        <p className="text-muted-foreground">
                          {anio - 1}: {formatCurrency(data.venta_anterior)}
                        </p>
                        <p className={`font-medium ${data.cambio_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                          Cambio: {data.cambio_pct >= 0 ? "+" : ""}{data.cambio_pct}%
                        </p>
                        <p className="text-muted-foreground">
                          Tiendas: <span className="font-medium">{data.tiendas}</span>
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="venta_actual"
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
                label={({ x, y, width, height, value, index }) => {
                  const item = chartData[index]
                  return (
                    <text
                      x={x + width + 5}
                      y={y + height / 2}
                      fill={item.cambio_pct >= 0 ? "#22C55E" : "#EF4444"}
                      fontSize={10}
                      dominantBaseline="middle"
                    >
                      {item.cambio_pct >= 0 ? "+" : ""}{item.cambio_pct}%
                    </text>
                  )
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No hay datos de ciudades
          </div>
        )}
      </CardContent>
    </Card>
  )
}
