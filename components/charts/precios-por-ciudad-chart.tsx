"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { usePreciosPorCiudad } from "@/hooks/use-precios"
import { MapPin } from "lucide-react"

interface PreciosPorCiudadChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  productoIds?: number[] | null
}

const chartConfig = {
  precio_promedio: {
    label: "Precio Promedio",
    color: "#0066FF",
  },
} satisfies ChartConfig

const colors = ["#0066FF", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"]

export function PreciosPorCiudadChart({
  fechaInicio,
  fechaFin,
  productoIds,
}: PreciosPorCiudadChartProps) {
  const { data: ciudades, isLoading } = usePreciosPorCiudad(
    fechaInicio,
    fechaFin,
    productoIds
  )

  const chartData = ciudades?.map((item, index) => ({
    ciudad: item.ciudad,
    precio_promedio: item.precio_promedio,
    precio_min: item.precio_min,
    precio_max: item.precio_max,
    tiendas: item.tiendas,
    productos: item.productos,
    transacciones: item.transacciones,
    coef_variacion: item.coef_variacion,
    color: colors[index % colors.length],
  })) || []

  const precioGlobal = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.precio_promedio * item.transacciones, 0) /
      chartData.reduce((sum, item) => sum + item.transacciones, 0)
    : 0

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-500" />
              Precio por Ciudad
            </CardTitle>
            <CardDescription>Comparativo de precios promedio</CardDescription>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100">
            <p className="text-[10px] text-muted-foreground">Prom. Global</p>
            <p className="text-sm font-bold text-slate-700">${precioGlobal.toFixed(2)}</p>
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
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="ciudad"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={100}
                tickLine={false}
                axisLine={false}
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
                          Promedio: {formatCurrency(data.precio_promedio)}
                        </p>
                        <p className="text-muted-foreground">
                          Rango: <span className="text-green-600">{formatCurrency(data.precio_min)}</span> - <span className="text-red-500">{formatCurrency(data.precio_max)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Tiendas: <span className="font-medium">{data.tiendas}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Transacciones: <span className="font-medium">{data.transacciones.toLocaleString()}</span>
                        </p>
                        <p className="text-muted-foreground">
                          CV: <span className={`font-medium ${data.coef_variacion > 15 ? "text-red-500" : "text-green-600"}`}>{data.coef_variacion}%</span>
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="precio_promedio"
                radius={[0, 4, 4, 0]}
                maxBarSize={35}
                label={{
                  position: "right",
                  formatter: (value: number) => formatCurrency(value),
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
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
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de precios por ciudad
          </div>
        )}
      </CardContent>
    </Card>
  )
}
