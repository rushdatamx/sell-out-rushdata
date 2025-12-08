"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { useAnalisisProductosYoY } from "@/hooks/use-analisis"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AnalisisProductosYoYChartProps {
  anio: number
  ciudades?: string[] | null
}

const chartConfig = {
  cambio_pct: {
    label: "Cambio %",
  },
} satisfies ChartConfig

export function AnalisisProductosYoYChart({
  anio,
  ciudades,
}: AnalisisProductosYoYChartProps) {
  const { data: creciendo, isLoading: isLoadingCrec } = useAnalisisProductosYoY(
    anio,
    ciudades,
    "crecimiento",
    8
  )
  const { data: cayendo, isLoading: isLoadingCay } = useAnalisisProductosYoY(
    anio,
    ciudades,
    "caida",
    8
  )

  const isLoading = isLoadingCrec || isLoadingCay

  const formatData = (data: typeof creciendo) =>
    data?.map((item) => ({
      nombre: item.producto.length > 20 ? item.producto.substring(0, 20) + "..." : item.producto,
      nombreCompleto: item.producto,
      cambio_pct: item.cambio_pct,
      venta_actual: item.venta_actual,
      venta_anterior: item.venta_anterior,
    })) || []

  const creciendoData = formatData(creciendo)
  const cayendoData = formatData(cayendo)

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  const renderChart = (data: typeof creciendoData, color: string) => (
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
                  <p className={`font-medium ${data.cambio_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                    Cambio: {data.cambio_pct >= 0 ? "+" : ""}{data.cambio_pct}%
                  </p>
                  <p className="text-muted-foreground">
                    {anio}: <span className="font-medium">{formatCurrency(data.venta_actual)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {anio - 1}: <span className="font-medium">{formatCurrency(data.venta_anterior)}</span>
                  </p>
                </div>
              </div>
            )
          }}
        />
        <Bar
          dataKey="cambio_pct"
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
              fillOpacity={1 - index * 0.1}
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
          Productos YoY
        </CardTitle>
        <CardDescription>Mayor crecimiento y caída vs {anio - 1}</CardDescription>
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
                Creciendo
              </TabsTrigger>
              <TabsTrigger value="cayendo" className="gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Cayendo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="creciendo">
              {creciendoData.length > 0 ? (
                renderChart(creciendoData, "#22C55E")
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  No hay productos con crecimiento
                </div>
              )}
            </TabsContent>
            <TabsContent value="cayendo">
              {cayendoData.length > 0 ? (
                renderChart(cayendoData, "#EF4444")
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
