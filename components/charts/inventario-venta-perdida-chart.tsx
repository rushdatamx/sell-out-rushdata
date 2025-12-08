"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { useInventarioTopVentaPerdida } from "@/hooks/use-inventario"
import { DollarSign } from "lucide-react"

interface InventarioVentaPerdidaChartProps {
  fechaInicio?: string | null
  fechaFin?: string | null
  ciudades?: string[] | null
}

const chartConfig = {
  venta_perdida: {
    label: "Venta Perdida",
    color: "#EF4444",
  },
} satisfies ChartConfig

export function InventarioVentaPerdidaChart({
  fechaInicio,
  fechaFin,
  ciudades,
}: InventarioVentaPerdidaChartProps) {
  const { data: productos, isLoading } = useInventarioTopVentaPerdida(
    fechaInicio,
    fechaFin,
    ciudades,
    10
  )

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const chartData = productos?.map((item) => ({
    nombre: item.producto.length > 20 ? item.producto.substring(0, 20) + "..." : item.producto,
    nombreCompleto: item.producto,
    venta_perdida: item.venta_perdida,
    dias_oos: item.dias_oos,
    tiendas_afectadas: item.tiendas_afectadas,
  })) || []

  const totalPerdida = chartData.reduce((sum, item) => sum + item.venta_perdida, 0)

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              Top Venta Perdida
            </CardTitle>
            <CardDescription>Productos con mayor impacto por OOS</CardDescription>
          </div>
          <div className="px-4 py-2 rounded-xl bg-red-50">
            <p className="text-xs text-muted-foreground">Total Perdido</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalPerdida)}</p>
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
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={130}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <p className="font-medium text-sm mb-2">{data.nombreCompleto}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-red-600 font-medium">
                          Pérdida: {formatCurrency(data.venta_perdida)}
                        </p>
                        <p className="text-muted-foreground">
                          Días OOS: <span className="font-medium">{data.dias_oos}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Tiendas: <span className="font-medium">{data.tiendas_afectadas}</span>
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="venta_perdida"
                radius={[0, 4, 4, 0]}
                label={{
                  position: "right",
                  formatter: (value: number) => formatCurrency(value),
                  fill: "#EF4444",
                  fontSize: 10,
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#EF4444"
                    fillOpacity={1 - index * 0.08}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de venta perdida disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
