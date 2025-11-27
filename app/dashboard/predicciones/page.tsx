"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Search,
  RefreshCw,
} from "lucide-react"
import {
  usePredictionsKPIs,
  usePredictionsAlerts,
  usePredictionsByClient,
  usePredictionsClientDetail,
  usePredictionsByProduct,
  usePredictionsCalendar,
  usePredictionsCalendarDayDetail,
} from "@/hooks/use-predictions-data"

const TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

// Colores RushData
const COLORS = {
  primary: "hsl(217, 91%, 50%)",
  primaryLight: "hsl(217, 91%, 70%)",
  primaryMuted: "hsl(217, 91%, 60%)",
  grayDark: "hsl(220, 9%, 30%)",
  grayMedium: "hsl(220, 9%, 46%)",
  grayLight: "hsl(220, 9%, 60%)",
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Colores RushData para estados
const getConfianzaConfig = (nivel: string) => {
  switch (nivel) {
    case "alta":
      return { color: "bg-[hsl(217,91%,95%)] text-[hsl(217,91%,50%)]", label: "Alta" }
    case "media":
      return { color: "bg-[hsl(220,9%,92%)] text-[hsl(220,9%,46%)]", label: "Media" }
    case "baja":
      return { color: "bg-muted text-muted-foreground", label: "Baja" }
    default:
      return { color: "bg-muted text-muted-foreground", label: nivel }
  }
}

const getEstadoAlertaConfig = (estado: string) => {
  switch (estado) {
    case "atrasado":
      return { color: "bg-[hsl(220,9%,90%)] text-[hsl(220,9%,30%)]", icon: AlertTriangle, label: "Atrasado" }
    case "proximos_7_dias":
      return { color: "bg-[hsl(220,9%,92%)] text-[hsl(220,9%,46%)]", icon: Clock, label: "Próximos 7 días" }
    case "proximos_30_dias":
      return { color: "bg-[hsl(217,91%,95%)] text-[hsl(217,91%,50%)]", icon: Calendar, label: "Próximos 30 días" }
    default:
      return { color: "bg-muted text-muted-foreground", icon: Calendar, label: estado }
  }
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
  loading?: boolean
  delay?: number
  accentColor?: string
  badge?: { label: string; variant?: "default" | "secondary" | "outline" }
}

function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  loading,
  delay = 0,
  accentColor = "bg-[hsl(217,91%,50%)]",
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

// ============================================================================
// CALENDAR COMPONENT
// ============================================================================

interface CalendarProps {
  data: Array<{
    fecha: string
    pedidos_esperados: number
    valor_total_esperado: number
    clientes_unicos: number
  }>
  onSelectDate: (date: string) => void
  selectedDate: string | null
}

function PredictionsCalendar({ data, onSelectDate, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const calendarData = useMemo(() => {
    const dataMap = new Map(data.map(d => [d.fecha, d]))
    return dataMap
  }, [data])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = []

    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1))
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  // Colores RushData para intensidad
  const getIntensityClass = (pedidos: number) => {
    if (pedidos === 0) return ""
    if (pedidos <= 3) return "bg-[hsl(217,91%,95%)]"
    if (pedidos <= 6) return "bg-[hsl(217,91%,90%)]"
    if (pedidos <= 10) return "bg-[hsl(217,91%,85%)]"
    return "bg-[hsl(217,91%,80%)]"
  }

  return (
    <ShadcnCard className="border border-border/40 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {dayNames.map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          if (!day.date) return <div key={idx} className="h-24 border-b border-r border-border" />

          const dateStr = day.date.toISOString().split("T")[0]
          const dayData = calendarData.get(dateStr)
          const isToday = day.date.getTime() === today.getTime()
          const isSelected = selectedDate === dateStr
          const isPast = day.date < today

          return (
            <div
              key={idx}
              onClick={() => dayData && onSelectDate(dateStr)}
              className={cn(
                "h-28 border-b border-r border-border p-1.5 transition-all cursor-pointer",
                !day.isCurrentMonth ? "bg-muted/30" : "bg-card",
                dayData && "hover:bg-[hsl(217,91%,97%)]",
                isSelected && "ring-2 ring-inset ring-[hsl(217,91%,50%)] bg-[hsl(217,91%,97%)]"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday && "bg-[hsl(217,91%,50%)] text-white",
                  !day.isCurrentMonth && "text-muted-foreground",
                  isPast && day.isCurrentMonth && !isToday && "text-muted-foreground"
                )}>
                  {day.date.getDate()}
                </span>
              </div>

              {dayData && dayData.pedidos_esperados > 0 && (
                <div className={cn(
                  "rounded-lg p-1.5 text-xs transition-all",
                  getIntensityClass(dayData.pedidos_esperados),
                  isPast && "opacity-60"
                )}>
                  <div className="font-bold text-foreground">
                    {dayData.pedidos_esperados} pedidos
                  </div>
                  <div className="text-muted-foreground truncate">
                    {formatCurrency(Number(dayData.valor_total_esperado))}
                  </div>
                  <div className="text-muted-foreground">
                    {dayData.clientes_unicos} clientes
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Intensidad:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[hsl(217,91%,95%)]" />
          <span>1-3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[hsl(217,91%,90%)]" />
          <span>4-6</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[hsl(217,91%,85%)]" />
          <span>7-10</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[hsl(217,91%,80%)]" />
          <span>10+</span>
        </div>
      </div>
    </ShadcnCard>
  )
}

// ============================================================================
// DAY DETAIL MODAL
// ============================================================================

interface DayDetailModalProps {
  fecha: string
  onClose: () => void
}

function DayDetailModal({ fecha, onClose }: DayDetailModalProps) {
  const { data: details, isLoading } = usePredictionsCalendarDayDetail(TENANT_ID, fecha)

  const totalValor = details?.reduce((sum, d) => sum + Number(d.valor_estimado), 0) || 0
  const totalCantidad = details?.reduce((sum, d) => sum + Number(d.cantidad_estimada), 0) || 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-border"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-lg font-semibold text-foreground capitalize">
                {formatDateLong(fecha)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {details?.length || 0} pedidos esperados
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/30 border-b border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{details?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pedidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[hsl(217,91%,50%)]">{formatCurrency(totalValor)}</p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{formatNumber(totalCantidad)}</p>
              <p className="text-xs text-muted-foreground">Unidades</p>
            </div>
          </div>

          {/* Detail List */}
          <div className="overflow-y-auto max-h-[50vh]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : (
              <div className="divide-y divide-border">
                {details?.map((item, idx) => {
                  const confianzaConfig = getConfianzaConfig(item.nivel_confianza)
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{item.cliente_nombre}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.tipo_cliente}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-3.5 w-3.5" />
                            <span>{item.producto_nombre}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{item.sku}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Frecuencia: cada {Number(item.frecuencia_promedio_dias).toFixed(0)} días</span>
                            <span>•</span>
                            <span>{item.numero_compras_historicas} compras históricas</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-foreground">
                            {formatCurrency(Number(item.valor_estimado))}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(Number(item.cantidad_estimada))} unidades
                          </p>
                          <Badge variant="outline" className={cn("mt-1 text-xs", confianzaConfig.color)}>
                            {confianzaConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// CLIENT DETAIL MODAL
// ============================================================================

interface ClientDetailModalProps {
  clienteId: number
  clienteNombre: string
  onClose: () => void
}

function ClientDetailModal({ clienteId, clienteNombre, onClose }: ClientDetailModalProps) {
  const { data: products, isLoading } = usePredictionsClientDetail(TENANT_ID, clienteId)

  const totalValor = products?.reduce((sum, p) => sum + Number(p.valor_estimado), 0) || 0
  const atrasados = products?.filter(p => p.estado_alerta === "atrasado").length || 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-border"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{clienteNombre}</h2>
              <p className="text-sm text-muted-foreground">
                {products?.length || 0} productos con predicción
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/30 border-b border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-[hsl(217,91%,50%)]">{formatCurrency(totalValor)}</p>
              <p className="text-xs text-muted-foreground">Valor Total Esperado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{products?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Productos</p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-bold", atrasados > 0 ? "text-[hsl(220,9%,30%)]" : "text-[hsl(217,91%,50%)]")}>
                {atrasados}
              </p>
              <p className="text-xs text-muted-foreground">Atrasados</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-y-auto max-h-[50vh]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : (
              <div className="rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/50">
                      <TableHead className="text-xs font-medium">Producto</TableHead>
                      <TableHead className="text-xs font-medium">Estado</TableHead>
                      <TableHead className="text-xs font-medium text-right">Última Compra</TableHead>
                      <TableHead className="text-xs font-medium text-right">Próxima</TableHead>
                      <TableHead className="text-xs font-medium text-right">Cantidad Est.</TableHead>
                      <TableHead className="text-xs font-medium text-right">Valor Est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product, idx) => {
                      const estadoConfig = getEstadoAlertaConfig(product.estado_alerta)
                      const EstadoIcon = estadoConfig.icon
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="font-medium text-foreground">{product.producto_nombre}</div>
                            <div className="text-xs text-muted-foreground">{product.sku}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs gap-1", estadoConfig.color)}>
                              <EstadoIcon className="h-3 w-3" />
                              {product.dias_restantes < 0 ? `${Math.abs(product.dias_restantes)}d atraso` : `${product.dias_restantes}d`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground text-right">
                            {formatDate(product.fecha_ultima_compra)}
                          </TableCell>
                          <TableCell className="text-sm text-foreground font-medium text-right">
                            {formatDate(product.fecha_proxima_compra)}
                          </TableCell>
                          <TableCell className="text-sm text-foreground text-right">
                            {formatNumber(Number(product.cantidad_estimada))}
                          </TableCell>
                          <TableCell className="text-sm font-bold text-foreground text-right">
                            {formatCurrency(Number(product.valor_estimado))}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PrediccionesPage() {
  const [selectedTab, setSelectedTab] = useState("clientes")
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<{ id: number; nombre: string } | null>(null)
  const [clientSearch, setClientSearch] = useState("")

  const { data: kpis, isLoading: loadingKPIs } = usePredictionsKPIs(TENANT_ID)
  const { data: alerts } = usePredictionsAlerts(TENANT_ID, 10)
  const { data: clientsList } = usePredictionsByClient(TENANT_ID, { search: clientSearch || undefined })
  const { data: productsList } = usePredictionsByProduct(TENANT_ID)
  const { data: calendarData } = usePredictionsCalendar(TENANT_ID)

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
              Predicciones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Anticipa cuándo tus clientes volverán a realizar pedidos
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Actualizado en tiempo real</span>
          </div>
        </motion.div>

        {/* Alertas Críticas */}
        {alerts && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <ShadcnCard className="border-[hsl(220,9%,70%)] bg-[hsl(220,9%,97%)]">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[hsl(220,9%,30%)] flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Requieren Atención ({alerts.filter(a => a.estado_alerta === "atrasado").length} atrasados)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alerts.slice(0, 6).map((alert, idx) => {
                    const estadoConfig = getEstadoAlertaConfig(alert.estado_alerta)
                    const EstadoIcon = estadoConfig.icon
                    return (
                      <div
                        key={idx}
                        className="bg-background rounded-lg p-4 border border-border hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => setSelectedClient({ id: alert.id_cliente, nombre: alert.cliente_nombre })}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-foreground truncate flex-1">
                            {alert.cliente_nombre}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] flex-shrink-0 gap-1", estadoConfig.color)}>
                            <EstadoIcon className="h-3 w-3" />
                            {alert.dias_atraso > 0 ? `${alert.dias_atraso}d atraso` : `${alert.dias_restantes}d`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 truncate">{alert.producto_nombre}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Esperado: <span className="font-semibold text-foreground">{formatNumber(Number(alert.cantidad_estimada))}</span>
                          </span>
                          <span className="font-bold text-[hsl(217,91%,50%)]">
                            {formatCurrency(Number(alert.valor_estimado))}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </ShadcnCard>
          </motion.div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Próximos 7 días"
            value={formatCurrency(kpis?.valor_proximos_7d || 0)}
            icon={Clock}
            subtitle={`${kpis?.pedidos_proximos_7d || 0} pedidos esperados`}
            loading={loadingKPIs}
            delay={0.2}
            accentColor="bg-[hsl(217,91%,50%)]"
          />
          <KPICard
            title="Próximos 30 días"
            value={formatCurrency(kpis?.valor_proximos_30d || 0)}
            icon={Calendar}
            subtitle={`${kpis?.pedidos_proximos_30d || 0} pedidos esperados`}
            loading={loadingKPIs}
            delay={0.25}
            accentColor="bg-[hsl(217,91%,60%)]"
          />
          <KPICard
            title="Clientes Atrasados"
            value={kpis?.clientes_atrasados || 0}
            icon={AlertTriangle}
            subtitle={`${formatCurrency(kpis?.valor_atrasados || 0)} en riesgo`}
            loading={loadingKPIs}
            delay={0.3}
            accentColor="bg-[hsl(220,9%,30%)]"
          />
          <KPICard
            title="Confianza Promedio"
            value={`${(kpis?.confianza_promedio || 0).toFixed(0)}%`}
            icon={CheckCircle2}
            subtitle={`${formatNumber(kpis?.total_predicciones || 0)} predicciones activas`}
            loading={loadingKPIs}
            delay={0.35}
            accentColor="bg-[hsl(217,91%,70%)]"
          />
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger
                value="clientes"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Por Cliente
              </TabsTrigger>
              <TabsTrigger
                value="productos"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Por Producto
              </TabsTrigger>
              <TabsTrigger
                value="calendario"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm"
              >
                Calendario
              </TabsTrigger>
            </TabsList>

            {/* Tab: Por Cliente */}
            <TabsContent value="clientes" className="mt-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Predicciones por Cliente
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="pl-9 w-[250px]"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-medium">Cliente</TableHead>
                          <TableHead className="text-xs font-medium">Próxima Compra</TableHead>
                          <TableHead className="text-xs font-medium text-center">Productos</TableHead>
                          <TableHead className="text-xs font-medium text-center">Atrasados</TableHead>
                          <TableHead className="text-xs font-medium text-right">Valor Esperado</TableHead>
                          <TableHead className="text-xs font-medium text-right">Confianza</TableHead>
                          <TableHead className="text-xs font-medium text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientsList?.map((client, idx) => (
                          <TableRow
                            key={idx}
                            className="cursor-pointer"
                            onClick={() => setSelectedClient({ id: client.id_cliente, nombre: client.cliente_nombre })}
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">{client.cliente_nombre}</span>
                                <span className="text-xs text-muted-foreground">{client.tipo_cliente} • {client.segmento_abc}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {client.dias_hasta_proxima < 0 ? (
                                <Badge variant="outline" className="bg-[hsl(220,9%,90%)] text-[hsl(220,9%,30%)] gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {Math.abs(client.dias_hasta_proxima)}d atraso
                                </Badge>
                              ) : (
                                <span className="text-sm text-foreground">
                                  {formatDate(client.proxima_compra_mas_cercana)}
                                  <span className="text-muted-foreground ml-1">({client.dias_hasta_proxima}d)</span>
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-medium text-foreground">{client.productos_esperados}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {client.productos_atrasados > 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(220,9%,90%)] text-[hsl(220,9%,30%)] text-xs font-bold">
                                  {client.productos_atrasados}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-bold text-[hsl(217,91%,50%)]">
                                {formatCurrency(Number(client.valor_total_estimado))}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm text-muted-foreground">{Number(client.confianza_promedio).toFixed(0)}%</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab: Por Producto */}
            <TabsContent value="productos" className="mt-6">
              <ShadcnCard className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[hsl(217,91%,50%)] flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        Demanda Esperada por Producto
                      </CardTitle>
                      <CardDescription>
                        Conexión con inventario: verifica si tienes stock suficiente
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-medium">Producto</TableHead>
                          <TableHead className="text-xs font-medium text-center">Clientes 7d</TableHead>
                          <TableHead className="text-xs font-medium text-right">Demanda 7d</TableHead>
                          <TableHead className="text-xs font-medium text-center">Clientes 30d</TableHead>
                          <TableHead className="text-xs font-medium text-right">Demanda 30d</TableHead>
                          <TableHead className="text-xs font-medium text-right">Stock Actual</TableHead>
                          <TableHead className="text-xs font-medium text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsList?.map((product, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">{product.producto_nombre}</span>
                                <span className="text-xs text-muted-foreground">{product.sku} • {product.categoria}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-medium text-foreground">{product.clientes_esperados_7d}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-foreground">{formatNumber(Number(product.cantidad_esperada_7d))}</span>
                                <span className="text-xs text-muted-foreground">{formatCurrency(Number(product.valor_esperado_7d))}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-medium text-foreground">{product.clientes_esperados_30d}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-foreground">{formatNumber(Number(product.cantidad_esperada_30d))}</span>
                                <span className="text-xs text-muted-foreground">{formatCurrency(Number(product.valor_esperado_30d))}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-medium text-foreground">{formatNumber(Number(product.stock_disponible))}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {!product.stock_suficiente_7d ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="outline" className="bg-[hsl(220,9%,90%)] text-[hsl(220,9%,30%)] gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Déficit 7d
                                  </Badge>
                                  <span className="text-xs text-[hsl(220,9%,30%)]">-{formatNumber(Number(product.deficit_7d))}</span>
                                </div>
                              ) : !product.stock_suficiente_30d ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="outline" className="bg-[hsl(220,9%,92%)] text-[hsl(220,9%,46%)] gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Déficit 30d
                                  </Badge>
                                  <span className="text-xs text-[hsl(220,9%,46%)]">-{formatNumber(Number(product.deficit_30d))}</span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-[hsl(217,91%,95%)] text-[hsl(217,91%,50%)] gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </ShadcnCard>
            </TabsContent>

            {/* Tab: Calendario */}
            <TabsContent value="calendario" className="mt-6">
              <PredictionsCalendar
                data={calendarData || []}
                onSelectDate={setSelectedCalendarDate}
                selectedDate={selectedCalendarDate}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Modals */}
      {selectedCalendarDate && (
        <DayDetailModal
          fecha={selectedCalendarDate}
          onClose={() => setSelectedCalendarDate(null)}
        />
      )}

      {selectedClient && (
        <ClientDetailModal
          clienteId={selectedClient.id}
          clienteNombre={selectedClient.nombre}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  )
}
