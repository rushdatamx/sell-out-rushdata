"use client"

import { motion } from "framer-motion"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Area,
  AreaChart,
  ComposedChart,
  Label,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
  Calendar,
  Activity,
  AlertTriangle,
  PackageX,
  Truck,
  Factory,
  CheckCircle2,
  ArrowRight,
  Phone,
} from "lucide-react"
import {
  useKPIs,
  useMonthlySalesComparison,
  useTopProducts,
  useTopClients,
  useInventoryStatus,
  useLastDataMonth,
} from "@/hooks/use-dashboard-data"
import { useDailyActions, useDailyActionsSummary } from "@/hooks/use-daily-actions"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

// Custom Tooltip para Ventas Mensuales
const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length === 2) {
    const currentYear = payload[0].value
    const previousYear = payload[1].value
    const difference = previousYear !== 0
      ? ((currentYear - previousYear) / previousYear) * 100
      : 0
    const isPositive = difference >= 0

    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <p className="font-semibold text-foreground mb-2 text-sm">{label}</p>
        <div className="space-y-1.5">
          <p className="text-sm">
            <span className="text-primary font-medium">Año Actual:</span>{" "}
            <span className="font-bold">{formatCurrency(currentYear)}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground font-medium">Año Anterior:</span>{" "}
            <span className="font-semibold">{formatCurrency(previousYear)}</span>
          </p>
        </div>
        <div className="border-t border-border mt-3 pt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Diferencia:</span>
          <span className={cn(
            "text-sm font-bold",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? "+" : ""}{difference.toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }
  return null
}

// KPI Card with Sparkline Component - Premium Style
interface SparklineKPICardProps {
  title: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  subtitle?: string
  loading?: boolean
  delay?: number
  sparklineData?: { value: number }[]
  sparklineColor?: string
}

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

  // Ensure last point reflects the trend direction
  if (trend >= 0) {
    data[data.length - 1] = { value: baseValue * 1.1 }
  } else {
    data[data.length - 1] = { value: baseValue * 0.85 }
  }

  return data
}

const sparklineChartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const salesChartConfig = {
  currentYear: {
    label: "Año Actual",
    color: "hsl(var(--primary))",
  },
  previousYear: {
    label: "Año Anterior",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig

const productsChartConfig = {
  total_ventas: {
    label: "Ventas",
  },
  product1: {
    label: "Producto 1",
    color: "hsl(217, 91%, 50%)",
  },
  product2: {
    label: "Producto 2",
    color: "hsl(217, 91%, 60%)",
  },
  product3: {
    label: "Producto 3",
    color: "hsl(217, 91%, 70%)",
  },
  product4: {
    label: "Producto 4",
    color: "hsl(217, 91%, 78%)",
  },
  product5: {
    label: "Producto 5",
    color: "hsl(217, 91%, 85%)",
  },
} satisfies ChartConfig

const clientsChartConfig = {
  total_compras: {
    label: "Compras",
  },
  client1: {
    label: "Cliente 1",
    color: "hsl(217, 91%, 50%)",
  },
  client2: {
    label: "Cliente 2",
    color: "hsl(217, 91%, 60%)",
  },
  client3: {
    label: "Cliente 3",
    color: "hsl(217, 91%, 70%)",
  },
  client4: {
    label: "Cliente 4",
    color: "hsl(217, 91%, 78%)",
  },
  client5: {
    label: "Cliente 5",
    color: "hsl(217, 91%, 85%)",
  },
} satisfies ChartConfig

const inventoryChartConfig = {
  cantidad: {
    label: "Productos",
  },
  "Stock Alto": {
    label: "Stock Alto",
    color: "hsl(217, 91%, 50%)",
  },
  "Stock Normal": {
    label: "Stock Normal",
    color: "hsl(217, 91%, 65%)",
  },
  "Stock Bajo": {
    label: "Stock Bajo",
    color: "hsl(217, 91%, 80%)",
  },
  "Sin Stock": {
    label: "Sin Stock",
    color: "hsl(217, 91%, 90%)",
  },
} satisfies ChartConfig

function SparklineKPICard({
  title,
  value,
  trend,
  subtitle,
  loading,
  delay = 0,
  sparklineData,
  sparklineColor = "hsl(var(--primary))"
}: SparklineKPICardProps) {
  const chartData = sparklineData || (trend ? generateSparklineData(trend.value) : generateSparklineData(0))
  const isPositive = trend ? trend.isPositive : true

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden">
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
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}{trend.value.toFixed(1)}%
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
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<30 | 60 | 90>(30)

  const { data: lastMonth } = useLastDataMonth(TENANT_ID, dateFilter)
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useKPIs(TENANT_ID, dateFilter)
  const { data: monthlySales, isLoading: salesLoading } = useMonthlySalesComparison(TENANT_ID)
  const { data: topProducts, isLoading: productsLoading } = useTopProducts(TENANT_ID, 5, dateFilter)
  const { data: topClients, isLoading: clientsLoading } = useTopClients(TENANT_ID, 5, dateFilter)
  const { data: inventoryStatus, isLoading: inventoryLoading } = useInventoryStatus(TENANT_ID)

  // Acciones del día desde predicciones
  const { data: dailyActions, isLoading: actionsLoading } = useDailyActions(TENANT_ID, 5)
  const { data: actionsSummary } = useDailyActionsSummary(TENANT_ID)

  const ventasMesChange = kpis ? calculatePercentChange(kpis.ventasMes, kpis.ventasMesAnterior) : 0
  const ventasYTDChange = kpis ? calculatePercentChange(kpis.ventasYTD, kpis.ventasYTDAnterior) : 0

  if (kpisError) {
    console.error("Error cargando KPIs:", kpisError)
  }

  const mesEnCurso = lastMonth ? `${lastMonth.nombre_mes} ${lastMonth.anio}` : "Cargando..."

  const chartColors = {
    primary: "hsl(var(--primary))",
    secondary: "hsl(220, 60%, 35%)",
    tertiary: "hsl(var(--accent))",
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Minimalista */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Actualizado: {mesEnCurso}
            </p>
          </div>

          {/* Filtros de Fecha - Toggle Group */}
          <ToggleGroup
            type="single"
            value={dateFilter.toString()}
            onValueChange={(value) => value && setDateFilter(parseInt(value) as 30 | 60 | 90)}
            variant="outline"
          >
            <ToggleGroupItem value="30" aria-label="30 días">
              30 días
            </ToggleGroupItem>
            <ToggleGroupItem value="60" aria-label="60 días">
              60 días
            </ToggleGroupItem>
            <ToggleGroupItem value="90" aria-label="90 días">
              90 días
            </ToggleGroupItem>
          </ToggleGroup>
        </motion.div>

        {/* KPI Cards Grid with Sparklines */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SparklineKPICard
            title={`Ventas ${dateFilter}D`}
            value={formatCurrency(kpis?.ventasMes || 0)}
            trend={{ value: ventasMesChange, isPositive: ventasMesChange >= 0 }}
            subtitle="vs período anterior"
            loading={kpisLoading}
            delay={0}
          />

          <SparklineKPICard
            title="Ventas YTD"
            value={formatCurrency(kpis?.ventasYTD || 0)}
            trend={{ value: ventasYTDChange, isPositive: ventasYTDChange >= 0 }}
            subtitle="vs año anterior"
            loading={kpisLoading}
            delay={0.05}
          />

          <SparklineKPICard
            title="Clientes Activos"
            value={kpis?.clientesActivos || 0}
            trend={{ value: 5.2, isPositive: true }}
            subtitle={`Últimos ${dateFilter} días`}
            loading={kpisLoading}
            delay={0.1}
          />

          <SparklineKPICard
            title="Ticket Promedio"
            value={formatCurrency(kpis?.ticketPromedio || 0)}
            trend={{ value: 3.8, isPositive: true }}
            subtitle={`Últimos ${dateFilter} días`}
            loading={kpisLoading}
            delay={0.15}
          />

          <SparklineKPICard
            title="Stock Crítico"
            value={kpis?.productoscrticos || 0}
            trend={{
              value: kpis?.productoscrticos && kpis.productoscrticos > 0 ? -12.5 : 0,
              isPositive: !(kpis?.productoscrticos && kpis.productoscrticos > 0)
            }}
            subtitle="Productos bajo mínimo"
            loading={kpisLoading}
            delay={0.2}
          />

          <SparklineKPICard
            title="Margen Promedio"
            value={`${((kpis?.margenPromedio || 0) * 100).toFixed(0)}%`}
            trend={{ value: 2.1, isPositive: true }}
            subtitle={`Últimos ${dateFilter} días`}
            loading={kpisLoading}
            delay={0.25}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Ventas Mensuales - 2 columnas */}
          <Card className="lg:col-span-2 border border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle>Ventas Mensuales Comparativas</CardTitle>
              <CardDescription>Comparación año actual vs año anterior</CardDescription>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : monthlySales && monthlySales.length > 0 ? (
                <ChartContainer config={salesChartConfig} className="h-72 w-full">
                  <ComposedChart accessibilityLayer data={monthlySales}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const parts = value.split(' ')
                        if (parts.length === 2) {
                          return parts[0].slice(0, 3)
                        }
                        return value.slice(0, 3)
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="dashed"
                          formatter={(value, name, item) => {
                            const payload = item.payload
                            const currentYear = payload.currentYear
                            const previousYear = payload.previousYear
                            const diff = previousYear !== 0
                              ? ((currentYear - previousYear) / previousYear) * 100
                              : 0
                            const isPositive = diff >= 0

                            if (name === "currentYear") {
                              return (
                                <span className="flex items-center gap-2">
                                  {formatCurrency(value as number)}
                                  <span className={cn(
                                    "text-xs font-medium",
                                    isPositive ? "text-emerald-600" : "text-rose-600"
                                  )}>
                                    ({isPositive ? "+" : ""}{diff.toFixed(1)}%)
                                  </span>
                                </span>
                              )
                            }
                            return formatCurrency(value as number)
                          }}
                        />
                      }
                    />
                    <Bar dataKey="currentYear" fill="var(--color-currentYear)" radius={4} barSize={32} />
                    <Line
                      type="monotone"
                      dataKey="previousYear"
                      stroke="var(--color-previousYear)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-previousYear)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ChartContainer>
              ) : (
                <div className="h-72 flex items-center justify-center bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                {ventasMesChange >= 0 ? (
                  <>
                    Crecimiento de {ventasMesChange.toFixed(1)}% este período <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </>
                ) : (
                  <>
                    Disminución de {Math.abs(ventasMesChange).toFixed(1)}% este período <TrendingDown className="h-4 w-4 text-rose-500" />
                  </>
                )}
              </div>
              <div className="text-muted-foreground leading-none">
                Mostrando ventas mensuales del último año
              </div>
            </CardFooter>
          </Card>

          {/* Top 5 Productos */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 5 Productos</CardTitle>
              <CardDescription>Productos más vendidos del período</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="h-52 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : topProducts && topProducts.length > 0 ? (
                (() => {
                  const totalVentas = topProducts.reduce((sum, p) => sum + p.total_ventas, 0)
                  return (
                    <ChartContainer config={productsChartConfig} className="h-64 w-full">
                      <RechartsBarChart
                        accessibilityLayer
                        data={topProducts.map((product, index) => ({
                          ...product,
                          fill: `var(--color-product${index + 1})`,
                          porcentaje: ((product.total_ventas / totalVentas) * 100).toFixed(1),
                        }))}
                        layout="vertical"
                        margin={{ left: 20, top: 0, bottom: 0, right: 10 }}
                        barGap={2}
                      >
                        <YAxis
                          dataKey="nombre"
                          type="category"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          width={140}
                          tick={{ fontSize: 12 }}
                        />
                        <XAxis dataKey="total_ventas" type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value, name, item) => {
                                const porcentaje = item.payload.porcentaje
                                return (
                                  <span>
                                    {formatCurrency(value as number)} <span className="text-muted-foreground">({porcentaje}%)</span>
                                  </span>
                                )
                              }}
                            />
                          }
                        />
                        <Bar dataKey="total_ventas" layout="vertical" radius={5} barSize={28} />
                      </RechartsBarChart>
                    </ChartContainer>
                  )
                })()
              ) : (
                <div className="h-52 flex items-center justify-center bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">No hay productos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Top 5 Clientes */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 5 Clientes</CardTitle>
              <CardDescription>Clientes con mayor volumen de compras</CardDescription>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : topClients && topClients.length > 0 ? (
                (() => {
                  const totalCompras = topClients.reduce((sum, c) => sum + c.total_compras, 0)
                  return (
                    <ChartContainer config={clientsChartConfig} className="h-64 w-full">
                      <RechartsBarChart
                        accessibilityLayer
                        data={topClients.map((client, index) => ({
                          ...client,
                          fill: `var(--color-client${index + 1})`,
                          porcentaje: ((client.total_compras / totalCompras) * 100).toFixed(1),
                        }))}
                        layout="vertical"
                        margin={{ left: 20, top: 0, bottom: 0, right: 10 }}
                        barGap={2}
                      >
                        <YAxis
                          dataKey="nombre"
                          type="category"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          width={140}
                          tick={{ fontSize: 12 }}
                        />
                        <XAxis dataKey="total_compras" type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value, name, item) => {
                                const porcentaje = item.payload.porcentaje
                                return (
                                  <span>
                                    {formatCurrency(value as number)} <span className="text-muted-foreground">({porcentaje}%)</span>
                                  </span>
                                )
                              }}
                            />
                          }
                        />
                        <Bar dataKey="total_compras" layout="vertical" radius={5} barSize={28} />
                      </RechartsBarChart>
                    </ChartContainer>
                  )
                })()
              ) : (
                <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">No hay clientes disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones Inmediatas */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Acciones del Día</CardTitle>
                {actionsSummary && actionsSummary.acciones_criticas > 0 && (
                  <Badge variant="destructive" className="h-6 px-2">
                    {actionsSummary.acciones_criticas} críticas
                  </Badge>
                )}
              </div>
              <CardDescription>
                {actionsSummary
                  ? `${actionsSummary.clientes_unicos} clientes · ${formatCurrency(actionsSummary.valor_total_en_riesgo)} en riesgo`
                  : "Tareas prioritarias del día"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              {actionsLoading ? (
                <div className="h-52 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {dailyActions && dailyActions.length > 0 ? (
                    dailyActions.map((action, idx) => {
                      const getUrgencyStyles = (urgencia: string) => {
                        switch (urgencia) {
                          case "critica":
                            return {
                              badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                              icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
                              label: "Crítica"
                            }
                          case "alta":
                            return {
                              badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                              icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                              label: "Alta"
                            }
                          case "media":
                            return {
                              badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                              icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                              label: "Media"
                            }
                          default:
                            return {
                              badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
                              icon: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                              label: "Normal"
                            }
                        }
                      }

                      const styles = getUrgencyStyles(action.urgencia)

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors group"
                        >
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", styles.icon)}>
                            <Phone className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-5 font-medium border-0", styles.badge)}>
                                {styles.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{action.categoria}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground leading-snug truncate">
                              {action.cliente_nombre}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {action.producto_nombre} · {formatCurrency(action.valor_estimado)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-foreground">¡Todo al día!</p>
                      <p className="text-xs text-muted-foreground">No hay acciones pendientes</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            {dailyActions && dailyActions.length > 0 && (
              <CardFooter className="pt-0">
                <Link href="/dashboard/predicciones" className="w-full">
                  <Button variant="outline" className="w-full group">
                    Ver todas las acciones
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>

          {/* Estado de Inventario */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Estado de Inventario</CardTitle>
              <CardDescription>Distribución de productos por estado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {inventoryLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : inventoryStatus && inventoryStatus.length > 0 ? (
                (() => {
                  const totalProducts = inventoryStatus.reduce((sum, item) => sum + item.cantidad, 0)
                  const categoryColors: Record<string, string> = {
                    "Stock Alto": "hsl(217, 91%, 50%)",
                    "Stock Normal": "hsl(217, 91%, 65%)",
                    "Stock Bajo": "hsl(217, 91%, 80%)",
                    "Sin Stock": "hsl(217, 91%, 90%)",
                  }
                  return (
                    <ChartContainer
                      config={inventoryChartConfig}
                      className="mx-auto aspect-square max-h-[220px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value, name, item) => {
                                const porcentaje = ((value as number) / totalProducts * 100).toFixed(1)
                                return (
                                  <span>
                                    {value} productos <span className="text-muted-foreground">({porcentaje}%)</span>
                                  </span>
                                )
                              }}
                            />
                          }
                        />
                        <Pie
                          data={inventoryStatus.map((item) => ({
                            ...item,
                            fill: categoryColors[item.categoria] || "hsl(217, 91%, 70%)",
                          }))}
                          dataKey="cantidad"
                          nameKey="categoria"
                          innerRadius={60}
                          outerRadius={85}
                          strokeWidth={3}
                          stroke="hsl(var(--background))"
                        >
                          <Label
                            content={({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className="fill-foreground text-3xl font-bold"
                                    >
                                      {totalProducts.toLocaleString()}
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 22}
                                      className="fill-muted-foreground text-sm"
                                    >
                                      productos
                                    </tspan>
                                  </text>
                                )
                              }
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  )
                })()
              ) : (
                <div className="h-[200px] flex items-center justify-center bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">No hay datos de inventario</p>
                </div>
              )}
            </CardContent>
            {inventoryStatus && inventoryStatus.length > 0 && (
              <CardFooter className="flex-col gap-2 text-sm pt-4">
                <div className="grid grid-cols-2 gap-2 w-full">
                  {inventoryStatus.map((status, idx) => {
                    const colorClasses: Record<string, string> = {
                      "Stock Alto": "bg-[hsl(217,91%,50%)]",
                      "Stock Normal": "bg-[hsl(217,91%,65%)]",
                      "Stock Bajo": "bg-[hsl(217,91%,80%)]",
                      "Sin Stock": "bg-[hsl(217,91%,90%)]",
                    }
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2"
                      >
                        <div className={cn("h-2.5 w-2.5 rounded-full", colorClasses[status.categoria] || "bg-muted")} />
                        <span className="text-xs text-muted-foreground">{status.categoria}</span>
                        <span className="text-xs font-medium text-foreground ml-auto">{status.cantidad}</span>
                      </div>
                    )
                  })}
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
