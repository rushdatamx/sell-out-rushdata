"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { useTiendasPorCiudad } from "@/hooks/use-tiendas"

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "#0066FF",
  },
} satisfies ChartConfig

const COLORS = ["#0066FF", "#06B6D4", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899"]

interface VentasPorCiudadChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  ciudades?: string[] | null
  clusters?: string[] | null
  categorias?: string[] | null
  productoIds?: number[] | null
  retailerId?: number | null
}

export function VentasPorCiudadChart({
  fechaInicio,
  fechaFin,
  ciudades,
  clusters,
  categorias,
  productoIds,
  retailerId,
}: VentasPorCiudadChartProps) {
  const { data, isLoading } = useTiendasPorCiudad(
    fechaInicio,
    fechaFin,
    ciudades,
    clusters,
    categorias,
    productoIds,
    retailerId
  )

  const chartData = data?.map((item, index) => ({
    ciudad: item.ciudad,
    ventas: item.ventas,
    tiendas: item.num_tiendas,
    fill: COLORS[index % COLORS.length],
  })) || []

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader>
        <CardTitle>Ventas por Ciudad</CardTitle>
        <CardDescription>Distribución de ventas por ubicación</CardDescription>
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
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                type="number"
                tickFormatter={formatCurrency}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="ciudad"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={100}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{formatCurrency(value as number)}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.payload.tiendas} tiendas
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="ventas" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
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
