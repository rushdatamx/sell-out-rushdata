"use client"

import {
  Card,
  Title,
  Text,
  Metric,
  Flex,
  DonutChart,
  Badge,
  BarChart,
} from "@tremor/react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  AlertCircle,
  DollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { RUSHDATA_COLORS } from "@/lib/tremor-config"
import {
  useKPIs,
  useMonthlySalesComparison,
  useTopProducts,
  useTopClients,
  useAlerts,
  useInventoryStatus,
  useLastDataMonth,
} from "@/hooks/use-dashboard-data"
import { useAuth } from "@/lib/auth/auth-context"
import { useState } from "react"
import { Calendar, Sparkles } from "lucide-react"

// Por ahora usamos el tenant_id real de Galletas del Norte
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

// Custom Tooltip para Ventas Mensuales con diferencia porcentual
const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length === 2) {
    const currentYear = payload[0].value
    const previousYear = payload[1].value
    const difference = previousYear !== 0
      ? ((currentYear - previousYear) / previousYear) * 100
      : 0
    const isPositive = difference >= 0

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
        <p style={{ color: "#007BFF", fontSize: "13px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 600 }}>Año Actual:</span> {formatCurrency(currentYear)}
        </p>
        <p style={{ color: "#284389", fontSize: "13px", marginBottom: "8px" }}>
          <span style={{ fontWeight: 600 }}>Año Anterior:</span> {formatCurrency(previousYear)}
        </p>
        <div style={{
          borderTop: "1px solid #f3f4f6",
          paddingTop: "8px",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>
            Diferencia:
          </span>
          <span style={{
            color: isPositive ? "#10b981" : "#ef4444",
            fontSize: "14px",
            fontWeight: 700
          }}>
            {isPositive ? "+" : ""}{difference.toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<30 | 60 | 90>(30)

  // Usar dateFilter en todos los hooks que lo soportan
  const { data: lastMonth } = useLastDataMonth(TENANT_ID, dateFilter)
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useKPIs(TENANT_ID, dateFilter)
  const { data: monthlySales, isLoading: salesLoading } = useMonthlySalesComparison(TENANT_ID)
  const { data: topProducts, isLoading: productsLoading } = useTopProducts(TENANT_ID, 5, dateFilter)
  const { data: topClients, isLoading: clientsLoading } = useTopClients(TENANT_ID, 5, dateFilter)
  const { data: alerts, isLoading: alertsLoading } = useAlerts(TENANT_ID, 10, dateFilter)
  const { data: inventoryStatus, isLoading: inventoryLoading } = useInventoryStatus(TENANT_ID)

  // Calcular cambios porcentuales
  const ventasMesChange = kpis ? calculatePercentChange(kpis.ventasMes, kpis.ventasMesAnterior) : 0
  const ventasYTDChange = kpis ? calculatePercentChange(kpis.ventasYTD, kpis.ventasYTDAnterior) : 0

  if (kpisError) {
    console.error("Error cargando KPIs:", kpisError)
  }

  const mesEnCurso = lastMonth ? `${lastMonth.nombre_mes} ${lastMonth.anio}` : "Cargando..."

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-8">
        {/* Header Moderno */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#007BFF] to-[#284389] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard Ejecutivo
              </h1>
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-2 ml-[52px]">
              <Calendar className="h-4 w-4 text-[#007BFF]" />
              Datos actualizados: <span className="font-semibold text-gray-900">{mesEnCurso}</span>
            </p>
          </div>

          {/* Filtros de Fecha - Diseño moderno */}
          <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
            {[30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDateFilter(days as 30 | 60 | 90)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  dateFilter === days
                    ? "bg-gradient-to-r from-[#007BFF] to-[#0056b3] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {days} días
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards - Diseño Ultra Moderno */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Ventas Últimos N Días */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Ventas Últimos {dateFilter}D
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.ventasMes || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#007BFF] to-[#0056b3] flex items-center justify-center shadow-lg flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                    ventasMesChange >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {ventasMesChange >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(ventasMesChange).toFixed(1)}%
                </div>
                <Text className="!text-xs !text-gray-500 truncate">vs período anterior</Text>
              </div>
            </div>
          </Card>

          {/* Ventas YTD */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Ventas YTD
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.ventasYTD || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#284389] to-[#1a2f5f] flex items-center justify-center shadow-lg flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                    ventasYTDChange >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {ventasYTDChange >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(ventasYTDChange).toFixed(1)}%
                </div>
                <Text className="!text-xs !text-gray-500 truncate">vs año anterior</Text>
              </div>
            </div>
          </Card>

          {/* Clientes Activos */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Clientes Activos
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      kpis?.clientesActivos || 0
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <Text className="!text-xs !text-gray-500 mt-auto pt-2 border-t border-gray-100 truncate">
                Últimos {dateFilter} días
              </Text>
            </div>
          </Card>

          {/* Ticket Promedio */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Ticket Promedio
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-28 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.ticketPromedio || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
              </div>
              <Text className="!text-xs !text-gray-500 mt-auto pt-2 border-t border-gray-100 truncate">
                Últimos {dateFilter} días
              </Text>
            </div>
          </Card>

          {/* Stock Crítico */}
          <Card
            className={`!bg-white !border-0 !ring-1 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4 ${
              kpis?.productoscrticos && kpis.productoscrticos > 0
                ? "!ring-red-200"
                : "!ring-gray-200"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${
                kpis?.productoscrticos && kpis.productoscrticos > 0
                  ? "from-red-500/5"
                  : "from-emerald-500/5"
              }`}
            />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Stock Crítico
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-12 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      kpis?.productoscrticos || 0
                    )}
                  </Metric>
                </div>
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                    kpis?.productoscrticos && kpis.productoscrticos > 0
                      ? "bg-gradient-to-br from-red-500 to-red-600"
                      : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                  }`}
                >
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
              <Text className="!text-xs !text-gray-500 mt-auto pt-2 border-t border-gray-100 truncate">
                Productos bajo mínimo
              </Text>
            </div>
          </Card>

          {/* Margen Promedio */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Margen Promedio
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      `${((kpis?.margenPromedio || 0) * 100).toFixed(0)}%`
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Percent className="h-5 w-5 text-white" />
                </div>
              </div>
              <Text className="!text-xs !text-gray-500 mt-auto pt-2 border-t border-gray-100 truncate">
                Últimos {dateFilter} días
              </Text>
            </div>
          </Card>
        </div>

        {/* Fila Principal: Gráfica + Top Productos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Ventas Mensuales - 2 columnas */}
          <Card className="lg:col-span-2 !bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#007BFF]/10 to-[#007BFF]/5 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#007BFF]" />
              </div>
              <div>
                <Title className="!font-bold !text-gray-900">Ventas Mensuales Comparativas</Title>
                <Text className="!text-xs !text-gray-500">Últimos 12 meses vs año anterior</Text>
              </div>
            </div>
            {salesLoading ? (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center space-y-3">
                  <div className="animate-spin h-10 w-10 border-4 border-[#007BFF] border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-gray-500">Cargando datos...</p>
                </div>
              </div>
            ) : monthlySales && monthlySales.length > 0 ? (
              <div className="mt-4 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={monthlySales}>
                    {/* Grid ultra sutil */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 9, fill: "#6b7280" }}
                      stroke="#e5e7eb"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        // Convertir "Jan 2025" a "Jan-25"
                        const parts = value.split(' ')
                        if (parts.length === 2) {
                          return `${parts[0]}-${parts[1].slice(-2)}`
                        }
                        return value
                      }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      stroke="#e5e7eb"
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip content={<CustomMonthlyTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: "24px" }}
                      formatter={(value) =>
                        value === "currentYear" ? "Año Actual" : "Año Anterior"
                      }
                      iconType="circle"
                    />
                    {/* Año Actual: Barras con color primario RushData */}
                    <Bar
                      dataKey="currentYear"
                      fill="#007BFF"
                      radius={[8, 8, 0, 0]}
                      name="currentYear"
                    />
                    {/* Año Anterior: Línea con color secundario RushData */}
                    <Line
                      type="monotone"
                      dataKey="previousYear"
                      stroke="#284389"
                      strokeWidth={3}
                      dot={{ fill: "#284389", r: 4, strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                      name="previousYear"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-400">No hay datos disponibles</p>
              </div>
            )}
          </Card>

          {/* Top 5 Productos */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <Title className="!font-bold !text-gray-900">Top 5 Productos</Title>
                <Text className="!text-xs !text-gray-500">
                  Últimos {dateFilter} días • Por ingresos
                </Text>
              </div>
            </div>
            {productsLoading ? (
              <div className="h-72 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="mt-2 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      stroke="#d1d5db"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={150}
                      tick={{ fontSize: 9, fill: "#374151" }}
                      stroke="#d1d5db"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        // Truncar nombres muy largos
                        return value.length > 25 ? `${value.substring(0, 25)}...` : value
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ fontWeight: 600, color: "#111827", fontSize: "12px" }}
                    />
                    <Bar dataKey="total_ventas" radius={[0, 8, 8, 0]}>
                      {topProducts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? "#007BFF" : "#284389"}
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-sm">No hay productos disponibles</p>
              </div>
            )}
          </Card>
        </div>

        {/* Segunda Fila: Top Clientes + Alertas + Inventario */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Top 5 Clientes */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Title className="!font-bold !text-gray-900">Top 5 Clientes</Title>
                <Text className="!text-xs !text-gray-500">
                  Últimos {dateFilter} días • Por volumen
                </Text>
              </div>
            </div>
            {clientsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : topClients && topClients.length > 0 ? (
              <div className="mt-2 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={topClients}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      stroke="#d1d5db"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={150}
                      tick={{ fontSize: 9, fill: "#374151" }}
                      stroke="#d1d5db"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        // Truncar nombres muy largos
                        return value.length > 25 ? `${value.substring(0, 25)}...` : value
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ fontWeight: 600, color: "#111827", fontSize: "12px" }}
                    />
                    <Bar dataKey="total_compras" radius={[0, 8, 8, 0]}>
                      {topClients.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? "#007BFF" : "#284389"}
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-sm">No hay clientes disponibles</p>
              </div>
            )}
          </Card>

          {/* Alertas y Accionables */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Title className="!font-bold !text-gray-900">Alertas y Accionables</Title>
                <Text className="!text-xs !text-gray-500">Requieren tu atención</Text>
              </div>
            </div>
            {alertsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-3 border-amber-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {alerts && alerts.length > 0 ? (
                  alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-gray-200 transition-all"
                    >
                      <Badge
                        color={
                          alert.prioridad === "high"
                            ? "red"
                            : alert.prioridad === "medium"
                            ? "amber"
                            : "blue"
                        }
                        className="shrink-0 !font-semibold"
                      >
                        {alert.tipo}
                      </Badge>
                      <p className="text-xs text-gray-700 font-medium leading-relaxed">
                        {alert.mensaje}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                      <Package className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-900">Todo en orden</p>
                    <p className="text-xs text-emerald-600 mt-1">No hay alertas en este momento</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Estado de Inventario */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Title className="!font-bold !text-gray-900">Estado de Inventario</Title>
                <Text className="!text-xs !text-gray-500">Distribución por nivel de stock</Text>
              </div>
            </div>
            {inventoryLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-3 border-purple-600 border-t-transparent rounded-full" />
              </div>
            ) : inventoryStatus && inventoryStatus.length > 0 ? (
              <>
                <div className="mt-4 h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryStatus}
                        dataKey="cantidad"
                        nameKey="categoria"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        label={(entry) => `${entry.cantidad}`}
                      >
                        {inventoryStatus.map((entry, index) => {
                          // Alternar entre colores primario y secundario de RushData
                          const colors = ["#007BFF", "#284389", "#4D9FFF", "#3A5AA5"]
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={colors[index % colors.length]}
                            />
                          )
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `${value} productos`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ fontWeight: 600, color: "#111827", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 space-y-3">
                  {inventoryStatus.map((status, idx) => {
                    const colors = ["#007BFF", "#284389", "#4D9FFF", "#3A5AA5"]
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colors[idx % colors.length] }}
                          />
                          <Text className="!text-sm !font-semibold !text-gray-700">
                            {status.categoria}
                          </Text>
                        </div>
                        <Text className="!text-sm !font-bold !text-gray-900">
                          {formatCurrency(status.valor)}
                        </Text>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-sm">No hay datos de inventario</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
