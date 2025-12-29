"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from "recharts"
import { usePreciosEvolucion } from "@/hooks/use-precios"
import { TrendingUp } from "lucide-react"

interface PreciosEvolucionChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  productoId?: number | null
  ciudades?: string[] | null
  retailerId?: number | null
}

const chartConfig = {
  precio_promedio: {
    label: "Precio Promedio",
    color: "#0066FF",
  },
  precio_min: {
    label: "Precio Mínimo",
    color: "#22C55E",
  },
  precio_max: {
    label: "Precio Máximo",
    color: "#EF4444",
  },
} satisfies ChartConfig

export function PreciosEvolucionChart({
  fechaInicio,
  fechaFin,
  productoId,
  ciudades,
  retailerId,
}: PreciosEvolucionChartProps) {
  const { data: evolucion, isLoading } = usePreciosEvolucion(
    fechaInicio,
    fechaFin,
    productoId,
    ciudades,
    retailerId
  )

  const chartData = evolucion?.map((item) => ({
    fecha: new Date(item.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    fechaCompleta: item.fecha,
    precio_promedio: item.precio_promedio,
    precio_min: item.precio_min,
    precio_max: item.precio_max,
    transacciones: item.transacciones,
  })) || []

  const precioPromGlobal = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.precio_promedio, 0) / chartData.length
    : 0

  const tendencia = chartData.length > 1
    ? ((chartData[chartData.length - 1].precio_promedio - chartData[0].precio_promedio) / chartData[0].precio_promedio * 100)
    : 0

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Evolución de Precios
            </CardTitle>
            <CardDescription>Tendencia semanal con rango mín-máx</CardDescription>
          </div>
          <div className="flex gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-blue-50">
              <p className="text-[10px] text-muted-foreground">Prom. Global</p>
              <p className="text-sm font-bold text-blue-600">${precioPromGlobal.toFixed(2)}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg ${tendencia >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <p className="text-[10px] text-muted-foreground">Tendencia</p>
              <p className={`text-sm font-bold ${tendencia >= 0 ? "text-green-600" : "text-red-600"}`}>
                {tendencia >= 0 ? "+" : ""}{tendencia.toFixed(1)}%
              </p>
            </div>
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
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrecio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066FF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="fecha"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `$${v}`}
                width={50}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <p className="font-medium text-sm mb-2">{data.fechaCompleta}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-600 font-medium">
                          Promedio: ${data.precio_promedio}
                        </p>
                        <p className="text-green-600">
                          Mínimo: ${data.precio_min}
                        </p>
                        <p className="text-red-500">
                          Máximo: ${data.precio_max}
                        </p>
                        <p className="text-muted-foreground">
                          Transacciones: {data.transacciones}
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="precio_promedio"
                stroke="#0066FF"
                strokeWidth={2}
                fill="url(#colorPrecio)"
              />
              <Line
                type="monotone"
                dataKey="precio_min"
                stroke="#22C55E"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="precio_max"
                stroke="#EF4444"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No hay datos de evolución disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
