"use client"

import { useMemo } from "react"
import { Pie, PieChart, Label, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useMixCategorias } from "@/hooks/use-dashboard-charts"
import { Loader2 } from "lucide-react"

const COLORS = ["#0066FF", "#06B6D4", "#8B5CF6", "#F59E0B", "#EF4444", "#10B981", "#EC4899", "#6366F1"]

interface MixCategoriasChartProps {
  dias?: number
  retailerId?: number | null
}

export function MixCategoriasChart({ dias = 30, retailerId }: MixCategoriasChartProps) {
  const { data: categorias, isLoading } = useMixCategorias(dias, retailerId)

  const totalVentas = useMemo(() => {
    return categorias?.reduce((sum, c) => sum + c.ventas, 0) || 0
  }, [categorias])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      ventas: { label: "Ventas" },
    }
    categorias?.forEach((cat, index) => {
      config[cat.categoria] = {
        label: cat.categoria,
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [categorias])

  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Mix por Categoría</CardTitle>
          <CardDescription>Distribución de ventas</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center gap-8">
          <div className="skeleton-shimmer h-[200px] w-[200px] rounded-full" />
          <div className="flex-1 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="skeleton-shimmer h-3 w-3 rounded-full" />
                  <div className="skeleton-shimmer h-4 w-24" />
                </div>
                <div className="skeleton-shimmer h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = categorias?.map((cat, index) => ({
    categoria: cat.categoria,
    ventas: cat.ventas,
    porcentaje: cat.porcentaje,
    fill: COLORS[index % COLORS.length],
  })) || []

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <CardTitle>Mix por Categoría</CardTitle>
        <CardDescription>Últimos {dias} días</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[250px] w-[250px]">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const data = item.payload
                      return (
                        <div className="space-y-1">
                          <p className="font-medium">{data.categoria}</p>
                          <p className="font-bold">${Number(value).toLocaleString('es-MX')}</p>
                          <p className="text-sm text-muted-foreground">{data.porcentaje}% del total</p>
                        </div>
                      )
                    }}
                    hideLabel
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="ventas"
                nameKey="categoria"
                innerRadius={60}
                outerRadius={100}
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            ${(totalVentas / 1000).toFixed(0)}k
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-xs"
                          >
                            Total
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Leyenda */}
          <div className="flex-1 space-y-2">
            {chartData.map((cat, index) => (
              <div key={cat.categoria} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.fill }}
                  />
                  <span className="text-sm">{cat.categoria}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{cat.porcentaje}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
