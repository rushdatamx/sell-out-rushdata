"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Sparkles,
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
import { DailyActions } from "@/components/predicciones/daily-actions"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "@/components/ui/animated-card"
import { GradientText } from "@/components/ui/gradient-text"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

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

const getConfianzaConfig = (nivel: string) => {
  switch (nivel) {
    case "alta":
      return { color: "bg-success/10 text-success", label: "Alta" }
    case "media":
      return { color: "bg-warning/10 text-warning", label: "Media" }
    case "baja":
      return { color: "bg-muted text-muted-foreground", label: "Baja" }
    default:
      return { color: "bg-muted text-muted-foreground", label: nivel }
  }
}

const getEstadoAlertaConfig = (estado: string) => {
  switch (estado) {
    case "atrasado":
      return { color: "bg-destructive/10 text-destructive", icon: AlertTriangle, label: "Atrasado" }
    case "proximos_7_dias":
      return { color: "bg-warning/10 text-warning", icon: Clock, label: "Próximos 7 días" }
    case "proximos_30_dias":
      return { color: "bg-primary/10 text-primary", icon: Calendar, label: "Próximos 30 días" }
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
  icon: React.ReactNode
  subtitle?: string
  loading?: boolean
  delay?: number
  iconBg: string
  valueColor?: string
}

function KPICard({ title, value, icon, subtitle, loading, delay = 0, iconBg, valueColor = "text-foreground" }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {title}
              </p>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.2, duration: 0.3 }}
                  className={cn("text-2xl font-bold truncate", valueColor)}
                >
                  {value}
                </motion.p>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, rotate: -20 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: delay + 0.1, duration: 0.4 }}
              className={cn("h-11 w-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0", iconBg)}
            >
              {icon}
            </motion.div>
          </div>
          {subtitle && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
          )}
        </CardContent>
      </Card>
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

  const getIntensityClass = (pedidos: number) => {
    if (pedidos === 0) return ""
    if (pedidos <= 3) return "bg-primary/10"
    if (pedidos <= 6) return "bg-primary/20"
    if (pedidos <= 10) return "bg-primary/30"
    return "bg-primary/40"
  }

  return (
    <AnimatedCard delay={0.3} hover={false} className="overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
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
                dayData && "hover:bg-primary/5",
                isSelected && "ring-2 ring-inset ring-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground",
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
      <div className="px-6 py-3 border-t border-border bg-secondary/30 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Intensidad:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-primary/10" />
          <span>1-3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-primary/20" />
          <span>4-6</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-primary/30" />
          <span>7-10</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-primary/40" />
          <span>10+</span>
        </div>
      </div>
    </AnimatedCard>
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
          className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-border"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
            <div>
              <h2 className="text-lg font-bold text-foreground capitalize">
                {formatDateLong(fecha)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {details?.length || 0} pedidos esperados
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/30 border-b border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{details?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pedidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalValor)}</p>
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
                            <span className="font-bold text-foreground">{item.cliente_nombre}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {item.tipo_cliente}
                            </span>
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
                          <span className={cn("inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded", confianzaConfig.color)}>
                            {confianzaConfig.label}
                          </span>
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
          className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-border"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
            <div>
              <h2 className="text-lg font-bold text-foreground">{clienteNombre}</h2>
              <p className="text-sm text-muted-foreground">
                {products?.length || 0} productos con predicción
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/30 border-b border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalValor)}</p>
              <p className="text-xs text-muted-foreground">Valor Total Esperado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{products?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Productos</p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-bold", atrasados > 0 ? "text-destructive" : "text-success")}>
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
              <table className="min-w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Última Compra</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Próxima</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Cantidad Est.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Valor Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products?.map((product, idx) => {
                    const estadoConfig = getEstadoAlertaConfig(product.estado_alerta)
                    const EstadoIcon = estadoConfig.icon
                    return (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{product.producto_nombre}</div>
                          <div className="text-xs text-muted-foreground">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium", estadoConfig.color)}>
                            <EstadoIcon className="h-3 w-3" />
                            {product.dias_restantes < 0 ? `${Math.abs(product.dias_restantes)}d atraso` : `${product.dias_restantes}d`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                          {formatDate(product.fecha_ultima_compra)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium text-right">
                          {formatDate(product.fecha_proxima_compra)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {formatNumber(Number(product.cantidad_estimada))}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-foreground text-right">
                          {formatCurrency(Number(product.valor_estimado))}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <GradientText as="h1" className="text-3xl lg:text-4xl">
                  Predicciones
                </GradientText>
              </div>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 ml-[60px]">
              <Calendar className="h-4 w-4 text-purple-500" />
              Anticipa cuándo tus clientes volverán a{" "}
              <span className="font-semibold text-foreground">realizar pedidos</span>
            </p>
          </div>
        </motion.div>

        {/* Acciones del Día */}
        <AnimatedCard delay={0.1} className="p-6">
          <DailyActions tenantId={TENANT_ID} />
        </AnimatedCard>

        {/* Alertas Críticas */}
        {alerts && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="bg-gradient-to-r from-destructive/5 to-warning/5 border-destructive/20 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-md">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Requieren Atención ({alerts.filter(a => a.estado_alerta === "atrasado").length} atrasados)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alerts.slice(0, 6).map((alert, idx) => {
                    const estadoConfig = getEstadoAlertaConfig(alert.estado_alerta)
                    const EstadoIcon = estadoConfig.icon
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + idx * 0.05 }}
                        className="bg-card rounded-xl p-4 border border-destructive/10 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedClient({ id: alert.id_cliente, nombre: alert.cliente_nombre })}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-foreground truncate flex-1">
                            {alert.cliente_nombre}
                          </span>
                          <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", estadoConfig.color)}>
                            <EstadoIcon className="h-3 w-3" />
                            {alert.dias_atraso > 0 ? `${alert.dias_atraso}d atraso` : `${alert.dias_restantes}d`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 truncate">{alert.producto_nombre}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Esperado: <span className="font-semibold text-foreground">{formatNumber(Number(alert.cantidad_estimada))}</span>
                          </span>
                          <span className="font-bold text-purple-600">
                            {formatCurrency(Number(alert.valor_estimado))}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Próximos 7 días"
            value={formatCurrency(kpis?.valor_proximos_7d || 0)}
            icon={<Clock className="h-5 w-5 text-white" />}
            subtitle={`${kpis?.pedidos_proximos_7d || 0} pedidos esperados`}
            loading={loadingKPIs}
            delay={0.2}
            iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <KPICard
            title="Próximos 30 días"
            value={formatCurrency(kpis?.valor_proximos_30d || 0)}
            icon={<Calendar className="h-5 w-5 text-white" />}
            subtitle={`${kpis?.pedidos_proximos_30d || 0} pedidos esperados`}
            loading={loadingKPIs}
            delay={0.25}
            iconBg="bg-gradient-to-br from-primary to-primary/80"
          />
          <KPICard
            title="Clientes Atrasados"
            value={kpis?.clientes_atrasados || 0}
            icon={<AlertTriangle className="h-5 w-5 text-white" />}
            subtitle={`${formatCurrency(kpis?.valor_atrasados || 0)} en riesgo`}
            loading={loadingKPIs}
            delay={0.3}
            iconBg="bg-gradient-to-br from-destructive to-destructive/80"
            valueColor="text-destructive"
          />
          <KPICard
            title="Confianza Promedio"
            value={`${(kpis?.confianza_promedio || 0).toFixed(0)}%`}
            icon={<CheckCircle2 className="h-5 w-5 text-white" />}
            subtitle={`${formatNumber(kpis?.total_predicciones || 0)} predicciones activas`}
            loading={loadingKPIs}
            delay={0.35}
            iconBg="bg-gradient-to-br from-success to-success/80"
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="bg-card border border-border shadow-sm p-1.5 h-auto">
            <TabsTrigger
              value="clientes"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md px-6 py-2.5 text-sm font-semibold"
            >
              Por Cliente
            </TabsTrigger>
            <TabsTrigger
              value="productos"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md px-6 py-2.5 text-sm font-semibold"
            >
              Por Producto
            </TabsTrigger>
            <TabsTrigger
              value="calendario"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md px-6 py-2.5 text-sm font-semibold"
            >
              Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clientes" className="mt-6">
            <AnimatedCard delay={0.4} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">
                  Predicciones por Cliente
                </h3>
                <Input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="w-64"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Próxima Compra</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Productos</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Atrasados</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Valor Esperado</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Confianza</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {clientsList?.map((client, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 + idx * 0.02 }}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedClient({ id: client.id_cliente, nombre: client.cliente_nombre })}
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{client.cliente_nombre}</span>
                            <span className="text-xs text-muted-foreground">{client.tipo_cliente} • {client.segmento_abc}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {client.dias_hasta_proxima < 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-destructive/10 text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                {Math.abs(client.dias_hasta_proxima)}d atraso
                              </span>
                            ) : (
                              <span className="text-sm text-foreground">
                                {formatDate(client.proxima_compra_mas_cercana)}
                                <span className="text-muted-foreground ml-1">({client.dias_hasta_proxima}d)</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium text-foreground">{client.productos_esperados}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {client.productos_atrasados > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10 text-destructive text-xs font-bold">
                              {client.productos_atrasados}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-purple-600">
                            {formatCurrency(Number(client.valor_total_estimado))}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm text-muted-foreground">{Number(client.confianza_promedio).toFixed(0)}%</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="productos" className="mt-6">
            <AnimatedCard delay={0.4} className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Demanda Esperada por Producto
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Conexión con inventario: verifica si tienes stock suficiente
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Clientes 7d</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Demanda 7d</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Clientes 30d</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Demanda 30d</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Stock Actual</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {productsList?.map((product, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 + idx * 0.02 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{product.producto_nombre}</span>
                            <span className="text-xs text-muted-foreground">{product.sku} • {product.categoria}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium text-foreground">{product.clientes_esperados_7d}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-foreground">{formatNumber(Number(product.cantidad_esperada_7d))}</span>
                            <span className="text-xs text-muted-foreground">{formatCurrency(Number(product.valor_esperado_7d))}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium text-foreground">{product.clientes_esperados_30d}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-foreground">{formatNumber(Number(product.cantidad_esperada_30d))}</span>
                            <span className="text-xs text-muted-foreground">{formatCurrency(Number(product.valor_esperado_30d))}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-medium text-foreground">{formatNumber(Number(product.stock_disponible))}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {!product.stock_suficiente_7d ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-destructive/10 text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                Déficit 7d
                              </span>
                              <span className="text-xs text-destructive">-{formatNumber(Number(product.deficit_7d))}</span>
                            </div>
                          ) : !product.stock_suficiente_30d ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-warning/10 text-warning">
                                <AlertCircle className="h-3 w-3" />
                                Déficit 30d
                              </span>
                              <span className="text-xs text-warning">-{formatNumber(Number(product.deficit_30d))}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-success/10 text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              OK
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="calendario" className="mt-6">
            <PredictionsCalendar
              data={calendarData || []}
              onSelectDate={setSelectedCalendarDate}
              selectedDate={selectedCalendarDate}
            />
          </TabsContent>
        </Tabs>
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
