"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts"
import { useProductosPareto } from "@/hooks/use-productos"

interface ProductosParetoChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  categorias?: string[] | null
  tiendaIds?: number[] | null
  productoIds?: number[] | null
  retailerId?: number | null
}

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "#0066FF",
  },
  acumulado: {
    label: "% Acumulado",
    color: "#06B6D4",
  },
} satisfies ChartConfig

export function ProductosParetoChart({ fechaInicio, fechaFin, categorias, tiendaIds, productoIds, retailerId }: ProductosParetoChartProps) {
  const { data: pareto, isLoading } = useProductosPareto(fechaInicio, fechaFin, categorias, tiendaIds, productoIds, retailerId)

  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Análisis Pareto (80/20)</CardTitle>
          <CardDescription>Productos que generan el 80% de las ventas</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="skeleton-shimmer h-full w-full" />
        </CardContent>
      </Card>
    )
  }

  // Tomar los primeros 15 productos para visualización
  const chartData = (pareto?.data || []).slice(0, 15).map((item) => ({
    nombre: item.nombre?.length > 12 ? item.nombre.substring(0, 12) + "..." : item.nombre || "",
    nombreCompleto: item.nombre || "",
    ventas: item.ventas || 0,
    porcentaje: item.porcentaje || 0,
    acumulado: item.acumulado || 0,
  }))

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Análisis Pareto (80/20)</CardTitle>
            <CardDescription>Productos que generan el 80% de las ventas</CardDescription>
          </div>
          {pareto && (
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0066FF]">{pareto.productos_80}</p>
              <p className="text-xs text-muted-foreground">de {pareto.total_productos} productos</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="nombre"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="premium-tooltip bg-white p-3 rounded-lg shadow-lg border-0">
                    <p className="font-medium text-sm">{data.nombreCompleto}</p>
                    <p className="text-sm text-muted-foreground">
                      Ventas: <span className="font-medium text-[#0066FF]">${(data.ventas / 1000).toFixed(1)}K</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Participación: <span className="font-medium">{data.porcentaje}%</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Acumulado: <span className="font-medium text-[#06B6D4]">{data.acumulado}%</span>
                    </p>
                  </div>
                )
              }}
            />
            <ReferenceLine y={80} yAxisId="right" stroke="#ef4444" strokeDasharray="5 5" label={{ value: "80%", position: "right", fill: "#ef4444", fontSize: 12 }} />
            <defs>
              <linearGradient id="paretoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0066FF" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#0066FF" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <Bar
              yAxisId="left"
              dataKey="ventas"
              fill="url(#paretoGradient)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="acumulado"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={{ fill: "#06B6D4", strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
