"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTopTiendas } from "@/hooks/use-dashboard-charts"
import { Loader2 } from "lucide-react"

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "#06B6D4",
  },
} satisfies ChartConfig

interface TopTiendasChartProps {
  dias?: number
}

export function TopTiendasChart({ dias = 30 }: TopTiendasChartProps) {
  const { data: tiendas, isLoading } = useTopTiendas(dias)

  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Top 10 Tiendas</CardTitle>
          <CardDescription>Por ventas en el período</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton-shimmer h-6 w-40" />
              <div className="skeleton-shimmer h-6 flex-1" style={{ maxWidth: `${100 - i * 10}%` }} />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const chartData = tiendas?.map(t => ({
    nombre: t.nombre.length > 25 ? t.nombre.substring(0, 25) + '...' : t.nombre,
    nombreCompleto: t.nombre,
    ventas: t.ventas,
    unidades: t.unidades,
    ciudad: t.ciudad,
    retailer: t.retailer,
  })) || []

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <CardTitle>Top 10 Tiendas</CardTitle>
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
              width={180}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const data = item.payload
                    return (
                      <div className="space-y-1">
                        <p className="font-medium">{data.nombreCompleto}</p>
                        <p className="text-sm text-muted-foreground">{data.retailer} • {data.ciudad}</p>
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
              fill="#06B6D4"
              radius={[0, 4, 4, 0]}
              maxBarSize={25}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
