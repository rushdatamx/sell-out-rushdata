"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useProductosVariacion } from "@/hooks/use-productos"

interface ProductosVariacionChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  tipo: "crecimiento" | "caida"
  categorias?: string[] | null
  tiendaIds?: number[] | null
  productoIds?: number[] | null
}

const chartConfig = {
  variacion: {
    label: "Variación",
  },
} satisfies ChartConfig

export function ProductosVariacionChart({ fechaInicio, fechaFin, tipo, categorias, tiendaIds, productoIds }: ProductosVariacionChartProps) {
  const { data: variaciones, isLoading } = useProductosVariacion(fechaInicio, fechaFin, tipo, categorias, tiendaIds, productoIds)

  const titulo = tipo === "crecimiento" ? "Top 10 Mayor Crecimiento" : "Top 10 Mayor Caída"
  const descripcion = tipo === "crecimiento"
    ? "Productos con mejor desempeño vs período anterior"
    : "Productos que requieren atención"
  const Icon = tipo === "crecimiento" ? TrendingUp : TrendingDown
  const color = tipo === "crecimiento" ? "#10B981" : "#EF4444"

  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${tipo === "crecimiento" ? "text-green-500" : "text-red-500"}`} />
            {titulo}
          </CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px]">
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="skeleton-shimmer h-5 w-32" />
                <div className="skeleton-shimmer h-5 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = variaciones?.slice(0, 10).map(item => ({
    nombre: item.nombre.length > 20 ? item.nombre.substring(0, 20) + "..." : item.nombre,
    nombreCompleto: item.nombre,
    variacion: item.variacion,
    ventas_actual: item.ventas_actual,
    ventas_anterior: item.ventas_anterior,
  })) || []

  // Para caídas, mostrar en orden inverso (más negativo primero)
  if (tipo === "caida") {
    chartData.reverse()
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${tipo === "crecimiento" ? "text-green-500" : "text-red-500"}`} />
          {titulo}
        </CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="nombre"
              tick={{ fontSize: 11 }}
              width={120}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="premium-tooltip bg-white p-3 rounded-lg shadow-lg border-0">
                    <p className="font-medium text-sm">{data.nombreCompleto}</p>
                    <p className="text-sm text-muted-foreground">
                      Variación: <span className={`font-medium ${data.variacion >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {data.variacion >= 0 ? "+" : ""}{data.variacion.toFixed(1)}%
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Actual: ${(data.ventas_actual / 1000).toFixed(1)}K
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Anterior: ${(data.ventas_anterior / 1000).toFixed(1)}K
                    </p>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="variacion"
              radius={[0, 4, 4, 0]}
              label={{
                position: "right",
                formatter: (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`,
                fill: color,
                fontSize: 11,
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={color} fillOpacity={1 - (index * 0.07)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
