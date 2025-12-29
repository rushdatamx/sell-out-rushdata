"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { useReabastecimientoTendencia } from "@/hooks/use-reabastecimiento"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ReabastecimientoTendenciaChartProps {
  ciudades?: string[] | null
  retailerId?: number | null
}

const chartConfig = {
  tendencia: {
    label: "Tendencia",
  },
} satisfies ChartConfig

export function ReabastecimientoTendenciaChart({
  ciudades,
  retailerId,
}: ReabastecimientoTendenciaChartProps) {
  const { data: tendencia, isLoading } = useReabastecimientoTendencia(ciudades, 8, retailerId)

  const creciendoData = tendencia?.creciendo?.map((item) => ({
    nombre: item.producto.length > 20 ? item.producto.substring(0, 20) + "..." : item.producto,
    nombreCompleto: item.producto,
    tendencia_pct: item.tendencia_pct,
    venta_actual: item.venta_actual,
    venta_anterior: item.venta_anterior,
  })) || []

  const cayendoData = tendencia?.cayendo?.map((item) => ({
    nombre: item.producto.length > 20 ? item.producto.substring(0, 20) + "..." : item.producto,
    nombreCompleto: item.producto,
    tendencia_pct: item.tendencia_pct,
    venta_actual: item.venta_actual,
    venta_anterior: item.venta_anterior,
  })) || []

  const renderChart = (data: typeof creciendoData, color: string, isGrowing: boolean) => (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
                  <p className={`font-medium ${data.tendencia_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                    Tendencia: {data.tendencia_pct >= 0 ? "+" : ""}{data.tendencia_pct}%
                  </p>
                  <p className="text-muted-foreground">
                    Esta semana: <span className="font-medium">{data.venta_actual} uds</span>
                  </p>
                  <p className="text-muted-foreground">
                    Semana anterior: <span className="font-medium">{data.venta_anterior} uds</span>
                  </p>
                </div>
              </div>
            )
          }}
        />
        <Bar
          dataKey="tendencia_pct"
          radius={[0, 4, 4, 0]}
          label={{
            position: "right",
            formatter: (value: number) => `${value >= 0 ? "+" : ""}${value}%`,
            fill: color,
            fontSize: 10,
          }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={color}
              fillOpacity={isGrowing ? 1 - (index * 0.1) : 0.5 + (index * 0.06)}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Tendencia Semanal
        </CardTitle>
        <CardDescription>Comparativo vs semana anterior</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="skeleton-shimmer h-full w-full rounded-lg" />
          </div>
        ) : (
          <Tabs defaultValue="creciendo" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="creciendo" className="gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Creciendo ({creciendoData.length})
              </TabsTrigger>
              <TabsTrigger value="cayendo" className="gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Cayendo ({cayendoData.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="creciendo">
              {creciendoData.length > 0 ? (
                renderChart(creciendoData, "#22C55E", true)
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  No hay productos con crecimiento
                </div>
              )}
            </TabsContent>
            <TabsContent value="cayendo">
              {cayendoData.length > 0 ? (
                renderChart(cayendoData, "#EF4444", false)
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  No hay productos con caída
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
