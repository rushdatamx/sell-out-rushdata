"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, Line, ComposedChart, XAxis, YAxis, Cell, CartesianGrid, ReferenceLine } from "recharts"
import { useReabastecimientoABC } from "@/hooks/use-reabastecimiento"
import { BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ReabastecimientoABCChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  ciudades?: string[] | null
}

const chartConfig = {
  venta: {
    label: "Venta",
    color: "#0066FF",
  },
  pct_acumulado: {
    label: "% Acumulado",
    color: "#F59E0B",
  },
} satisfies ChartConfig

export function ReabastecimientoABCChart({
  fechaInicio,
  fechaFin,
  ciudades,
}: ReabastecimientoABCChartProps) {
  const { data: productos, isLoading } = useReabastecimientoABC(
    fechaInicio,
    fechaFin,
    ciudades
  )

  const chartData = productos?.map((item) => ({
    nombre: item.producto.length > 15 ? item.producto.substring(0, 15) + "..." : item.producto,
    nombreCompleto: item.producto,
    venta: item.venta,
    pct_venta: item.pct_venta,
    pct_acumulado: item.pct_acumulado,
    clasificacion: item.clasificacion,
  })) || []

  const getBarColor = (clasificacion: string) => {
    if (clasificacion === "A") return "#22C55E"
    if (clasificacion === "B") return "#3B82F6"
    return "#94A3B8"
  }

  const countByClass = {
    A: chartData.filter(d => d.clasificacion === "A").length,
    B: chartData.filter(d => d.clasificacion === "B").length,
    C: chartData.filter(d => d.clasificacion === "C").length,
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Clasificación ABC (Pareto)
            </CardTitle>
            <CardDescription>Productos por contribución a la venta</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
              A: {countByClass.A}
            </Badge>
            <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
              B: {countByClass.B}
            </Badge>
            <Badge variant="outline" className="border-slate-400 text-slate-500">
              C: {countByClass.C}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="skeleton-shimmer h-full w-full rounded-lg" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="nombre"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ReferenceLine yAxisId="right" y={80} stroke="#22C55E" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="right" y={95} stroke="#3B82F6" strokeDasharray="3 3" />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-sm">{data.nombreCompleto}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1 ${
                            data.clasificacion === "A" ? "border-green-500 text-green-600" :
                            data.clasificacion === "B" ? "border-blue-500 text-blue-600" :
                            "border-slate-400 text-slate-500"
                          }`}
                        >
                          {data.clasificacion}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          Venta: <span className="font-medium text-foreground">{formatCurrency(data.venta)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          % del total: <span className="font-medium">{data.pct_venta}%</span>
                        </p>
                        <p className="text-muted-foreground">
                          % acumulado: <span className="font-medium text-amber-600">{data.pct_acumulado}%</span>
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="venta"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.clasificacion)}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pct_acumulado"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: "#F59E0B", r: 3 }}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos ABC disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
