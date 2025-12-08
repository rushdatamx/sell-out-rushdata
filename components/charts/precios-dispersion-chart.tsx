"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell, ReferenceLine, ErrorBar } from "recharts"
import { usePreciosDispersion } from "@/hooks/use-precios"
import { BarChart3 } from "lucide-react"

interface PreciosDispersionChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  ciudades?: string[] | null
}

const chartConfig = {
  precio: {
    label: "Precio",
    color: "#0066FF",
  },
} satisfies ChartConfig

export function PreciosDispersionChart({
  fechaInicio,
  fechaFin,
  ciudades,
}: PreciosDispersionChartProps) {
  const { data: productos, isLoading } = usePreciosDispersion(
    fechaInicio,
    fechaFin,
    ciudades
  )

  const chartData = productos?.map((item) => ({
    nombre: item.producto.length > 18 ? item.producto.substring(0, 18) + "..." : item.producto,
    nombreCompleto: item.producto,
    precio_promedio: item.precio_promedio,
    precio_min: item.precio_min,
    precio_max: item.precio_max,
    q1: item.q1,
    mediana: item.mediana,
    q3: item.q3,
    coef_variacion: item.coef_variacion,
    // Para error bars
    errorLow: item.precio_promedio - item.precio_min,
    errorHigh: item.precio_max - item.precio_promedio,
  })) || []

  const formatCurrency = (value: number) => `$${value.toFixed(0)}`

  const getBarColor = (cv: number) => {
    if (cv > 15) return "#EF4444" // red
    if (cv > 8) return "#F59E0B" // amber
    return "#22C55E" // green
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          Dispersión de Precios
        </CardTitle>
        <CardDescription>Precio promedio con rango mín-máx por producto</CardDescription>
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
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={120}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <p className="font-medium text-sm mb-2">{data.nombreCompleto}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          Promedio: <span className="font-medium text-foreground">${data.precio_promedio}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Rango: <span className="text-green-600">${data.precio_min}</span> - <span className="text-red-500">${data.precio_max}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Mediana: <span className="font-medium">${data.mediana}</span>
                        </p>
                        <p className={`font-medium ${data.coef_variacion > 15 ? "text-red-500" : data.coef_variacion > 8 ? "text-amber-500" : "text-green-600"}`}>
                          CV: {data.coef_variacion}%
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="precio_promedio"
                radius={[0, 4, 4, 0]}
                maxBarSize={25}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.coef_variacion)}
                  />
                ))}
                <ErrorBar
                  dataKey="errorHigh"
                  direction="x"
                  width={4}
                  strokeWidth={1.5}
                  stroke="hsl(var(--muted-foreground))"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de dispersión disponibles
          </div>
        )}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>CV &lt; 8%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>CV 8-15%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>CV &gt; 15%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
