"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell, ReferenceLine } from "recharts"
import { useAnalisisEstacionalidadSemanal } from "@/hooks/use-analisis"
import { Calendar } from "lucide-react"

interface EstacionalidadSemanalWidgetProps {
  dias?: number
  retailerId?: number | null
}

const chartConfig = {
  venta_total: {
    label: "Ventas",
    color: "#0066FF",
  },
} satisfies ChartConfig

const dayColors = [
  "#EF4444", // Domingo - rojo (alto)
  "#94A3B8", // Lunes - gris
  "#94A3B8", // Martes - gris
  "#94A3B8", // Miércoles - gris
  "#F59E0B", // Jueves - naranja
  "#22C55E", // Viernes - verde
  "#8B5CF6", // Sábado - púrpura (alto)
]

export function EstacionalidadSemanalWidget({
  dias = 90,
  retailerId,
}: EstacionalidadSemanalWidgetProps) {
  // Calcular fechas basadas en días
  const fechaFin = new Date().toISOString().split("T")[0]
  const fechaInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const { data: estacionalidad, isLoading } = useAnalisisEstacionalidadSemanal(
    fechaInicio,
    fechaFin,
    null,
    retailerId
  )

  const chartData = estacionalidad?.map((item) => ({
    dia: item.dia_nombre.substring(0, 3),
    dia_completo: item.dia_nombre,
    venta_total: item.venta_total,
    transacciones: item.transacciones,
    ticket_promedio: item.ticket_promedio,
    color: dayColors[item.dia_num],
  })) || []

  const promedio = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.venta_total, 0) / chartData.length
    : 0

  const mejorDia = chartData.length > 0
    ? chartData.reduce((max, item) => item.venta_total > max.venta_total ? item : max, chartData[0])
    : null

  const peorDia = chartData.length > 0
    ? chartData.reduce((min, item) => item.venta_total < min.venta_total ? item : min, chartData[0])
    : null

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
              <Calendar className="h-5 w-5 text-cyan-500" />
              Estacionalidad Semanal
            </CardTitle>
            <CardDescription>Patrón de ventas por día</CardDescription>
          </div>
          <div className="flex gap-2">
            {mejorDia && (
              <div className="px-2 py-1 rounded-lg bg-green-50">
                <p className="text-[9px] text-muted-foreground">Mejor</p>
                <p className="text-xs font-bold text-green-600">{mejorDia.dia_completo}</p>
              </div>
            )}
            {peorDia && (
              <div className="px-2 py-1 rounded-lg bg-red-50">
                <p className="text-[9px] text-muted-foreground">Menor</p>
                <p className="text-xs font-bold text-red-500">{peorDia.dia_completo}</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="skeleton-shimmer h-full w-full rounded-lg" />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={formatCurrency}
                width={50}
              />
              <ReferenceLine
                y={promedio}
                stroke="#94A3B8"
                strokeDasharray="3 3"
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  const vsProm = ((data.venta_total - promedio) / promedio * 100).toFixed(1)
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                      <p className="font-medium text-sm mb-2">{data.dia_completo}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-600 font-medium">
                          {formatCurrency(data.venta_total)}
                        </p>
                        <p className="text-muted-foreground">
                          vs Prom: <span className={`font-medium ${parseFloat(vsProm) >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {parseFloat(vsProm) >= 0 ? "+" : ""}{vsProm}%
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Ticket: <span className="font-medium">${data.ticket_promedio}</span>
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="venta_total"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground">
            No hay datos de estacionalidad
          </div>
        )}
      </CardContent>
    </Card>
  )
}
