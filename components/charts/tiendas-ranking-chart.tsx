"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell, ReferenceLine } from "recharts"
import { useTiendasRanking } from "@/hooks/use-tiendas"
import { TrendingUp, TrendingDown } from "lucide-react"

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "#0066FF",
  },
} satisfies ChartConfig

interface TiendasRankingChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  ciudades?: string[] | null
  clusters?: string[] | null
  categorias?: string[] | null
  productoIds?: number[] | null
  tipo?: "top" | "bottom"
  retailerId?: number | null
}

export function TiendasRankingChart({
  fechaInicio,
  fechaFin,
  ciudades,
  clusters,
  categorias,
  productoIds,
  tipo = "top",
  retailerId,
}: TiendasRankingChartProps) {
  const { data, isLoading } = useTiendasRanking(
    fechaInicio,
    fechaFin,
    ciudades,
    clusters,
    categorias,
    productoIds,
    tipo,
    10,
    retailerId
  )

  const chartData = data?.map((item) => ({
    nombre: item.nombre.length > 25 ? item.nombre.substring(0, 25) + "..." : item.nombre,
    nombreCompleto: item.nombre,
    ciudad: item.ciudad,
    ventas: item.ventas,
    variacion: item.variacion,
    fill: tipo === "top" ? "#0066FF" : "#EF4444",
  })) || []

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatPercent = (value: number) => {
    const sign = value > 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  const isTop = tipo === "top"

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isTop ? (
            <>
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top 10 Tiendas
            </>
          ) : (
            <>
              <TrendingDown className="h-5 w-5 text-red-500" />
              Bottom 10 Tiendas
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isTop ? "Tiendas con mayor venta" : "Tiendas con menor venta (oportunidad)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] flex items-center justify-center">
            <div className="skeleton-shimmer h-full w-full rounded-lg" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
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
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                width={140}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-xs">{item.payload.nombreCompleto}</span>
                        <span className="text-xs text-muted-foreground">{item.payload.ciudad}</span>
                        <div className="flex items-center justify-between gap-4 mt-1">
                          <span className="font-semibold">{formatCurrency(value as number)}</span>
                          <span className={`text-xs font-medium ${
                            item.payload.variacion > 0 ? "text-green-600" :
                            item.payload.variacion < 0 ? "text-red-500" : ""
                          }`}>
                            {formatPercent(item.payload.variacion)}
                          </span>
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="ventas" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    fillOpacity={isTop ? 1 - (index * 0.07) : 0.6 + (index * 0.04)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
