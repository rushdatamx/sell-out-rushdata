"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from "recharts"
import { useInventarioEvolucion } from "@/hooks/use-inventario"
import { TrendingUp } from "lucide-react"

interface InventarioEvolucionChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  productoId?: number | null
  tiendaId?: number | null
  retailerId?: number | null
}

const chartConfig = {
  inventario: {
    label: "Inventario",
    color: "#0066FF",
  },
  tiendas_oos: {
    label: "Tiendas OOS",
    color: "#EF4444",
  },
} satisfies ChartConfig

export function InventarioEvolucionChart({
  fechaInicio,
  fechaFin,
  productoId,
  tiendaId,
  retailerId,
}: InventarioEvolucionChartProps) {
  const { data: evolucion, isLoading } = useInventarioEvolucion(
    fechaInicio,
    fechaFin,
    productoId,
    tiendaId,
    retailerId
  )

  const chartData = evolucion?.map((item) => ({
    fecha: new Date(item.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
    fechaCompleta: item.fecha,
    inventario: item.inventario,
    tiendas_oos: item.tiendas_oos,
  })) || []

  const promedioInventario = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.inventario, 0) / chartData.length
    : 0

  const totalTiendasOOS = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.tiendas_oos, 0)
    : 0

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Evolución de Inventario
            </CardTitle>
            <CardDescription>
              {productoId || tiendaId
                ? "Tendencia del producto/tienda seleccionado"
                : "Tendencia general de inventario"}
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-blue-50">
              <p className="text-[10px] text-muted-foreground">Prom. Inventario</p>
              <p className="text-sm font-bold text-blue-600">{promedioInventario.toFixed(0)} uds</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-red-50">
              <p className="text-[10px] text-muted-foreground">Días con OOS</p>
              <p className="text-sm font-bold text-red-600">{totalTiendasOOS}</p>
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
                <linearGradient id="colorInventario" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3} />
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
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={40}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={30}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fechaCompleta
                      }
                      return ""
                    }}
                    formatter={(value, name) => {
                      if (name === "inventario") {
                        return [`${Number(value).toLocaleString()} uds`, "Inventario"]
                      }
                      return [`${value} tiendas`, "Tiendas OOS"]
                    }}
                  />
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="inventario"
                stroke="#0066FF"
                strokeWidth={2}
                fill="url(#colorInventario)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tiendas_oos"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: "#EF4444", r: 3 }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No hay datos de evolución disponibles</p>
              <p className="text-xs mt-1">Selecciona un producto o tienda para ver el detalle</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
