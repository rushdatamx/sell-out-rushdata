"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ComposedChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useVentasMensualesYoY } from "@/hooks/use-dashboard-charts"
import { Loader2 } from "lucide-react"

const chartConfig = {
  actual: {
    label: "Año Actual",
    color: "#0066FF",
  },
  anterior: {
    label: "Año Anterior",
    color: "#94A3B8",
  },
} satisfies ChartConfig

const mesesCortos = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

interface VentasMensualesChartProps {
  retailerId?: number | null
}

export function VentasMensualesChart({ retailerId }: VentasMensualesChartProps = {}) {
  const { data: ventasMensuales, isLoading } = useVentasMensualesYoY(retailerId)

  const chartData = useMemo(() => {
    if (!ventasMensuales || ventasMensuales.length === 0) return []

    const anioActual = Math.max(...ventasMensuales.map(v => v.anio))
    const anioAnterior = anioActual - 1

    // Crear estructura de datos por mes
    const dataByMonth: Record<number, { mes: string; actual: number; anterior: number }> = {}

    // Inicializar todos los meses
    for (let i = 1; i <= 12; i++) {
      dataByMonth[i] = {
        mes: mesesCortos[i - 1],
        actual: 0,
        anterior: 0,
      }
    }

    // Llenar con datos reales
    ventasMensuales.forEach(v => {
      if (v.anio === anioActual) {
        dataByMonth[v.mes].actual = v.ventas
      } else if (v.anio === anioAnterior) {
        dataByMonth[v.mes].anterior = v.ventas
      }
    })

    return Object.values(dataByMonth)
  }, [ventasMensuales])

  const totals = useMemo(() => {
    const actual = chartData.reduce((sum, d) => sum + d.actual, 0)
    const anterior = chartData.reduce((sum, d) => sum + d.anterior, 0)
    const cambio = anterior > 0 ? ((actual - anterior) / anterior * 100) : 0
    return { actual, anterior, cambio }
  }, [chartData])

  if (isLoading) {
    return (
      <Card className="rounded-2xl hover-lift">
        <CardHeader>
          <CardTitle>Ventas Mensuales</CardTitle>
          <CardDescription>Comparativo año actual vs anterior</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="space-y-4 w-full">
            <div className="skeleton-shimmer h-8 w-48" />
            <div className="skeleton-shimmer h-[280px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ventas Mensuales</CardTitle>
            <CardDescription>Comparativo año actual vs anterior</CardDescription>
          </div>
          <div className="flex gap-6 text-right">
            <div className="px-4 py-2 rounded-xl bg-[#0066FF]/5">
              <p className="text-xs text-muted-foreground">Año Actual</p>
              <p className="text-lg premium-number gradient-text">
                ${(totals.actual / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-100/50">
              <p className="text-xs text-muted-foreground">Año Anterior</p>
              <p className="text-lg premium-number text-slate-400">
                ${(totals.anterior / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-br from-green-50 to-cyan-50">
              <p className="text-xs text-muted-foreground">Cambio</p>
              <p className={`text-lg premium-number ${totals.cambio >= 0 ? 'gradient-text-success' : 'gradient-text-warning'}`}>
                {totals.cambio >= 0 ? '+' : ''}{totals.cambio.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => value}
                  formatter={(value, name) => {
                    const label = name === 'actual' ? 'Año Actual' : 'Año Anterior'
                    return [`$${Number(value).toLocaleString('es-MX')}`, label]
                  }}
                />
              }
            />
            <Bar
              dataKey="actual"
              fill="#0066FF"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Line
              type="monotone"
              dataKey="anterior"
              stroke="#94A3B8"
              strokeWidth={2}
              dot={{ fill: "#94A3B8", r: 4 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
