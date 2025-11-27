"use client"

import { useState } from "react"
import { Card, Title, Text, Metric, Badge, TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react"
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
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Factory,
  Calendar,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
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

const COLORS = {
  critico: "#ef4444",
  bajo: "#f97316",
  optimo: "#10b981",
  exceso: "#3b82f6",
  sinStock: "#6b7280",
}

const PIE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]

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

const getEstadoStockConfig = (estado: string) => {
  switch (estado) {
    case "sin_stock":
      return { color: "bg-gray-100 text-gray-700", icon: XCircle, label: "Sin Stock" }
    case "critico":
      return { color: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Crítico" }
    case "bajo":
      return { color: "bg-orange-100 text-orange-700", icon: AlertCircle, label: "Bajo" }
    case "optimo":
      return { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Óptimo" }
    case "exceso":
      return { color: "bg-blue-100 text-blue-700", icon: Package, label: "Exceso" }
    default:
      return { color: "bg-gray-100 text-gray-700", icon: Package, label: estado }
  }
}

const getPrioridadConfig = (prioridad: string) => {
  switch (prioridad) {
    case "urgente":
      return { color: "bg-red-600 text-white", label: "URGENTE" }
    case "alta":
      return { color: "bg-orange-500 text-white", label: "Alta" }
    case "media":
      return { color: "bg-yellow-500 text-white", label: "Media" }
    case "baja":
      return { color: "bg-blue-500 text-white", label: "Baja" }
    default:
      return { color: "bg-gray-500 text-white", label: prioridad }
  }
}

export default function InventarioPage() {
  const [selectedTab, setSelectedTab] = useState(0)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Inventario
              </h1>
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-2 ml-[52px]">
              <Calendar className="h-4 w-4 text-blue-500" />
              Control y análisis de <span className="font-semibold text-gray-900">niveles de stock</span>
            </p>
          </div>
          {kpis?.fecha_ultimo_calculo && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Última actualización: {new Date(kpis.fecha_ultimo_calculo).toLocaleString("es-MX")}</span>
            </div>
          )}
        </div>

        {/* Alertas Críticas */}
        {alerts && alerts.length > 0 && (
          <Card className="!bg-gradient-to-r from-red-50 to-orange-50 !border-0 !ring-2 !ring-red-200 !shadow-lg !rounded-2xl !p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <Title className="!text-lg !font-bold !text-red-900">
                Alertas Críticas ({alerts.length})
              </Title>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.slice(0, 6).map((alert, idx) => {
                const prioridadConfig = getPrioridadConfig(alert.prioridad)
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-900 truncate flex-1">
                        {alert.nombre}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prioridadConfig.color}`}>
                        {prioridadConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{alert.mensaje}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        Stock: <span className="font-semibold text-gray-900">{formatNumber(Number(alert.stock_disponible) || 0)}</span>
                      </span>
                      <span className="text-gray-500">
                        Cobertura: <span className="font-semibold text-gray-900">{Number(alert.dias_cobertura)?.toFixed(0) || 0} días</span>
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
          {/* Valor Inventario */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Valor Inventario
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.valor_inventario_total || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Text className="!text-xs !text-gray-500 truncate">
                  {kpis?.productos_total || 0} productos en stock
                </Text>
              </div>
            </div>
          </Card>

          {/* Productos Críticos */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Productos Críticos
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      (kpis?.productos_criticos || 0) + (kpis?.productos_sin_stock || 0)
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 flex-shrink-0">
                  {kpis?.productos_sin_stock || 0} sin stock
                </div>
                <Text className="!text-xs !text-gray-500 truncate">
                  {kpis?.productos_bajos || 0} bajos
                </Text>
              </div>
            </div>
          </Card>

          {/* Días Cobertura Promedio */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Cobertura Promedio
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      `${(kpis?.dias_cobertura_promedio || 0).toFixed(0)} días`
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Text className="!text-xs !text-gray-500 truncate">
                  Rotación: {(kpis?.rotacion_promedio || 0).toFixed(1)}x
                </Text>
              </div>
            </div>
          </Card>

          {/* Ventas Perdidas */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Ventas Perdidas (30d)
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.valor_ventas_perdidas_total || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <Text className="!text-xs !text-gray-500 truncate">
                  {formatNumber(kpis?.ventas_perdidas_total || 0)} unidades no vendidas
                </Text>
              </div>
            </div>
          </Card>
        </div>

        {/* Distribución de Stock */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { key: "sin_stock", label: "Sin Stock", value: kpis?.productos_sin_stock || 0, color: "bg-gray-500" },
            { key: "critico", label: "Crítico", value: kpis?.productos_criticos || 0, color: "bg-red-500" },
            { key: "bajo", label: "Bajo", value: kpis?.productos_bajos || 0, color: "bg-orange-500" },
            { key: "optimo", label: "Óptimo", value: kpis?.productos_optimos || 0, color: "bg-emerald-500" },
            { key: "exceso", label: "Exceso", value: kpis?.productos_exceso || 0, color: "bg-blue-500" },
          ].map((item) => (
            <Card
              key={item.key}
              className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-md hover:!shadow-lg transition-all !rounded-xl !p-4 cursor-pointer"
              onClick={() => setListFilters(prev => ({ ...prev, estadoStock: prev.estadoStock === item.key ? "" : item.key }))}
            >
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <div>
                  <Text className="!text-xs !text-gray-500">{item.label}</Text>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
          <TabList className="!bg-white !rounded-xl !p-1.5 !shadow-sm !border !border-gray-200">
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Vista por Producto
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Recomendaciones Producción
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Por Categoría
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Tendencias
            </Tab>
          </TabList>

          <TabPanels className="mt-6">
            {/* Tab 1: Vista por Producto */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <div className="flex items-center justify-between mb-6">
                  <Title className="!text-lg !font-bold !text-gray-900">
                    Inventario por Producto
                  </Title>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={listFilters.search}
                      onChange={(e) => setListFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                    <select
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={listFilters.estadoStock}
                      onChange={(e) => setListFilters(prev => ({ ...prev, estadoStock: e.target.value }))}
                    >
                      <option value="">Todos los estados</option>
                      <option value="sin_stock">Sin Stock</option>
                      <option value="critico">Crítico</option>
                      <option value="bajo">Bajo</option>
                      <option value="optimo">Óptimo</option>
                      <option value="exceso">Exceso</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Mín / Máx</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cobertura</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rotación</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Demanda/día</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">V. Perdidas</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {inventoryList?.map((item, idx) => {
                        const estadoConfig = getEstadoStockConfig(item.estado_stock)
                        const EstadoIcon = estadoConfig.icon
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 truncate max-w-xs">
                                  {item.nombre}
                                </span>
                                <span className="text-xs text-gray-500">{item.sku} • {item.categoria}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${estadoConfig.color}`}>
                                <EstadoIcon className="h-3 w-3" />
                                {estadoConfig.label}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-right font-bold">
                              {formatNumber(item.stock_disponible)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 text-right">
                              {formatNumber(item.stock_minimo)} / {formatNumber(item.stock_maximo)}
                            </td>
                            <td className="px-4 py-4 text-sm text-right">
                              <span className={`font-bold ${
                                item.dias_cobertura < 7 ? "text-red-600" :
                                item.dias_cobertura < 14 ? "text-orange-600" :
                                "text-gray-900"
                              }`}>
                                {item.dias_cobertura?.toFixed(0) || 0} días
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-right">
                              {(item.rotacion || 0).toFixed(1)}x
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-right">
                              {(item.demanda_diaria || 0).toFixed(0)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                              {formatCurrency(item.valor_inventario || 0)}
                            </td>
                            <td className="px-4 py-4 text-sm text-right">
                              {item.ventas_perdidas_30d > 0 ? (
                                <span className="text-red-600 font-bold">
                                  {formatCurrency(item.valor_ventas_perdidas_30d || 0)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabPanel>

            {/* Tab 2: Recomendaciones de Producción */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Factory className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Title className="!text-lg !font-bold !text-gray-900 !mb-0">
                      Recomendaciones de Producción
                    </Title>
                    <Text className="!text-sm !text-gray-500">
                      Productos priorizados para producir basado en niveles de inventario y demanda
                    </Text>
                  </div>
                </div>

                <div className="space-y-4">
                  {productionRecs?.map((rec, idx) => {
                    const prioridadConfig = getPrioridadConfig(rec.prioridad)
                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border transition-all hover:shadow-md ${
                          rec.prioridad === "urgente" ? "bg-red-50 border-red-200" :
                          rec.prioridad === "alta" ? "bg-orange-50 border-orange-200" :
                          "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${prioridadConfig.color}`}>
                                {prioridadConfig.label}
                              </span>
                              <span className="text-base font-bold text-gray-900 truncate">
                                {rec.producto_nombre}
                              </span>
                              <Badge color="gray" className="!text-xs">{rec.sku}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{rec.razon_recomendacion}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Stock actual</span>
                                <p className="font-bold text-gray-900">{formatNumber(rec.stock_actual)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Cobertura</span>
                                <p className={`font-bold ${rec.dias_cobertura < 7 ? "text-red-600" : "text-gray-900"}`}>
                                  {rec.dias_cobertura?.toFixed(0) || 0} días
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Demanda diaria</span>
                                <p className="font-bold text-gray-900">{rec.demanda_diaria_promedio?.toFixed(0) || 0}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Días producción</span>
                                <p className="font-bold text-gray-900">{rec.dias_produccion || "N/A"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs text-gray-500 block mb-1">Producir</span>
                            <p className="text-2xl font-bold text-purple-600">
                              {formatNumber(rec.cantidad_recomendada_producir)}
                            </p>
                            <span className="text-xs text-gray-500">unidades</span>
                            {rec.costo_produccion_estimado > 0 && (
                              <p className="text-xs text-gray-600 mt-2">
                                Costo est: {formatCurrency(rec.costo_produccion_estimado)}
                              </p>
                            )}
                          </div>
                        </div>
                        {rec.ventas_perdidas_30d > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-red-600 font-semibold">
                              Ventas perdidas (30d): {formatCurrency(rec.valor_ventas_perdidas_30d)}
                            </span>
                          </div>
                        )}
                        {rec.ordenes_produccion_pendientes > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <Factory className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-blue-600">
                              {formatNumber(rec.ordenes_produccion_pendientes)} órdenes de producción pendientes
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </TabPanel>

            {/* Tab 3: Por Categoría */}
            <TabPanel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                  <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                    Distribución de Valor por Categoría
                  </Title>
                  <ResponsiveContainer width="100%" height={350}>
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
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                  <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                    Salud por Categoría
                  </Title>
                  <div className="space-y-3">
                    {categoryData?.map((cat, idx) => {
                      const saludColor = cat.salud_categoria === "buena" ? "emerald" :
                                        cat.salud_categoria === "regular" ? "yellow" : "red"
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                              />
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {cat.categoria}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-5 text-xs text-gray-500">
                              <span>{cat.productos_total} productos</span>
                              <span>•</span>
                              <span>{cat.dias_cobertura_promedio?.toFixed(0)} días cobertura</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(cat.valor_inventario)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {cat.porcentaje_valor?.toFixed(1)}% del total
                              </p>
                            </div>
                            <Badge color={saludColor} className="!text-xs capitalize">
                              {cat.salud_categoria}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>

              {/* Tabla detallada por categoría */}
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6 mt-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Detalle por Categoría
                </Title>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Productos</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Sin Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Críticos</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Bajos</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Óptimos</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Exceso</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">V. Perdidas</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rotación</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {categoryData?.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-bold text-gray-900">{cat.categoria}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 text-right">{cat.productos_total}</td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className={cat.productos_sin_stock > 0 ? "text-gray-700 font-bold" : "text-gray-400"}>
                              {cat.productos_sin_stock}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className={cat.productos_criticos > 0 ? "text-red-600 font-bold" : "text-gray-400"}>
                              {cat.productos_criticos}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className={cat.productos_bajos > 0 ? "text-orange-600 font-bold" : "text-gray-400"}>
                              {cat.productos_bajos}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className="text-emerald-600 font-bold">{cat.productos_optimos}</span>
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className={cat.productos_exceso > 0 ? "text-blue-600 font-bold" : "text-gray-400"}>
                              {cat.productos_exceso}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className={cat.valor_ventas_perdidas_30d > 0 ? "text-red-600 font-bold" : "text-gray-400"}>
                              {cat.valor_ventas_perdidas_30d > 0 ? formatCurrency(cat.valor_ventas_perdidas_30d) : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                            {cat.rotacion_promedio?.toFixed(1)}x
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabPanel>

            {/* Tab 4: Tendencias */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6 mb-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-2">
                  Evolución del Valor de Inventario
                </Title>
                <Text className="!text-sm !text-gray-500 !mb-6">
                  Tendencia de los últimos 30 días
                </Text>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trendChartData}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="periodo"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Valor Inventario"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                  <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                    Productos Críticos en el Tiempo
                  </Title>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Productos Críticos"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                  <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                    Ventas Perdidas Acumuladas
                  </Title>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={trendChartData}>
                      <defs>
                        <linearGradient id="colorVentasPerdidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar dataKey="Ventas Perdidas" fill="url(#colorVentasPerdidas)" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  )
}
