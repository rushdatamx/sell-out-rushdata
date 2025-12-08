"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Factory,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react"
import {
  useInventoryKPIs,
  useInventoryAlerts,
  useInventoryList,
  useInventoryTrends,
  useInventoryByCategory,
  useProductionRecommendations,
} from "@/hooks/use-inventory-data"

const TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

// Colores RushData
const COLORS = {
  primary: "hsl(217, 91%, 50%)",
  primaryLight: "hsl(217, 91%, 70%)",
  primaryMuted: "hsl(217, 91%, 60%)",
  critico: "hsl(0, 84%, 60%)",
  bajo: "hsl(25, 95%, 53%)",
  optimo: "hsl(152, 69%, 40%)",
  exceso: "hsl(217, 91%, 50%)",
  sinStock: "hsl(220, 9%, 46%)",
  gray: "hsl(220, 9%, 30%)",
}

// Colores para gráficas - Solo paleta RushData (azules y grises)
const PIE_COLORS = [
  "hsl(217, 91%, 50%)",  // Azul principal
  "hsl(217, 91%, 60%)",  // Azul medio
  "hsl(217, 91%, 70%)",  // Azul claro
  "hsl(220, 9%, 30%)",   // Gris oscuro
  "hsl(220, 9%, 46%)",   // Gris medio
  "hsl(220, 9%, 60%)",   // Gris claro
]

// Chart config - Colores RushData
const inventoryChartConfig = {
  valorInventario: { label: "Valor Inventario", color: "hsl(217, 91%, 50%)" },
  productosCriticos: { label: "Productos Críticos", color: "hsl(220, 9%, 30%)" },
  ventasPerdidas: { label: "Ventas Perdidas", color: "hsl(220, 9%, 46%)" },
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
  return `${value.toFixed(1)}%`
}

// Colores RushData para estados de stock
const getEstadoStockConfig = (estado: string) => {
  switch (estado) {
    case "sin_stock":
      return { color: "bg-[hsl(220,9%,90%)] text-[hsl(220,9%,30%)]", icon: XCircle, label: "Sin Stock" }
    case "critico":
      return { color: "bg-[hsl(220,9%,85%)] text-[hsl(220,9%,20%)]", icon: AlertTriangle, label: "Crítico" }
    case "bajo":
      return { color: "bg-[hsl(220,9%,92%)] text-[hsl(220,9%,46%)]", icon: AlertCircle, label: "Bajo" }
    case "optimo":
      return { color: "bg-[hsl(217,91%,95%)] text-[hsl(217,91%,50%)]", icon: CheckCircle2, label: "Óptimo" }
    case "exceso":
      return { color: "bg-[hsl(217,91%,90%)] text-[hsl(217,91%,60%)]", icon: Package, label: "Exceso" }
    default:
      return { color: "bg-muted text-muted-foreground", icon: Package, label: estado }
  }
}

const getPrioridadVariant = (prioridad: string): "destructive" | "default" | "secondary" | "outline" => {
  switch (prioridad) {
    case "urgente":
      return "destructive"
    case "alta":
      return "default"
    case "media":
      return "secondary"
    default:
      return "outline"
  }
}

const getPrioridadLabel = (prioridad: string): string => {
  switch (prioridad) {
    case "urgente":
      return "URGENTE"
    case "alta":
      return "Alta"
    case "media":
      return "Media"
    case "baja":
      return "Baja"
    default:
      return prioridad
  }
}

// KPI Card Component
interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  loading?: boolean
  delay?: number
  accentColor?: string
  badge?: { label: string; variant?: "destructive" | "default" | "secondary" | "outline" }
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
  delay = 0,
  accentColor = "bg-primary",
  badge,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <ShadcnCard className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">
                {title}
              </p>
              {loading ? (
                <Skeleton className="h-7 w-28 mb-2" />
              ) : (
                <p className="text-xl font-bold text-foreground tracking-tight truncate">
                  {value}
                </p>
              )}
            </div>
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", accentColor)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            {badge && (
              <Badge variant={badge.variant || "secondary"} className="text-xs">
                {badge.label}
              </Badge>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </ShadcnCard>
    </motion.div>
  )
}

export default function InventarioPage() {
  const [selectedTab, setSelectedTab] = useState("productos")
  const [listFilters, setListFilters] = useState({
    estadoStock: "",
    categoria: "",
    search: "",
  })

  // Fetch all data
  const { data: kpis, isLoading: loadingKPIs } = useInventoryKPIs(TENANT_ID)
  const { data: alerts } = useInventoryAlerts(TENANT_ID, 10)
  const { data: inventoryList } = useInventoryList(TENANT_ID, {
    estadoStock: listFilters.estadoStock || undefined,
    categoria: listFilters.categoria || undefined,
    search: listFilters.search || undefined,
    limit: 50,
  })
  const { data: trends } = useInventoryTrends(TENANT_ID, { agrupacion: "diario" })
  const { data: categoryData } = useInventoryByCategory(TENANT_ID)
  const { data: productionRecs } = useProductionRecommendations(TENANT_ID, 15)

  // Preparar datos para gráfica de tendencia
  const trendChartData = trends?.map(item => ({
    periodo: item.periodo_label,
    "Valor Inventario": item.valor_inventario_total,
    "Productos Críticos": item.productos_criticos + item.productos_sin_stock,
    "Ventas Perdidas": item.valor_ventas_perdidas_acumuladas,
  })) || []

  // Preparar datos para pie chart de categorías
  const categoryPieData = categoryData?.map(cat => ({
    name: cat.categoria,
    value: cat.valor_inventario,
  })) || []

  // Stock distribution data - Colores RushData
  const stockDistribution = [
    { key: "sin_stock", label: "Sin Stock", value: kpis?.productos_sin_stock || 0, color: "bg-[hsl(220,9%,60%)]" },
    { key: "critico", label: "Crítico", value: kpis?.productos_criticos || 0, color: "bg-[hsl(220,9%,30%)]" },
    { key: "bajo", label: "Bajo", value: kpis?.productos_bajos || 0, color: "bg-[hsl(220,9%,46%)]" },
    { key: "optimo", label: "Óptimo", value: kpis?.productos_optimos || 0, color: "bg-[hsl(217,91%,50%)]" },
    { key: "exceso", label: "Exceso", value: kpis?.productos_exceso || 0, color: "bg-[hsl(217,91%,70%)]" },
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header - Estilo Notion */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Inventario
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control y análisis de niveles de stock
            </p>
          </div>
          {kpis?.fecha_ultimo_calculo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Última actualización: {new Date(kpis.fecha_ultimo_calculo).toLocaleString("es-MX")}</span>
            </div>
          )}
        </motion.div>

        {/* Alertas Críticas */}
        {alerts && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <ShadcnCard className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-destructive flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Alertas Críticas ({alerts.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alerts.slice(0, 6).map((alert, idx) => (
                    <div
                      key={idx}
                      className="bg-background rounded-lg p-4 border border-border hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-foreground truncate flex-1">
                          {alert.nombre}
                        </span>
                        <Badge variant={getPrioridadVariant(alert.prioridad)} className="text-[10px] flex-shrink-0">
                          {getPrioridadLabel(alert.prioridad)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{alert.mensaje}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Stock: <span className="font-semibold text-foreground">{formatNumber(Number(alert.stock_disponible) || 0)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Cobertura: <span className="font-semibold text-foreground">{Number(alert.dias_cobertura)?.toFixed(0) || 0} días</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </ShadcnCard>
          </motion.div>
        )}

        {/* KPI Cards - Colores RushData */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Valor Inventario"
            value={formatCurrency(kpis?.valor_inventario_total || 0)}
            subtitle={`${kpis?.productos_total || 0} productos en stock`}
            icon={Package}
            loading={loadingKPIs}
            delay={0}
            accentColor="bg-[hsl(217,91%,50%)]"
          />
          <KPICard
            title="Productos Críticos"
            value={(kpis?.productos_criticos || 0) + (kpis?.productos_sin_stock || 0)}
            subtitle={`${kpis?.productos_bajos || 0} bajos`}
            icon={AlertTriangle}
            loading={loadingKPIs}
            delay={0.05}
            accentColor="bg-[hsl(220,9%,30%)]"
            badge={{ label: `${kpis?.productos_sin_stock || 0} sin stock`, variant: "secondary" }}
          />
          <KPICard
            title="Cobertura Promedio"
            value={`${(kpis?.dias_cobertura_promedio || 0).toFixed(0)} días`}
            subtitle={`Rotación: ${(kpis?.rotacion_promedio || 0).toFixed(1)}x`}
            icon={Clock}
            loading={loadingKPIs}
            delay={0.1}
            accentColor="bg-[hsl(217,91%,60%)]"
          />
          <KPICard
            title="Ventas Perdidas (30d)"
            value={formatCurrency(kpis?.valor_ventas_perdidas_total || 0)}
            subtitle={`${formatNumber(kpis?.ventas_perdidas_total || 0)} unidades no vendidas`}
            icon={TrendingDown}
            loading={loadingKPIs}
            delay={0.15}
            accentColor="bg-[hsl(220,9%,46%)]"
          />
        </div>

        {/* Distribución de Stock */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stockDistribution.map((item) => (
              <ShadcnCard
                key={item.key}
                className={cn(
                  "border border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer",
                  listFilters.estadoStock === item.key && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => setListFilters(prev => ({ ...prev, estadoStock: prev.estadoStock === item.key ? "" : item.key }))}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full", item.color)} />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-xl font-bold text-foreground">{item.value}</p>
                    </div>
                  </div>
                </CardContent>
              </ShadcnCard>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger
                value="productos"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Vista por Producto
              </TabsTrigger>
              <TabsTrigger
                value="produccion"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Recomendaciones Producción
              </TabsTrigger>
              <TabsTrigger
                value="categorias"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Por Categoría
              </TabsTrigger>
              <TabsTrigger
                value="tendencias"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Tendencias
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Vista por Producto */}
            <TabsContent value="productos" className="mt-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Inventario por Producto
                    </CardTitle>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Buscar producto..."
                          className="pl-9 w-[200px]"
                          value={listFilters.search}
                          onChange={(e) => setListFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                      </div>
                      <Select
                        value={listFilters.estadoStock || "all"}
                        onValueChange={(value) => setListFilters(prev => ({ ...prev, estadoStock: value === "all" ? "" : value }))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="sin_stock">Sin Stock</SelectItem>
                          <SelectItem value="critico">Crítico</SelectItem>
                          <SelectItem value="bajo">Bajo</SelectItem>
                          <SelectItem value="optimo">Óptimo</SelectItem>
                          <SelectItem value="exceso">Exceso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-medium">Producto</TableHead>
                          <TableHead className="text-xs font-medium">Estado</TableHead>
                          <TableHead className="text-xs font-medium text-right">Stock</TableHead>
                          <TableHead className="text-xs font-medium text-right">Mín / Máx</TableHead>
                          <TableHead className="text-xs font-medium text-right">Cobertura</TableHead>
                          <TableHead className="text-xs font-medium text-right">Rotación</TableHead>
                          <TableHead className="text-xs font-medium text-right">Demanda/día</TableHead>
                          <TableHead className="text-xs font-medium text-right">Valor</TableHead>
                          <TableHead className="text-xs font-medium text-right">V. Perdidas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryList?.map((item, idx) => {
                          const estadoConfig = getEstadoStockConfig(item.estado_stock)
                          const EstadoIcon = estadoConfig.icon
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                    {item.nombre}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{item.sku} • {item.categoria}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-xs gap-1", estadoConfig.color)}>
                                  <EstadoIcon className="h-3 w-3" />
                                  {estadoConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-right font-semibold">
                                {formatNumber(item.stock_disponible)}
                              </TableCell>
                              <TableCell className="text-sm text-right text-muted-foreground">
                                {formatNumber(item.stock_minimo)} / {formatNumber(item.stock_maximo)}
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                <span className={cn(
                                  "font-semibold",
                                  item.dias_cobertura < 7 ? "text-[hsl(220,9%,30%)]" :
                                  item.dias_cobertura < 14 ? "text-[hsl(220,9%,46%)]" :
                                  "text-foreground"
                                )}>
                                  {item.dias_cobertura?.toFixed(0) || 0} días
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                {(item.rotacion || 0).toFixed(1)}x
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                {(item.demanda_diaria || 0).toFixed(0)}
                              </TableCell>
                              <TableCell className="text-sm text-right font-medium">
                                {formatCurrency(item.valor_inventario || 0)}
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                {item.ventas_perdidas_30d > 0 ? (
                                  <span className="text-destructive font-semibold">
                                    {formatCurrency(item.valor_ventas_perdidas_30d || 0)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab 2: Recomendaciones de Producción */}
            <TabsContent value="produccion" className="mt-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[hsl(217,91%,50%)] flex items-center justify-center">
                      <Factory className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        Recomendaciones de Producción
                      </CardTitle>
                      <CardDescription>
                        Productos priorizados para producir basado en niveles de inventario y demanda
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {productionRecs?.map((rec, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-5 rounded-lg border transition-all hover:shadow-sm",
                        rec.prioridad === "urgente" ? "bg-[hsl(220,9%,95%)] dark:bg-[hsl(220,9%,15%)] border-[hsl(220,9%,30%)]" :
                        rec.prioridad === "alta" ? "bg-[hsl(217,91%,97%)] dark:bg-[hsl(217,91%,15%)] border-[hsl(217,91%,70%)]" :
                        "bg-background border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge variant={getPrioridadVariant(rec.prioridad)} className="text-xs">
                              {getPrioridadLabel(rec.prioridad)}
                            </Badge>
                            <span className="text-sm font-semibold text-foreground truncate">
                              {rec.producto_nombre}
                            </span>
                            <Badge variant="outline" className="text-xs">{rec.sku}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{rec.razon_recomendacion}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Stock actual</span>
                              <p className="font-semibold text-foreground">{formatNumber(rec.stock_actual)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cobertura</span>
                              <p className={cn("font-semibold", rec.dias_cobertura < 7 ? "text-[hsl(220,9%,30%)]" : "text-foreground")}>
                                {rec.dias_cobertura?.toFixed(0) || 0} días
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Demanda diaria</span>
                              <p className="font-semibold text-foreground">{rec.demanda_diaria_promedio?.toFixed(0) || 0}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Días producción</span>
                              <p className="font-semibold text-foreground">{rec.dias_produccion || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-muted-foreground block mb-1">Producir</span>
                          <p className="text-2xl font-bold text-[hsl(217,91%,50%)]">
                            {formatNumber(rec.cantidad_recomendada_producir)}
                          </p>
                          <span className="text-xs text-muted-foreground">unidades</span>
                          {rec.costo_produccion_estimado > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Costo est: {formatCurrency(rec.costo_produccion_estimado)}
                            </p>
                          )}
                        </div>
                      </div>
                      {rec.ventas_perdidas_30d > 0 && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-destructive font-medium">
                            Ventas perdidas (30d): {formatCurrency(rec.valor_ventas_perdidas_30d)}
                          </span>
                        </div>
                      )}
                      {rec.ordenes_produccion_pendientes > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <Factory className="h-3.5 w-3.5 text-primary" />
                          <span className="text-primary">
                            {formatNumber(rec.ordenes_produccion_pendientes)} órdenes de producción pendientes
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab 3: Por Categoría */}
            <TabsContent value="categorias" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <ShadcnCard className="border border-border/40 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Distribución de Valor por Categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={inventoryChartConfig} className="h-[350px] w-full">
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

                {/* Salud por Categoría */}
                <ShadcnCard className="border border-border/40 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Salud por Categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryData?.map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/40"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                            />
                            <p className="text-sm font-semibold text-foreground truncate">
                              {cat.categoria}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-5 text-xs text-muted-foreground">
                            <span>{cat.productos_total} productos</span>
                            <span>•</span>
                            <span>{cat.dias_cobertura_promedio?.toFixed(0)} días cobertura</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(cat.valor_inventario)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cat.porcentaje_valor?.toFixed(1)}% del total
                            </p>
                          </div>
                          <Badge
                            variant={
                              cat.salud_categoria === "buena" ? "default" :
                              cat.salud_categoria === "regular" ? "secondary" :
                              "destructive"
                            }
                            className="text-xs capitalize"
                          >
                            {cat.salud_categoria}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </ShadcnCard>
              </div>

              {/* Tabla detallada por categoría */}
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Detalle por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-medium">Categoría</TableHead>
                          <TableHead className="text-xs font-medium text-right">Productos</TableHead>
                          <TableHead className="text-xs font-medium text-right">Sin Stock</TableHead>
                          <TableHead className="text-xs font-medium text-right">Críticos</TableHead>
                          <TableHead className="text-xs font-medium text-right">Bajos</TableHead>
                          <TableHead className="text-xs font-medium text-right">Óptimos</TableHead>
                          <TableHead className="text-xs font-medium text-right">Exceso</TableHead>
                          <TableHead className="text-xs font-medium text-right">V. Perdidas</TableHead>
                          <TableHead className="text-xs font-medium text-right">Rotación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryData?.map((cat, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium">{cat.categoria}</TableCell>
                            <TableCell className="text-sm text-right">{cat.productos_total}</TableCell>
                            <TableCell className="text-sm text-right">
                              <span className={cat.productos_sin_stock > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                                {cat.productos_sin_stock}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              <span className={cat.productos_criticos > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                                {cat.productos_criticos}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              <span className={cat.productos_bajos > 0 ? "font-semibold text-[hsl(220,9%,46%)]" : "text-muted-foreground"}>
                                {cat.productos_bajos}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              <span className="font-semibold text-[hsl(217,91%,50%)]">{cat.productos_optimos}</span>
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              <span className={cat.productos_exceso > 0 ? "font-semibold text-primary" : "text-muted-foreground"}>
                                {cat.productos_exceso}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-right">
                              <span className={cat.valor_ventas_perdidas_30d > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                                {cat.valor_ventas_perdidas_30d > 0 ? formatCurrency(cat.valor_ventas_perdidas_30d) : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-right font-medium">
                              {cat.rotacion_promedio?.toFixed(1)}x
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab 4: Tendencias */}
            <TabsContent value="tendencias" className="mt-6 space-y-6">
              {/* Evolución del Valor de Inventario */}
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Evolución del Valor de Inventario
                  </CardTitle>
                  <CardDescription>
                    Tendencia de los últimos 30 días
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ChartContainer config={inventoryChartConfig} className="h-[350px] w-full">
                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValorInv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="periodo"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium text-sm text-foreground mb-2">{label}</p>
                                <p className="text-sm text-muted-foreground">
                                  Valor: {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Valor Inventario"
                        stroke="hsl(217, 91%, 50%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValorInv)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </ShadcnCard>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Productos Críticos en el Tiempo */}
                <ShadcnCard className="border border-border/40 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Productos Críticos en el Tiempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={inventoryChartConfig} className="h-[300px] w-full">
                      <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                          dataKey="periodo"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
                                    Críticos: {payload[0].value}
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Productos Críticos"
                          stroke="hsl(220, 9%, 30%)"
                          strokeWidth={2}
                          dot={{ fill: "hsl(220, 9%, 30%)", r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </ShadcnCard>

                {/* Ventas Perdidas Acumuladas */}
                <ShadcnCard className="border border-border/40 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Ventas Perdidas Acumuladas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={inventoryChartConfig} className="h-[300px] w-full">
                      <RechartsBarChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVentasPerdidasInv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(220, 9%, 46%)" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="hsl(220, 9%, 46%)" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                        <XAxis
                          dataKey="periodo"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium text-sm text-foreground">{label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Perdidas: {formatCurrency(payload[0].value as number)}
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="Ventas Perdidas" fill="url(#colorVentasPerdidasInv)" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ChartContainer>
                  </CardContent>
                </ShadcnCard>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
