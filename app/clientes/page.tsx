"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { Badge, Card as TremorCard } from "@tremor/react"
import { Card as ShadcnCard, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { type DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Area, AreaChart } from "recharts"
import {
  Users,
  UserPlus,
  AlertTriangle,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useClientsKPIs,
  useClientsList,
  useClientesOptions,
  useProductosOptions,
  type Client,
} from "@/hooks/use-clients-data"
import { MultiSelect } from "@/components/ui/multi-select"
import { ClientDetailModal } from "@/components/clientes/client-detail-modal"

// Por ahora usamos el tenant_id real
const TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)
}

// Componente Avatar
function ClientAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  )
}

// Componente Status Badge
function StatusBadge({ status }: { status: string }) {
  const config = {
    activo: { color: "emerald", label: "Activo", dot: "bg-emerald-500" },
    inactivo: { color: "gray", label: "Inactivo", dot: "bg-gray-400" },
    en_riesgo: { color: "red", label: "En Riesgo", dot: "bg-red-500" },
  }

  const { label, dot } = config[status as keyof typeof config] || config.activo

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-sm text-gray-700 font-medium">{label}</span>
    </div>
  )
}

// Componente Trend Icon
function TrendIcon({ tendencia }: { tendencia: string }) {
  if (tendencia === "creciendo")
    return <TrendingUp className="h-4 w-4 text-emerald-600" />
  if (tendencia === "decreciendo")
    return <TrendingDown className="h-4 w-4 text-red-600" />
  return <Minus className="h-4 w-4 text-gray-400" />
}

export default function ClientesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Modal state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

  // Filtros temporales (no aplicados todavía)
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined)
  const [tempClienteIds, setTempClienteIds] = useState<number[]>([])
  const [tempProductoIds, setTempProductoIds] = useState<number[]>([])

  // Filtros aplicados (usados en la query)
  const [appliedFilters, setAppliedFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    clienteIds: [] as number[],
    productoIds: [] as number[],
  })

  // Fetch options for multiselects
  const { data: clientesOptions } = useClientesOptions(TENANT_ID)
  const { data: productosOptions } = useProductosOptions(TENANT_ID)

  // Fetch data con filtros aplicados
  const { data: kpis, isLoading: kpisLoading } = useClientsKPIs(
    TENANT_ID,
    appliedFilters.fechaInicio || undefined,
    appliedFilters.fechaFin || undefined
  )
  const { data: clients, isLoading: clientsLoading } = useClientsList(TENANT_ID, {
    fechaInicio: appliedFilters.fechaInicio || undefined,
    fechaFin: appliedFilters.fechaFin || undefined,
    clienteIds: appliedFilters.clienteIds.length > 0 ? appliedFilters.clienteIds : undefined,
    productoIds: appliedFilters.productoIds.length > 0 ? appliedFilters.productoIds : undefined,
    search: globalFilter || undefined,
  })

  // Función para aplicar filtros
  const handleApplyFilters = () => {
    setAppliedFilters({
      fechaInicio: tempDateRange?.from ? tempDateRange.from.toISOString().split('T')[0] : "",
      fechaFin: tempDateRange?.to ? tempDateRange.to.toISOString().split('T')[0] : "",
      clienteIds: tempClienteIds,
      productoIds: tempProductoIds,
    })
  }

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setTempDateRange(undefined)
    setTempClienteIds([])
    setTempProductoIds([])
    setAppliedFilters({
      fechaInicio: "",
      fechaFin: "",
      clienteIds: [],
      productoIds: [],
    })
    setGlobalFilter("")
  }

  // Definir columnas
  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ClientAvatar name={row.original.nombre} />
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">{row.original.nombre}</span>
              <span className="text-xs text-gray-500">{row.original.clave_cliente}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "clasificacion",
        header: "Clase",
        cell: ({ row }) => (
          <Badge
            color={
              row.original.clasificacion === "A"
                ? "blue"
                : row.original.clasificacion === "B"
                ? "indigo"
                : "gray"
            }
            className="!font-bold"
          >
            {row.original.clasificacion}
          </Badge>
        ),
      },
      {
        accessorKey: "total_ventas_periodo",
        header: "Ventas Actual",
        cell: ({ row }) => (
          <span className="font-semibold text-gray-900">
            {formatCurrency(row.original.total_ventas_periodo)}
          </span>
        ),
      },
      {
        accessorKey: "total_ventas_anterior",
        header: "Ventas Anterior",
        cell: ({ row }) => (
          <span className="text-gray-600">
            {formatCurrency(row.original.total_ventas_anterior)}
          </span>
        ),
      },
      {
        accessorKey: "total_unidades_periodo",
        header: "Unidades Actual",
        cell: ({ row }) => (
          <span className="text-gray-700">
            {row.original.total_unidades_periodo.toLocaleString("es-MX")}
          </span>
        ),
      },
      {
        accessorKey: "total_unidades_anterior",
        header: "Unidades Anterior",
        cell: ({ row }) => {
          const anterior = row.original.total_ventas_anterior
          const unidadesAnt = anterior > 0
            ? row.original.total_unidades_periodo * (1 - row.original.variacion_unidades_pct / 100)
            : 0
          return (
            <span className="text-gray-600">
              {Math.round(unidadesAnt).toLocaleString("es-MX")}
            </span>
          )
        },
      },
      {
        accessorKey: "variacion_ventas_pct",
        header: "Variación %",
        cell: ({ row }) => {
          const variation = row.original.variacion_ventas_pct
          const isPositive = variation >= 0
          return (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUp className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={`font-semibold ${
                  isPositive ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {Math.abs(variation).toFixed(1)}%
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "num_ordenes",
        header: "Órdenes",
        cell: ({ row }) => <span className="text-gray-700">{row.original.num_ordenes}</span>,
      },
      {
        accessorKey: "ticket_promedio",
        header: "Ticket Prom.",
        cell: ({ row }) => (
          <span className="text-gray-700">{formatCurrency(row.original.ticket_promedio)}</span>
        ),
      },
      {
        accessorKey: "ultima_compra",
        header: "Última Compra",
        cell: ({ row }) => {
          if (!row.original.ultima_compra) return <span className="text-gray-400">-</span>
          return (
            <div className="flex flex-col">
              <span className="text-sm text-gray-900">
                {new Date(row.original.ultima_compra).toLocaleDateString("es-MX")}
              </span>
              {row.original.dias_desde_ultima_compra !== null && (
                <span className="text-xs text-gray-500">
                  Hace {row.original.dias_desde_ultima_compra} días
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "tendencia",
        header: "Tendencia",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TrendIcon tendencia={row.original.tendencia} />
            <span className="text-sm text-gray-600 capitalize">{row.original.tendencia}</span>
          </div>
        ),
      },
      {
        accessorKey: "lifetime_value",
        header: "LTV",
        cell: ({ row }) => (
          <span className="font-semibold text-blue-600">
            {formatCurrency(row.original.lifetime_value)}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: clients || [],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  })

  // Export to CSV
  const exportToCSV = () => {
    if (!clients || clients.length === 0) return

    const headers = [
      "Cliente",
      "Clave",
      "Status",
      "Clasificación",
      "Ventas",
      "Unidades",
      "Variación %",
      "Órdenes",
      "Ticket Promedio",
      "Última Compra",
      "Tendencia",
      "LTV",
    ]

    const rows = clients.map((c) => [
      c.nombre,
      c.clave_cliente,
      c.status,
      c.clasificacion,
      c.total_ventas_periodo,
      c.total_unidades_periodo,
      c.variacion_ventas_pct,
      c.num_ordenes,
      c.ticket_promedio,
      c.ultima_compra || "",
      c.tendencia,
      c.lifetime_value,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Clientes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona y analiza la información de tus clientes
            </p>
          </div>
        </motion.div>

        {/* Filtros - Estilo Notion */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            dateRange={tempDateRange}
            onDateRangeChange={setTempDateRange}
            placeholder="Período"
            className="w-auto"
          />

          <MultiSelect
            options={clientesOptions || []}
            selected={tempClienteIds}
            onChange={setTempClienteIds}
            placeholder="Clientes"
          />

          <MultiSelect
            options={productosOptions || []}
            selected={tempProductoIds}
            onChange={setTempProductoIds}
            placeholder="Productos"
          />

          <Button onClick={handleApplyFilters} size="sm">
            Aplicar
          </Button>

          {(tempDateRange || tempClienteIds.length > 0 || tempProductoIds.length > 0) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* KPIs con Sparklines */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Clientes Activos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0, ease: [0.25, 0.4, 0.25, 1] }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <ShadcnCard className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden">
              <CardContent className="p-5 pb-0">
                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">
                  Clientes Activos
                </p>
                {kpisLoading ? (
                  <Skeleton className="h-6 w-24 mb-1" />
                ) : (
                  <p className="text-lg font-bold text-foreground tracking-tight truncate">
                    {kpis?.total_clientes_activos || 0}
                  </p>
                )}
                {kpis && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-semibold flex-shrink-0",
                        kpis.variacion_activos_pct >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {kpis.variacion_activos_pct >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {kpis.variacion_activos_pct >= 0 ? "+" : ""}{kpis.variacion_activos_pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground truncate">vs anterior</span>
                  </div>
                )}
                <div className="h-16 mt-3 -mx-5 -mb-1">
                  <ChartContainer config={sparklineChartConfig} className="h-full w-full">
                    <AreaChart
                      data={generateSparklineData(kpis?.variacion_activos_pct || 0)}
                      margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradientActivos" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={kpis?.variacion_activos_pct && kpis.variacion_activos_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={kpis?.variacion_activos_pct && kpis.variacion_activos_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={kpis?.variacion_activos_pct && kpis.variacion_activos_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                        strokeWidth={2}
                        fill="url(#gradientActivos)"
                        dot={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </ShadcnCard>
          </motion.div>

          {/* Clientes Nuevos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.25, 0.4, 0.25, 1] }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <ShadcnCard className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden">
              <CardContent className="p-5 pb-0">
                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">
                  Clientes Nuevos
                </p>
                {kpisLoading ? (
                  <Skeleton className="h-6 w-24 mb-1" />
                ) : (
                  <p className="text-lg font-bold text-foreground tracking-tight truncate">
                    {kpis?.clientes_nuevos_periodo || 0}
                  </p>
                )}
                {kpis && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-semibold flex-shrink-0",
                        kpis.variacion_nuevos_pct >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {kpis.variacion_nuevos_pct >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {kpis.variacion_nuevos_pct >= 0 ? "+" : ""}{kpis.variacion_nuevos_pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground truncate">vs anterior</span>
                  </div>
                )}
                <div className="h-16 mt-3 -mx-5 -mb-1">
                  <ChartContainer config={sparklineChartConfig} className="h-full w-full">
                    <AreaChart
                      data={generateSparklineData(kpis?.variacion_nuevos_pct || 0)}
                      margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradientNuevos" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={kpis?.variacion_nuevos_pct && kpis.variacion_nuevos_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={kpis?.variacion_nuevos_pct && kpis.variacion_nuevos_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={kpis?.variacion_nuevos_pct && kpis.variacion_nuevos_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                        strokeWidth={2}
                        fill="url(#gradientNuevos)"
                        dot={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </ShadcnCard>
          </motion.div>

          {/* Clientes en Riesgo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <ShadcnCard className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden">
              <CardContent className="p-5 pb-0">
                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">
                  En Riesgo
                </p>
                {kpisLoading ? (
                  <Skeleton className="h-6 w-24 mb-1" />
                ) : (
                  <p className="text-lg font-bold text-foreground tracking-tight truncate">
                    {kpis?.clientes_en_riesgo || 0}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-muted-foreground truncate">Sin comprar 60+ días</span>
                </div>
                <div className="h-16 mt-3 -mx-5 -mb-1">
                  <ChartContainer config={sparklineChartConfig} className="h-full w-full">
                    <AreaChart
                      data={generateSparklineData(kpis?.clientes_en_riesgo && kpis.clientes_en_riesgo > 0 ? -15 : 0)}
                      margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradientRiesgo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(0, 72%, 51%)"
                        strokeWidth={2}
                        fill="url(#gradientRiesgo)"
                        dot={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </ShadcnCard>
          </motion.div>

          {/* Revenue Promedio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <ShadcnCard className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden">
              <CardContent className="p-5 pb-0">
                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">
                  Revenue Promedio
                </p>
                {kpisLoading ? (
                  <Skeleton className="h-6 w-32 mb-1" />
                ) : (
                  <p className="text-lg font-bold text-foreground tracking-tight truncate">
                    {formatCurrency(kpis?.revenue_promedio_cliente || 0)}
                  </p>
                )}
                {kpis && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-semibold flex-shrink-0",
                        kpis.variacion_revenue_pct >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {kpis.variacion_revenue_pct >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {kpis.variacion_revenue_pct >= 0 ? "+" : ""}{kpis.variacion_revenue_pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground truncate">vs anterior</span>
                  </div>
                )}
                <div className="h-16 mt-3 -mx-5 -mb-1">
                  <ChartContainer config={sparklineChartConfig} className="h-full w-full">
                    <AreaChart
                      data={generateSparklineData(kpis?.variacion_revenue_pct || 0)}
                      margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={kpis?.variacion_revenue_pct && kpis.variacion_revenue_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={kpis?.variacion_revenue_pct && kpis.variacion_revenue_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={kpis?.variacion_revenue_pct && kpis.variacion_revenue_pct >= 0 ? "hsl(152, 69%, 40%)" : "hsl(0, 72%, 51%)"}
                        strokeWidth={2}
                        fill="url(#gradientRevenue)"
                        dot={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </ShadcnCard>
          </motion.div>
        </div>

        {/* Tabla */}
        <TremorCard className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl overflow-hidden !p-0">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={exportToCSV}
                  disabled={!clients || clients.length === 0}
                  className="!bg-[#007BFF] hover:!bg-[#0056b3] !text-white"
                  icon={Download}
                >
                  Exportar CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {clientsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                  <div className="animate-spin h-10 w-10 border-4 border-[#007BFF] border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-gray-500">Cargando clientes...</p>
                </div>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-2">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedClientId(row.original.cliente_id)}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {table.getState().pagination.pageIndex * 25 + 1} a{" "}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * 25,
                      table.getFilteredRowModel().rows.length
                    )}{" "}
                    de {table.getFilteredRowModel().rows.length} clientes
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </TremorCard>
      </div>

      {/* Client Detail Modal */}
      {selectedClientId && (
        <ClientDetailModal
          tenantId={TENANT_ID}
          clienteId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  )
}
