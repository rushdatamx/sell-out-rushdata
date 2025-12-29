"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMercoReabastecimientoABC } from "@/hooks/use-merco-reabastecimiento"
import { PieChart } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"

interface ReabastecimientoMercoABCProps {
  retailerId?: number | null
}

const chartConfig = {
  clase_a: { label: "Clase A", color: "#22c55e" },
  clase_b: { label: "Clase B", color: "#3b82f6" },
  clase_c: { label: "Clase C", color: "#94a3b8" },
}

export function ReabastecimientoMercoABC({ retailerId }: ReabastecimientoMercoABCProps) {
  const { data: abc, isLoading } = useMercoReabastecimientoABC(retailerId)

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const chartData = abc ? [
    {
      name: "Clase A",
      productos: abc.clase_a.productos,
      venta: abc.clase_a.venta,
      porcentaje: abc.clase_a.porcentaje,
      fill: "#22c55e",
    },
    {
      name: "Clase B",
      productos: abc.clase_b.productos,
      venta: abc.clase_b.venta,
      porcentaje: abc.clase_b.porcentaje,
      fill: "#3b82f6",
    },
    {
      name: "Clase C",
      productos: abc.clase_c.productos,
      venta: abc.clase_c.venta,
      porcentaje: abc.clase_c.porcentaje,
      fill: "#94a3b8",
    },
  ] : []

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-orange-500" />
          Clasificación ABC
        </CardTitle>
        <CardDescription>
          Distribución de productos por contribución a la venta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="skeleton-shimmer h-full w-full rounded-lg" />
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={60} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.productos} productos
                            </p>
                            <p className="text-sm">
                              Venta: {formatCurrency(data.venta)}
                            </p>
                            <p className="text-sm font-medium">
                              {data.porcentaje}% del total
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="font-semibold">Clase A</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {abc?.clase_a.productos || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {abc?.clase_a.porcentaje || 0}% venta
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="font-semibold">Clase B</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {abc?.clase_b.productos || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {abc?.clase_b.porcentaje || 0}% venta
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                  <span className="font-semibold">Clase C</span>
                </div>
                <p className="text-2xl font-bold text-gray-600">
                  {abc?.clase_c.productos || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {abc?.clase_c.porcentaje || 0}% venta
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
