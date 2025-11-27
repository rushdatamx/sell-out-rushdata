"use client"

import { useState, useMemo } from "react"
import { Card, Title, Text, Metric, Badge, TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react"
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
      return { color: "bg-emerald-100 text-emerald-700", label: "Alta" }
    case "media":
      return { color: "bg-yellow-100 text-yellow-700", label: "Media" }
    case "baja":
      return { color: "bg-gray-100 text-gray-600", label: "Baja" }
    default:
      return { color: "bg-gray-100 text-gray-600", label: nivel }
  }
}

const getEstadoAlertaConfig = (estado: string) => {
  switch (estado) {
    case "atrasado":
      return { color: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Atrasado" }
    case "proximos_7_dias":
      return { color: "bg-orange-100 text-orange-700", icon: Clock, label: "Próximos 7 días" }
    case "proximos_30_dias":
      return { color: "bg-blue-100 text-blue-700", icon: Calendar, label: "Próximos 30 días" }
    default:
      return { color: "bg-gray-100 text-gray-600", icon: Calendar, label: estado }
  }
}

// ============================================================================
// CALENDAR COMPONENT (Notion/Google Calendar Style)
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

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Next month days
    const remainingDays = 42 - days.length // 6 rows * 7 days
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
    if (pedidos <= 3) return "bg-blue-100"
    if (pedidos <= 6) return "bg-blue-200"
    if (pedidos <= 10) return "bg-blue-300"
    return "bg-blue-400"
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          if (!day.date) return <div key={idx} className="h-24 border-b border-r border-gray-100" />

          const dateStr = day.date.toISOString().split("T")[0]
          const dayData = calendarData.get(dateStr)
          const isToday = day.date.getTime() === today.getTime()
          const isSelected = selectedDate === dateStr
          const isPast = day.date < today

          return (
            <div
              key={idx}
              onClick={() => dayData && onSelectDate(dateStr)}
              className={`
                h-28 border-b border-r border-gray-100 p-1.5 transition-all cursor-pointer
                ${!day.isCurrentMonth ? "bg-gray-50/50" : "bg-white"}
                ${dayData ? "hover:bg-blue-50" : ""}
                ${isSelected ? "ring-2 ring-inset ring-blue-500 bg-blue-50" : ""}
              `}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday ? "bg-blue-600 text-white" : ""}
                  ${!day.isCurrentMonth ? "text-gray-400" : "text-gray-700"}
                  ${isPast && day.isCurrentMonth && !isToday ? "text-gray-400" : ""}
                `}>
                  {day.date.getDate()}
                </span>
              </div>

              {/* Day Content */}
              {dayData && dayData.pedidos_esperados > 0 && (
                <div className={`
                  rounded-lg p-1.5 text-xs transition-all
                  ${getIntensityClass(dayData.pedidos_esperados)}
                  ${isPast ? "opacity-60" : ""}
                `}>
                  <div className="font-bold text-gray-800">
                    {dayData.pedidos_esperados} pedidos
                  </div>
                  <div className="text-gray-600 truncate">
                    {formatCurrency(Number(dayData.valor_total_esperado))}
                  </div>
                  <div className="text-gray-500">
                    {dayData.clientes_unicos} clientes
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center gap-4 text-xs text-gray-600">
        <span className="font-medium">Intensidad:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-100" />
          <span>1-3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-200" />
          <span>4-6</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-300" />
          <span>7-10</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-400" />
          <span>10+</span>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900 capitalize">
              {formatDateLong(fecha)}
            </h2>
            <p className="text-sm text-gray-600">
              {details?.length || 0} pedidos esperados
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{details?.length || 0}</p>
            <p className="text-xs text-gray-500">Pedidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValor)}</p>
            <p className="text-xs text-gray-500">Valor Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCantidad)}</p>
            <p className="text-xs text-gray-500">Unidades</p>
          </div>
        </div>

        {/* Detail List */}
        <div className="overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {details?.map((item, idx) => {
                const confianzaConfig = getConfianzaConfig(item.nivel_confianza)
                return (
                  <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{item.cliente_nombre}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {item.tipo_cliente}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-3.5 w-3.5" />
                          <span>{item.producto_nombre}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Frecuencia: cada {Number(item.frecuencia_promedio_dias).toFixed(0)} días</span>
                          <span>•</span>
                          <span>{item.numero_compras_historicas} compras históricas</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(Number(item.valor_estimado))}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(Number(item.cantidad_estimada))} unidades
                        </p>
                        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded ${confianzaConfig.color}`}>
                          {confianzaConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{clienteNombre}</h2>
            <p className="text-sm text-gray-600">
              {products?.length || 0} productos con predicción
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValor)}</p>
            <p className="text-xs text-gray-500">Valor Total Esperado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{products?.length || 0}</p>
            <p className="text-xs text-gray-500">Productos</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${atrasados > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {atrasados}
            </p>
            <p className="text-xs text-gray-500">Atrasados</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Última Compra</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Próxima</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Cantidad Est.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Valor Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products?.map((product, idx) => {
                  const estadoConfig = getEstadoAlertaConfig(product.estado_alerta)
                  const EstadoIcon = estadoConfig.icon
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{product.producto_nombre}</div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${estadoConfig.color}`}>
                          <EstadoIcon className="h-3 w-3" />
                          {product.dias_restantes < 0 ? `${Math.abs(product.dias_restantes)}d atraso` : `${product.dias_restantes}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {formatDate(product.fecha_ultima_compra)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                        {formatDate(product.fecha_proxima_compra)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatNumber(Number(product.cantidad_estimada))}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(Number(product.valor_estimado))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PrediccionesPage() {
  const [selectedTab, setSelectedTab] = useState(0)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<{ id: number; nombre: string } | null>(null)
  const [clientSearch, setClientSearch] = useState("")

  // Fetch all data
  const { data: kpis, isLoading: loadingKPIs } = usePredictionsKPIs(TENANT_ID)
  const { data: alerts } = usePredictionsAlerts(TENANT_ID, 10)
  const { data: clientsList } = usePredictionsByClient(TENANT_ID, { search: clientSearch || undefined })
  const { data: productsList } = usePredictionsByProduct(TENANT_ID)
  const { data: calendarData } = usePredictionsCalendar(TENANT_ID)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Predicciones
              </h1>
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-2 ml-[52px]">
              <Calendar className="h-4 w-4 text-purple-500" />
              Anticipa cuándo tus clientes volverán a <span className="font-semibold text-gray-900">realizar pedidos</span>
            </p>
          </div>
        </div>

        {/* Acciones del Día - Sección Principal */}
        <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
          <DailyActions tenantId={TENANT_ID} />
        </Card>

        {/* Alertas Críticas */}
        {alerts && alerts.length > 0 && (
          <Card className="!bg-gradient-to-r from-red-50 to-orange-50 !border-0 !ring-2 !ring-red-200 !shadow-lg !rounded-2xl !p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <Title className="!text-lg !font-bold !text-red-900">
                Requieren Atención ({alerts.filter(a => a.estado_alerta === "atrasado").length} atrasados)
              </Title>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.slice(0, 6).map((alert, idx) => {
                const estadoConfig = getEstadoAlertaConfig(alert.estado_alerta)
                const EstadoIcon = estadoConfig.icon
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedClient({ id: alert.id_cliente, nombre: alert.cliente_nombre })}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-900 truncate flex-1">
                        {alert.cliente_nombre}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${estadoConfig.color}`}>
                        <EstadoIcon className="h-3 w-3" />
                        {alert.dias_atraso > 0 ? `${alert.dias_atraso}d atraso` : `${alert.dias_restantes}d`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 truncate">{alert.producto_nombre}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Esperado: <span className="font-semibold text-gray-900">{formatNumber(Number(alert.cantidad_estimada))}</span>
                      </span>
                      <span className="font-bold text-purple-600">
                        {formatCurrency(Number(alert.valor_estimado))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Próximos 7 días */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Próximos 7 días
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.valor_proximos_7d || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Text className="!text-xs !text-gray-500 truncate">
                  {kpis?.pedidos_proximos_7d || 0} pedidos esperados
                </Text>
              </div>
            </div>
          </Card>

          {/* Próximos 30 días */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Próximos 30 días
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.valor_proximos_30d || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Text className="!text-xs !text-gray-500 truncate">
                  {kpis?.pedidos_proximos_30d || 0} pedidos esperados
                </Text>
              </div>
            </div>
          </Card>

          {/* Clientes Atrasados */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Clientes Atrasados
                  </Text>
                  <Metric className="!text-lg !font-bold !text-red-600 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      kpis?.clientes_atrasados || 0
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Text className="!text-xs !text-red-600 font-semibold truncate">
                  {formatCurrency(kpis?.valor_atrasados || 0)} en riesgo
                </Text>
              </div>
            </div>
          </Card>

          {/* Confianza Promedio */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Confianza Promedio
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      `${(kpis?.confianza_promedio || 0).toFixed(0)}%`
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Text className="!text-xs !text-gray-500 truncate">
                  {formatNumber(kpis?.total_predicciones || 0)} predicciones activas
                </Text>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
          <TabList className="!bg-white !rounded-xl !p-1.5 !shadow-sm !border !border-gray-200">
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Por Cliente
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Por Producto
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Calendario
            </Tab>
          </TabList>

          <TabPanels className="mt-6">
            {/* Tab 1: Por Cliente */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <div className="flex items-center justify-between mb-6">
                  <Title className="!text-lg !font-bold !text-gray-900">
                    Predicciones por Cliente
                  </Title>
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Próxima Compra</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Productos</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Atrasados</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor Esperado</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Confianza</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {clientsList?.map((client, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedClient({ id: client.id_cliente, nombre: client.cliente_nombre })}
                        >
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900">{client.cliente_nombre}</span>
                              <span className="text-xs text-gray-500">{client.tipo_cliente} • {client.segmento_abc}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {client.dias_hasta_proxima < 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  {Math.abs(client.dias_hasta_proxima)}d atraso
                                </span>
                              ) : (
                                <span className="text-sm text-gray-900">
                                  {formatDate(client.proxima_compra_mas_cercana)}
                                  <span className="text-gray-500 ml-1">({client.dias_hasta_proxima}d)</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-medium text-gray-900">{client.productos_esperados}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {client.productos_atrasados > 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                {client.productos_atrasados}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold text-purple-600">
                              {formatCurrency(Number(client.valor_total_estimado))}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm text-gray-600">{Number(client.confianza_promedio).toFixed(0)}%</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabPanel>

            {/* Tab 2: Por Producto */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Title className="!text-lg !font-bold !text-gray-900 !mb-0">
                      Demanda Esperada por Producto
                    </Title>
                    <Text className="!text-sm !text-gray-500">
                      Conexión con inventario: verifica si tienes stock suficiente
                    </Text>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Clientes 7d</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Demanda 7d</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Clientes 30d</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Demanda 30d</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Stock Actual</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {productsList?.map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900">{product.producto_nombre}</span>
                              <span className="text-xs text-gray-500">{product.sku} • {product.categoria}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-medium text-gray-900">{product.clientes_esperados_7d}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-gray-900">{formatNumber(Number(product.cantidad_esperada_7d))}</span>
                              <span className="text-xs text-gray-500">{formatCurrency(Number(product.valor_esperado_7d))}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-medium text-gray-900">{product.clientes_esperados_30d}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-gray-900">{formatNumber(Number(product.cantidad_esperada_30d))}</span>
                              <span className="text-xs text-gray-500">{formatCurrency(Number(product.valor_esperado_30d))}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-medium text-gray-900">{formatNumber(Number(product.stock_disponible))}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {!product.stock_suficiente_7d ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  Déficit 7d
                                </span>
                                <span className="text-xs text-red-600">-{formatNumber(Number(product.deficit_7d))}</span>
                              </div>
                            ) : !product.stock_suficiente_30d ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
                                  <AlertCircle className="h-3 w-3" />
                                  Déficit 30d
                                </span>
                                <span className="text-xs text-orange-600">-{formatNumber(Number(product.deficit_30d))}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabPanel>

            {/* Tab 3: Calendario */}
            <TabPanel>
              <div className="grid grid-cols-1 gap-6">
                <PredictionsCalendar
                  data={calendarData || []}
                  onSelectDate={setSelectedCalendarDate}
                  selectedDate={selectedCalendarDate}
                />
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
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
