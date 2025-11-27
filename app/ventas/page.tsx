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

const COLORS = {
  ventaPerdida: "#ef4444",
  ventas: "#10b981",
  inventario: "#3b82f6",
  margen: "#8b5cf6",
}

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
  const [selectedTab, setSelectedTab] = useState(0)

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Moderno */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Venta Perdida
              </h1>
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-2 ml-[52px]">
              <Calendar className="h-4 w-4 text-red-500" />
              Análisis detallado de <span className="font-semibold text-gray-900">oportunidades de mejora</span>
            </p>
          </div>
        </div>

        {/* KPI Cards - Diseño Ultra Moderno */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ventas Perdidas */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Ventas Perdidas
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.total_ventas_perdidas || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                    (kpis?.cambio_perdidas_pct || 0) >= 0
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {(kpis?.cambio_perdidas_pct || 0) >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(kpis?.cambio_perdidas_pct || 0).toFixed(1)}%
                </div>
                <Text className="!text-xs !text-gray-500 truncate">vs período anterior</Text>
              </div>
            </div>
          </Card>

          {/* Ventas Totales */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Ventas Totales
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">{formatCurrency(kpis?.total_ventas || 0)}</span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                    (kpis?.cambio_ventas_pct || 0) >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {(kpis?.cambio_ventas_pct || 0) >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(kpis?.cambio_ventas_pct || 0).toFixed(1)}%
                </div>
                <Text className="!text-xs !text-gray-500 truncate">vs período anterior</Text>
              </div>
            </div>
          </Card>

          {/* Tasa de Cumplimiento */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Tasa Cumplimiento
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      formatPercent(kpis?.tasa_cumplimiento_promedio || 0)
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Percent className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                    (kpis?.cambio_cumplimiento_pct || 0) >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {(kpis?.cambio_cumplimiento_pct || 0) >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(kpis?.cambio_cumplimiento_pct || 0).toFixed(1)} pts
                </div>
                <Text className="!text-xs !text-gray-500 truncate">vs período anterior</Text>
              </div>
            </div>
          </Card>

          {/* Órdenes con Pérdidas */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Órdenes Afectadas
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {loadingKPIs ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      formatNumber(kpis?.ordenes_con_perdidas || 0)
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
              </div>
              <Text className="!text-xs !text-gray-500 mt-auto pt-2 border-t border-gray-100 truncate">
                {kpis && `${((kpis.ordenes_con_perdidas / kpis.numero_ordenes) * 100).toFixed(1)}% del total`}
              </Text>
            </div>
          </Card>
        </div>

        {/* Gráfica Principal - Últimos 12 Meses */}
        <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
          <Title className="!text-xl !font-bold !text-gray-900 !mb-2">
            Desempeño de Ventas - Últimos 12 Meses
          </Title>
          <Text className="!text-sm !text-gray-500 !mb-6">
            Comparativa de ventas totales, ventas perdidas e inventario
          </Text>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={mainChartData}>
              <defs>
                <linearGradient id="colorInventario" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.inventario} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.inventario} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomMainTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
              />
              {/* Inventario - Area (shaded) */}
              <Area
                type="monotone"
                dataKey="Inventario"
                stroke={COLORS.inventario}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInventario)"
                yAxisId="right"
              />
              {/* Venta Perdida - Bar */}
              <Bar
                dataKey="Venta Perdida"
                fill={COLORS.ventaPerdida}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              {/* Ventas - Line */}
              <Line
                type="monotone"
                dataKey="Ventas"
                stroke={COLORS.ventas}
                strokeWidth={3}
                dot={{ fill: COLORS.ventas, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Tabs con análisis detallado */}
        <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
          <TabList className="!bg-white !rounded-xl !p-1.5 !shadow-sm !border !border-gray-200">
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Análisis de Pérdidas
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Transacciones
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Rentabilidad
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Cumplimiento
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Temporal
            </Tab>
            <Tab className="!rounded-lg !px-6 !py-2.5 !text-sm !font-semibold data-[selected]:!bg-gradient-to-r data-[selected]:!from-[#007BFF] data-[selected]:!to-[#0056b3] data-[selected]:!text-white data-[selected]:!shadow-md !text-gray-600 hover:!bg-gray-100 hover:!text-gray-900 !transition-all">
              Descuentos
            </Tab>
          </TabList>

          <TabPanels className="mt-6">
            {/* Tab 1: Análisis de Pérdidas */}
            <TabPanel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Productos */}
                <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                  <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                    Top 10 Productos con Pérdidas
                  </Title>
                  <div className="space-y-3">
                    {perdidasProducto?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {item.nombre}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-8">
                            <Badge color="gray" className="!text-xs">
                              {item.categoria}
                            </Badge>
                            <Text className="!text-xs !text-gray-500">
                              Fill Rate: {formatPercent(item.tasa_cumplimiento_promedio)}
                            </Text>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-red-600">
                            {formatCurrency(item.total_ventas_perdidas)}
                          </p>
                          <Text className="!text-xs !text-gray-500">
                            {formatPercent(item.porcentaje_del_total)} del total
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Top Clientes */}
                <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                  <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                    Top 10 Clientes Afectados
                  </Title>
                  <div className="space-y-3">
                    {perdidasCliente?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {item.nombre}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-8">
                            <Badge color="blue" className="!text-xs">
                              {item.categoria}
                            </Badge>
                            <Text className="!text-xs !text-gray-500">
                              {item.numero_ordenes_afectadas} órdenes
                            </Text>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-red-600">
                            {formatCurrency(item.total_ventas_perdidas)}
                          </p>
                          <Text className="!text-xs !text-gray-500">
                            {formatPercent(item.porcentaje_del_total)} del total
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Distribución por Categoría */}
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6 mt-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Distribución de Pérdidas por Categoría
                </Title>
                <ResponsiveContainer width="100%" height={400}>
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
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {perdidasCategoria?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#f59e0b', '#eab308'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </TabPanel>

            {/* Tab 2: Transacciones */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Órdenes con Pérdidas (Últimas 20)
                </Title>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orden</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Solicitado</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Entregado</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Perdido</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto Perdido</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Fill Rate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {ventasList?.map((venta, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm text-gray-900 font-medium">{venta.numero_orden}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {new Date(venta.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate font-medium">
                            {venta.cliente_nombre}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {venta.producto_nombre}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                            {formatNumber(venta.cantidad_solicitada)}
                          </td>
                          <td className="px-4 py-4 text-sm text-emerald-600 text-right font-medium">
                            {formatNumber(venta.cantidad_entregada)}
                          </td>
                          <td className="px-4 py-4 text-sm text-red-600 font-bold text-right">
                            {formatNumber(venta.cantidad_perdida)}
                          </td>
                          <td className="px-4 py-4 text-sm text-red-600 font-bold text-right">
                            {formatCurrency(venta.monto_perdida)}
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              venta.tasa_cumplimiento >= 95
                                ? "bg-emerald-100 text-emerald-700"
                                : venta.tasa_cumplimiento >= 75
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {formatPercent(venta.tasa_cumplimiento)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabPanel>

            {/* Tab 3: Rentabilidad */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Top 10 Productos por Margen Bruto
                </Title>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsBarChart data={rentabilidadProducto?.map(item => ({
                    nombre: item.nombre.substring(0, 20),
                    "Margen": item.margen_bruto,
                  })) || []}>
                    <defs>
                      <linearGradient id="colorMargen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
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
                    <Bar dataKey="Margen" fill="url(#colorMargen)" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>

                <div className="mt-8 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ventas</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Costo</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Margen</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Margen %</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Órdenes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {rentabilidadProducto?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm text-gray-900 font-medium">{item.nombre}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.total_ventas)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 text-right">
                            {formatCurrency(item.costo_total)}
                          </td>
                          <td className="px-4 py-4 text-sm text-emerald-600 font-bold text-right">
                            {formatCurrency(item.margen_bruto)}
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              item.margen_porcentaje >= 40
                                ? "bg-emerald-100 text-emerald-700"
                                : item.margen_porcentaje >= 20
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {formatPercent(item.margen_porcentaje)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 text-right">
                            {formatNumber(item.numero_ordenes)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabPanel>

            {/* Tab 4: Cumplimiento */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Distribución de Fill Rate
                </Title>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsBarChart data={cumplimientoResumen?.map(item => ({
                    rango: item.nombre,
                    "Órdenes": item.total_ordenes,
                  })) || []}>
                    <defs>
                      <linearGradient id="colorOrdenes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="rango"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(value: any) => formatNumber(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="Órdenes" fill="url(#colorOrdenes)" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {cumplimientoResumen?.map((item, idx) => (
                  <Card key={idx} className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all !rounded-2xl !p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Text className="!text-sm !text-gray-500 !mb-1">Fill Rate</Text>
                        <Title className="!text-2xl !font-bold !text-gray-900">
                          {item.nombre}
                        </Title>
                      </div>
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
                        item.nombre === "100%"
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                          : item.nombre.includes("90")
                          ? "bg-gradient-to-br from-blue-500 to-blue-600"
                          : item.nombre.includes("75")
                          ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                          : "bg-gradient-to-br from-red-500 to-red-600"
                      }`}>
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Text className="!text-xs !text-gray-500">Órdenes</Text>
                        <Text className="!text-sm !font-bold !text-gray-900">
                          {formatNumber(item.total_ordenes)}
                        </Text>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text className="!text-xs !text-gray-500">Unidades</Text>
                        <Text className="!text-sm !font-semibold !text-gray-700">
                          {formatNumber(item.unidades_entregadas)}
                        </Text>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <Text className="!text-xs !text-gray-500">Del total</Text>
                        <Text className="!text-sm !font-bold !text-blue-600">
                          {formatPercent((item.total_ordenes / (kpis?.numero_ordenes || 1)) * 100)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabPanel>

            {/* Tab 5: Temporal */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6 mb-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Ventas por Día de la Semana
                </Title>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsBarChart data={temporalDiaSemana?.map(item => ({
                    dia: item.periodo,
                    "Ventas": item.total_ventas,
                  })) || []}>
                    <defs>
                      <linearGradient id="colorVentasDia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
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
                    <Bar dataKey="Ventas" fill="url(#colorVentasDia)" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Fill Rate por Día de la Semana
                </Title>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={temporalDiaSemana?.map(item => ({
                    dia: item.periodo,
                    "Fill Rate": item.tasa_cumplimiento,
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value: any) => `${value.toFixed(2)}%`}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Fill Rate"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabPanel>

            {/* Tab 6: Descuentos */}
            <TabPanel>
              <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl !p-6">
                <Title className="!text-lg !font-bold !text-gray-900 !mb-6">
                  Top 10 Clientes por Descuentos Aplicados
                </Title>
                <div className="space-y-3">
                  {descuentosCliente?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-white rounded-xl border border-orange-100 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                            {idx + 1}
                          </div>
                          <p className="text-base font-bold text-gray-900 truncate">
                            {item.nombre}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-9 flex-wrap">
                          <Badge color="blue" className="!text-xs">
                            {item.categoria}
                          </Badge>
                          <Text className="!text-xs !text-gray-600">
                            {formatNumber(item.ordenes_con_descuento)} de {formatNumber(item.numero_ordenes)} órdenes
                          </Text>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-2">
                        <div>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency(item.total_descuentos)}
                          </p>
                          <Text className="!text-xs !text-gray-500">
                            {formatPercent(item.porcentaje_descuento_promedio)} descuento
                          </Text>
                        </div>
                        <div className="flex items-center gap-2 text-xs pt-2 border-t border-gray-200">
                          <span className="text-gray-500 font-medium">Margen:</span>
                          <span className={`font-bold ${
                            (item.impacto_margen || 0) < 0 ? "text-red-600" : "text-gray-700"
                          }`}>
                            {item.margen_con_descuento?.toFixed(1) || "N/A"}%
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-gray-700 font-semibold">
                            {item.margen_sin_descuento?.toFixed(1) || "N/A"}%
                          </span>
                          {item.impacto_margen !== null && (
                            <span className={`ml-1 ${
                              item.impacto_margen < 0 ? "text-red-600" : "text-emerald-600"
                            } font-bold`}>
                              ({item.impacto_margen > 0 ? "+" : ""}{item.impacto_margen.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  )
}
