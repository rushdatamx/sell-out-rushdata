"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTopProductos } from "@/hooks/use-dashboard-charts"
import { Loader2, TrendingUp } from "lucide-react"

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "#0066FF",
  },
} satisfies ChartConfig

interface TopProductosChartProps {
  dias?: number
}

export function TopProductosChart({ dias = 30 }: TopProductosChartProps) {
  const { data: productos, isLoading } = useTopProductos(dias)

  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Top 10 Productos</CardTitle>
          <CardDescription>Por ventas en el período</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton-shimmer h-6 w-32" />
              <div className="skeleton-shimmer h-6 flex-1" style={{ maxWidth: `${100 - i * 10}%` }} />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const chartData = productos?.map(p => ({
    nombre: p.nombre.length > 20 ? p.nombre.substring(0, 20) + '...' : p.nombre,
    nombreCompleto: p.nombre,
    ventas: p.ventas,
    unidades: p.unidades,
    categoria: p.categoria,
  })) || []

  const maxVentas = Math.max(...chartData.map(d => d.ventas), 0)

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <CardTitle>Top 10 Productos</CardTitle>
        <CardDescription>Por ventas en los últimos {dias} días</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={150}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(0, 102, 255, 0.1)' }}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const data = item.payload
                    return (
                      <div className="space-y-1">
                        <p className="font-medium">{data.nombreCompleto}</p>
                        <p className="text-sm text-muted-foreground">{data.categoria}</p>
                        <p className="font-bold">${Number(value).toLocaleString('es-MX')}</p>
                        <p className="text-sm text-muted-foreground">{data.unidades.toLocaleString()} unidades</p>
                      </div>
                    )
                  }}
                  hideLabel
                />
              }
            />
            <Bar
              dataKey="ventas"
              fill="#0066FF"
              radius={[0, 4, 4, 0]}
              maxBarSize={25}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
