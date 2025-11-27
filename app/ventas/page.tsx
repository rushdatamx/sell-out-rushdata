"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertCircle,
  Percent,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react"
import {
  useVentasKPIs,
  useVentasPerdidasAnalysis,
  useVentasList,
  useVentasRentabilidad,
  useVentasCumplimiento,
  useVentasTemporal,
  useVentasDescuentos,
} from "@/hooks/use-ventas-data"

const TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

// Colores RushData
const COLORS = {
  ventaPerdida: "hsl(220, 9%, 30%)",     // Gris oscuro elegante
  ventas: "hsl(217, 91%, 50%)",          // Azul RushData principal
  inventario: "hsl(217, 91%, 70%)",      // Azul RushData claro
  margen: "hsl(217, 91%, 60%)",          // Azul RushData medio
}

// Chart config para gráfica principal de desempeño
const performanceChartConfig = {
  ventas: {
    label: "Ventas",
    color: "hsl(217, 91%, 50%)",
  },
  ventaPerdida: {
    label: "Venta Perdida",
    color: "hsl(220, 9%, 30%)",
  },
  inventario: {
    label: "Inventario",
    color: "hsl(217, 91%, 70%)",
  },
} satisfies ChartConfig

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

// Chart config for sparklines
const sparklineChartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

// Generate sample sparkline data based on trend
function generateSparklineData(trend: number, baseValue: number = 100): { value: number }[] {
  const points = 12
  const data: { value: number }[] = []
  let current = baseValue * (1 - Math.abs(trend) / 100)

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1)
    const noise = (Math.random() - 0.5) * baseValue * 0.15
    const trendValue = trend >= 0
      ? current + (baseValue - current) * progress
      : baseValue - (baseValue - current) * progress
    data.push({ value: Math.max(0, trendValue + noise) })
  }

  if (trend >= 0) {
    data[data.length - 1] = { value: baseValue * 1.1 }
  } else {
    data[data.length - 1] = { value: baseValue * 0.85 }
  }

  return data
}

// KPI Card with Sparkline Component
interface SparklineKPICardProps {
  title: string
  value: string | number
  trend?: { value: number; isPositive: boolean; actualChange?: number }
  subtitle?: string
  loading?: boolean
  delay?: number
}

function SparklineKPICard({
  title,
  value,
  trend,
  subtitle,
  loading,
  delay = 0,
}: SparklineKPICardProps) {
  const chartData = trend ? generateSparklineData(trend.actualChange ?? trend.value) : generateSparklineData(0)
  const isPositive = trend ? trend.isPositive : true
  const actualChange = trend?.actualChange ?? (trend?.isPositive ? (trend?.value ?? 0) : -(trend?.value ?? 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <ShadcnCard className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden">
        <CardContent className="p-5 pb-0">
          {/* Header */}
          <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">
            {title}
          </p>

          {/* Value */}
          {loading ? (
            <Skeleton className="h-6 w-24 mb-1" />
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.1, duration: 0.3 }}
              className="text-lg font-bold text-foreground tracking-tight truncate"
            >
              {value}
            </motion.p>
          )}

          {/* Trend */}
          {trend ? (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold flex-shrink-0",
                  isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {(actualChange ?? 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {(actualChange ?? 0) >= 0 ? "+" : ""}{(actualChange ?? 0).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
          )}

          {/* Sparkline Chart */}
          <div className="h-16 mt-3 -mx-5 -mb-1">
            <ChartContainer config={sparklineChartConfig} className="h-full w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                  strokeWidth={2}
                  fill={`url(#gradient-${title.replace(/\s/g, '')})`}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </ShadcnCard>
    </motion.div>
  )
}

// Custom Tooltip para gráfica principal
const CustomMainTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "12px",
        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      }}>
        <p style={{ fontWeight: 600, color: "#111827", marginBottom: "8px", fontSize: "13px" }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color, fontSize: "13px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 600 }}>{entry.name}:</span>{" "}
            {entry.name === "Inventario"
              ? `${formatNumber(entry.value)} unidades`
              : formatCurrency(entry.value)
            }
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function VentasPage() {
  const [dateRange] = useState({ start: "2024-01-01", end: "2025-12-31" })
  const [selectedTab, setSelectedTab] = useState("perdidas")

  // Fetch all data
  const { data: kpis, isLoading: loadingKPIs } = useVentasKPIs(TENANT_ID, dateRange.start, dateRange.end)
  const { data: perdidasProducto } = useVentasPerdidasAnalysis(TENANT_ID, dateRange.start, dateRange.end, "producto", 10)
  const { data: perdidasCliente } = useVentasPerdidasAnalysis(TENANT_ID, dateRange.start, dateRange.end, "cliente", 10)
  const { data: perdidasCategoria } = useVentasPerdidasAnalysis(TENANT_ID, dateRange.start, dateRange.end, "categoria")
  const { data: ventasList } = useVentasList(TENANT_ID, {
    fechaInicio: dateRange.start,
    fechaFin: dateRange.end,
    soloConPerdidas: true,
    limit: 20,
  })
  const { data: rentabilidadProducto } = useVentasRentabilidad(TENANT_ID, dateRange.start, dateRange.end, "producto", 10)
  const { data: cumplimientoResumen } = useVentasCumplimiento(TENANT_ID, dateRange.start, dateRange.end, "resumen")
  const { data: temporalMensual } = useVentasTemporal(TENANT_ID, dateRange.start, dateRange.end, "mensual")
  const { data: temporalDiaSemana } = useVentasTemporal(TENANT_ID, dateRange.start, dateRange.end, "dia_semana")
  const { data: descuentosCliente } = useVentasDescuentos(TENANT_ID, dateRange.start, dateRange.end, "cliente", 10)

  // Preparar datos para gráfica principal (últimos 12 meses)
  const mainChartData = (() => {
    if (!temporalMensual || temporalMensual.length === 0) return []

    // El RPC devuelve múltiples filas por periodo, necesitamos agrupar
    const groupedByPeriodo = temporalMensual.reduce((acc, item) => {
      if (!acc[item.periodo]) {
        acc[item.periodo] = {
          periodo: item.periodo,
          total_ventas: 0,
          unidades_vendidas: 0,
          tasa_cumplimiento_sum: 0,
          count: 0,
        }
      }
      acc[item.periodo].total_ventas += item.total_ventas
      acc[item.periodo].unidades_vendidas += item.unidades_vendidas
      acc[item.periodo].tasa_cumplimiento_sum += item.tasa_cumplimiento
      acc[item.periodo].count += 1
      return acc
    }, {} as Record<string, any>)

    // Convertir a array y ordenar por periodo
    const aggregated = Object.values(groupedByPeriodo).sort((a: any, b: any) => {
      // Extraer año y mes de "Enero 2024" formato
      const [mesA, añoA] = a.periodo.split(' ')
      const [mesB, añoB] = b.periodo.split(' ')
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      const fechaA = parseInt(añoA) * 12 + meses.indexOf(mesA)
      const fechaB = parseInt(añoB) * 12 + meses.indexOf(mesB)
      return fechaA - fechaB
    })

    // Tomar los últimos 12 periodos
    const last12Periods = aggregated.slice(-12)

    return last12Periods.map((item: any) => {
      // Formatear "Enero 2024" a "Ene-24"
      const [mes, año] = item.periodo.split(' ')
      const mesCorto = mes.substring(0, 3)
      const añoCorto = año.slice(-2)
      const mesLabel = `${mesCorto}-${añoCorto}`

      const tasa_cumplimiento_promedio = item.tasa_cumplimiento_sum / item.count

      return {
        mes: mesLabel,
        "Venta Perdida": item.total_ventas * ((100 - tasa_cumplimiento_promedio) / 100),
        "Ventas": item.total_ventas,
        "Inventario": item.unidades_vendidas,
      }
    })
  })()

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header - Estilo consistente */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Venta Perdida
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analisis detallado de oportunidades de mejora
            </p>
          </div>
        </motion.div>

        {/* KPI Cards Grid with Sparklines */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SparklineKPICard
            title="Ventas Perdidas"
            value={formatCurrency(kpis?.total_ventas_perdidas || 0)}
            trend={{
              value: Math.abs(kpis?.cambio_perdidas_pct || 0),
              isPositive: (kpis?.cambio_perdidas_pct || 0) < 0,
              actualChange: kpis?.cambio_perdidas_pct || 0
            }}
            subtitle="vs período anterior"
            loading={loadingKPIs}
            delay={0}
          />

          <SparklineKPICard
            title="Ventas Totales"
            value={formatCurrency(kpis?.total_ventas || 0)}
            trend={{
              value: Math.abs(kpis?.cambio_ventas_pct || 0),
              isPositive: (kpis?.cambio_ventas_pct || 0) >= 0,
              actualChange: kpis?.cambio_ventas_pct || 0
            }}
            subtitle="vs período anterior"
            loading={loadingKPIs}
            delay={0.05}
          />

          <SparklineKPICard
            title="Tasa Cumplimiento"
            value={formatPercent(kpis?.tasa_cumplimiento_promedio || 0)}
            trend={{
              value: Math.abs(kpis?.cambio_cumplimiento_pct || 0),
              isPositive: (kpis?.cambio_cumplimiento_pct || 0) >= 0,
              actualChange: kpis?.cambio_cumplimiento_pct || 0
            }}
            subtitle="vs período anterior"
            loading={loadingKPIs}
            delay={0.1}
          />

          <SparklineKPICard
            title="Órdenes Afectadas"
            value={formatNumber(kpis?.ordenes_con_perdidas || 0)}
            subtitle={kpis ? `${((kpis.ordenes_con_perdidas / kpis.numero_ordenes) * 100).toFixed(1)}% del total` : ""}
            loading={loadingKPIs}
            delay={0.15}
          />
        </div>

        {/* Gráfica Principal - Últimos 12 Meses */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ShadcnCard className="border border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">
                Desempeño de Ventas
              </CardTitle>
              <CardDescription>
                Comparativa de los últimos 12 meses: ventas totales, pérdidas e inventario
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Leyenda personalizada estilo Notion */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.ventas }} />
                  <span className="text-xs text-muted-foreground">Ventas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.ventaPerdida }} />
                  <span className="text-xs text-muted-foreground">Venta Perdida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm opacity-50" style={{ backgroundColor: COLORS.inventario }} />
                  <span className="text-xs text-muted-foreground">Inventario (unidades)</span>
                </div>
              </div>

              <ChartContainer config={performanceChartConfig} className="h-[350px] w-full">
                <ComposedChart data={mainChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInventario" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.inventario} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.inventario} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm text-foreground mb-2">{label}</p>
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-muted-foreground">{entry.name}:</span>
                                <span className="font-medium text-foreground">
                                  {entry.name === "Inventario"
                                    ? `${formatNumber(entry.value)} unidades`
                                    : formatCurrency(entry.value)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  {/* Inventario - Area sombreada */}
                  <Area
                    type="monotone"
                    dataKey="Inventario"
                    stroke={COLORS.inventario}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInventario)"
                    yAxisId="right"
                  />
                  {/* Venta Perdida - Barras */}
                  <Bar
                    dataKey="Venta Perdida"
                    fill={COLORS.ventaPerdida}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={35}
                    opacity={0.9}
                  />
                  {/* Ventas - Línea principal */}
                  <Line
                    type="monotone"
                    dataKey="Ventas"
                    stroke={COLORS.ventas}
                    strokeWidth={2.5}
                    dot={{ fill: COLORS.ventas, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </ShadcnCard>
        </motion.div>

        {/* Tabs con análisis detallado */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger
                value="perdidas"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Análisis de Pérdidas
              </TabsTrigger>
              <TabsTrigger
                value="transacciones"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Transacciones
              </TabsTrigger>
              <TabsTrigger
                value="rentabilidad"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Rentabilidad
              </TabsTrigger>
              <TabsTrigger
                value="cumplimiento"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Cumplimiento
              </TabsTrigger>
              <TabsTrigger
                value="temporal"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Temporal
              </TabsTrigger>
              <TabsTrigger
                value="descuentos"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Descuentos
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Análisis de Pérdidas */}
            <TabsContent value="perdidas" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Productos */}
                <ShadcnCard className="border border-border/40 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Top 10 Productos con Pérdidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {perdidasProducto?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.nombre}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs font-normal">
                                {item.categoria}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Fill Rate: {formatPercent(item.tasa_cumplimiento_promedio)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-4">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.total_ventas_perdidas)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercent(item.porcentaje_del_total)} del total
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </ShadcnCard>

                {/* Top Clientes */}
                <ShadcnCard className="border border-border/40 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Top 10 Clientes Afectados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {perdidasCliente?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.nombre}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs font-normal">
                                {item.categoria}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.numero_ordenes_afectadas} órdenes
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-4">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.total_ventas_perdidas)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercent(item.porcentaje_del_total)} del total
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </ShadcnCard>
              </div>

              {/* Distribución por Categoría */}
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Distribución de Pérdidas por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={performanceChartConfig} className="h-[350px] w-full">
                    <PieChart>
                      <Pie
                        data={perdidasCategoria?.map(item => ({
                          name: item.nombre,
                          value: item.total_ventas_perdidas,
                        })) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {perdidasCategoria?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={[
                              'hsl(217, 91%, 50%)',  // Azul RushData
                              'hsl(217, 91%, 60%)',
                              'hsl(217, 91%, 70%)',
                              'hsl(220, 9%, 40%)'    // Gris
                            ][index % 4]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-sm text-foreground">{payload[0].name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab 2: Transacciones */}
            <TabsContent value="transacciones" className="mt-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Órdenes con Pérdidas (Últimas 20)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-medium">Orden</TableHead>
                          <TableHead className="text-xs font-medium">Fecha</TableHead>
                          <TableHead className="text-xs font-medium">Cliente</TableHead>
                          <TableHead className="text-xs font-medium">Producto</TableHead>
                          <TableHead className="text-xs font-medium text-right">Solicitado</TableHead>
                          <TableHead className="text-xs font-medium text-right">Entregado</TableHead>
                          <TableHead className="text-xs font-medium text-right">Perdido</TableHead>
                          <TableHead className="text-xs font-medium text-right">Monto</TableHead>
                          <TableHead className="text-xs font-medium text-right">Fill Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ventasList?.map((venta, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium">{venta.numero_orden}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(venta.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                            </TableCell>
                            <TableCell className="text-sm font-medium max-w-[150px] truncate">
                              {venta.cliente_nombre}
                            </TableCell>
                            <TableCell className="text-sm max-w-[150px] truncate">
                              {venta.producto_nombre}
                            </TableCell>
                            <TableCell className="text-sm text-right font-medium">
                              {formatNumber(venta.cantidad_solicitada)}
                            </TableCell>
                            <TableCell className="text-sm text-right text-emerald-600 font-medium">
                              {formatNumber(venta.cantidad_entregada)}
                            </TableCell>
                            <TableCell className="text-sm text-right font-semibold">
                              {formatNumber(venta.cantidad_perdida)}
                            </TableCell>
                            <TableCell className="text-sm text-right font-semibold">
                              {formatCurrency(venta.monto_perdida)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  venta.tasa_cumplimiento >= 95
                                    ? "default"
                                    : venta.tasa_cumplimiento >= 75
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {formatPercent(venta.tasa_cumplimiento)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab 3: Rentabilidad */}
            <TabsContent value="rentabilidad" className="mt-6 space-y-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Top 10 Productos por Margen Bruto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={performanceChartConfig} className="h-[350px] w-full">
                    <RechartsBarChart data={rentabilidadProducto?.map(item => ({
                      nombre: item.nombre.substring(0, 20),
                      "Margen": item.margen_bruto,
                    })) || []} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                      <defs>
                        <linearGradient id="colorMargen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="nombre"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-sm text-foreground">{label}</p>
                                <p className="text-sm text-muted-foreground">
                                  Margen: {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="Margen" fill="url(#colorMargen)" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ChartContainer>

                  <div className="mt-6 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-medium">Producto</TableHead>
                          <TableHead className="text-xs font-medium text-right">Ventas</TableHead>
                          <TableHead className="text-xs font-medium text-right">Costo</TableHead>
                          <TableHead className="text-xs font-medium text-right">Margen</TableHead>
                          <TableHead className="text-xs font-medium text-right">Margen %</TableHead>
                          <TableHead className="text-xs font-medium text-right">Órdenes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rentabilidadProducto?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium">{item.nombre}</TableCell>
                            <TableCell className="text-sm text-right font-medium">
                              {formatCurrency(item.total_ventas)}
                            </TableCell>
                            <TableCell className="text-sm text-right text-muted-foreground">
                              {formatCurrency(item.costo_total)}
                            </TableCell>
                            <TableCell className="text-sm text-right font-semibold text-emerald-600">
                              {formatCurrency(item.margen_bruto)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  item.margen_porcentaje >= 40
                                    ? "default"
                                    : item.margen_porcentaje >= 20
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {formatPercent(item.margen_porcentaje)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              {formatNumber(item.numero_ordenes)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab 4: Cumplimiento */}
            <TabsContent value="cumplimiento" className="mt-6 space-y-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Distribución de Fill Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={performanceChartConfig} className="h-[300px] w-full">
                    <RechartsBarChart data={cumplimientoResumen?.map(item => ({
                      rango: item.nombre,
                      "Órdenes": item.total_ordenes,
                    })) || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOrdenes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="rango"
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-sm text-foreground">{label}</p>
                                <p className="text-sm text-muted-foreground">
                                  Órdenes: {formatNumber(payload[0].value as number)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="Órdenes" fill="url(#colorOrdenes)" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
              </ShadcnCard>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cumplimientoResumen?.map((item, idx) => (
                  <ShadcnCard key={idx} className="border border-border/40 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Fill Rate</p>
                          <p className="text-xl font-bold text-foreground">
                            {item.nombre}
                          </p>
                        </div>
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          item.nombre === "100%"
                            ? "bg-emerald-100 text-emerald-600"
                            : item.nombre.includes("90")
                            ? "bg-blue-100 text-blue-600"
                            : item.nombre.includes("75")
                            ? "bg-amber-100 text-amber-600"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Órdenes</span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatNumber(item.total_ordenes)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Unidades</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatNumber(item.unidades_entregadas)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">Del total</span>
                          <span className="text-sm font-semibold text-primary">
                            {formatPercent((item.total_ordenes / (kpis?.numero_ordenes || 1)) * 100)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </ShadcnCard>
                ))}
              </div>
            </TabsContent>

            {/* Tab 5: Temporal */}
            <TabsContent value="temporal" className="mt-6 space-y-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Ventas por Día de la Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={performanceChartConfig} className="h-[300px] w-full">
                    <RechartsBarChart data={temporalDiaSemana?.map(item => ({
                      dia: item.periodo,
                      "Ventas": item.total_ventas,
                    })) || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVentasDia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="dia"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-sm text-foreground">{label}</p>
                                <p className="text-sm text-muted-foreground">
                                  Ventas: {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="Ventas" fill="url(#colorVentasDia)" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
              </ShadcnCard>

              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Fill Rate por Día de la Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={performanceChartConfig} className="h-[300px] w-full">
                    <LineChart data={temporalDiaSemana?.map(item => ({
                      dia: item.periodo,
                      "Fill Rate": item.tasa_cumplimiento,
                    })) || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis
                        dataKey="dia"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(value) => `${value}%`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-sm text-foreground">{label}</p>
                                <p className="text-sm text-muted-foreground">
                                  Fill Rate: {(payload[0].value as number).toFixed(2)}%
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Fill Rate"
                        stroke="hsl(217, 91%, 50%)"
                        strokeWidth={2.5}
                        dot={{ fill: "hsl(217, 91%, 50%)", r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab 6: Descuentos */}
            <TabsContent value="descuentos" className="mt-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Top 10 Clientes por Descuentos Aplicados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {descuentosCliente?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-xs font-normal">
                              {item.categoria}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatNumber(item.ordenes_con_descuento)} de {formatNumber(item.numero_ordenes)} órdenes
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-4 space-y-1">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.total_descuentos)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPercent(item.porcentaje_descuento_promedio)} descuento
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-border">
                          <span className="text-muted-foreground">Margen:</span>
                          <span className={cn(
                            "font-medium",
                            (item.impacto_margen || 0) < 0 ? "text-destructive" : "text-foreground"
                          )}>
                            {item.margen_con_descuento?.toFixed(1) || "N/A"}%
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-medium text-foreground">
                            {item.margen_sin_descuento?.toFixed(1) || "N/A"}%
                          </span>
                          {item.impacto_margen !== null && (
                            <span className={cn(
                              "font-semibold",
                              item.impacto_margen < 0 ? "text-destructive" : "text-emerald-600"
                            )}>
                              ({item.impacto_margen > 0 ? "+" : ""}{item.impacto_margen.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </ShadcnCard>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
