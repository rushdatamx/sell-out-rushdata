"use client"

import { useState, useMemo } from "react"
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
import { Card, Metric, Text, Badge, Button } from "@tremor/react"
import {
  Package,
  PackagePlus,
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
} from "lucide-react"
import {
  useProductsKPIs,
  useProductsList,
  useCategoriasOptions,
  type Product,
} from "@/hooks/use-products-data"
import { useClientesOptions } from "@/hooks/use-clients-data"
import { MultiSelect } from "@/components/ui/multi-select"
import { ProductDetailModal } from "@/components/productos/product-detail-modal"

// Por ahora usamos el tenant_id real
const TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)
}

// Componente Avatar
function ProductAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
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

export default function ProductosPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Modal state
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  // Filtros temporales (no aplicados todavía)
  const [tempFechaInicio, setTempFechaInicio] = useState<string>("")
  const [tempFechaFin, setTempFechaFin] = useState<string>("")
  const [tempClienteIds, setTempClienteIds] = useState<number[]>([])
  const [tempCategoria, setTempCategoria] = useState<string>("")

  // Filtros aplicados (usados en la query)
  const [appliedFilters, setAppliedFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    clienteIds: [] as number[],
    categoria: "",
  })

  // Fetch options for multiselects
  const { data: clientesOptions } = useClientesOptions(TENANT_ID)
  const { data: categoriasOptions } = useCategoriasOptions(TENANT_ID)

  // Fetch data con filtros aplicados
  const { data: kpis, isLoading: kpisLoading } = useProductsKPIs(
    TENANT_ID,
    appliedFilters.fechaInicio || undefined,
    appliedFilters.fechaFin || undefined
  )
  const { data: products, isLoading: productsLoading } = useProductsList(TENANT_ID, {
    fechaInicio: appliedFilters.fechaInicio || undefined,
    fechaFin: appliedFilters.fechaFin || undefined,
    clienteIds: appliedFilters.clienteIds.length > 0 ? appliedFilters.clienteIds : undefined,
    categoria: appliedFilters.categoria || undefined,
    search: globalFilter || undefined,
  })

  // Función para aplicar filtros
  const handleApplyFilters = () => {
    setAppliedFilters({
      fechaInicio: tempFechaInicio,
      fechaFin: tempFechaFin,
      clienteIds: tempClienteIds,
      categoria: tempCategoria,
    })
  }

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setTempFechaInicio("")
    setTempFechaFin("")
    setTempClienteIds([])
    setTempCategoria("")
    setAppliedFilters({
      fechaInicio: "",
      fechaFin: "",
      clienteIds: [],
      categoria: "",
    })
    setGlobalFilter("")
  }

  // Definir columnas
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: "Producto",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductAvatar name={row.original.nombre} />
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">{row.original.nombre}</span>
              <span className="text-xs text-gray-500">{row.original.sku}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "categoria",
        header: "Categoría",
        cell: ({ row }) => (
          <Badge color="gray" className="!font-medium">
            {row.original.categoria}
          </Badge>
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
        accessorKey: "num_clientes",
        header: "# Clientes",
        cell: ({ row }) => <span className="text-gray-700">{row.original.num_clientes}</span>,
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
        accessorKey: "ultima_venta",
        header: "Última Venta",
        cell: ({ row }) => {
          if (!row.original.ultima_venta) return <span className="text-gray-400">-</span>
          return (
            <div className="flex flex-col">
              <span className="text-sm text-gray-900">
                {new Date(row.original.ultima_venta).toLocaleDateString("es-MX")}
              </span>
              {row.original.dias_desde_ultima_venta !== null && (
                <span className="text-xs text-gray-500">
                  Hace {row.original.dias_desde_ultima_venta} días
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
    data: products || [],
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
    if (!products || products.length === 0) return

    const headers = [
      "Producto",
      "SKU",
      "Categoría",
      "Status",
      "Clasificación",
      "Ventas",
      "Unidades",
      "Variación %",
      "# Clientes",
      "Órdenes",
      "Ticket Promedio",
      "Última Venta",
      "Tendencia",
      "LTV",
    ]

    const rows = products.map((p) => [
      p.nombre,
      p.sku,
      p.categoria,
      p.status,
      p.clasificacion,
      p.total_ventas_periodo,
      p.total_unidades_periodo,
      p.variacion_ventas_pct,
      p.num_clientes,
      p.num_ordenes,
      p.ticket_promedio,
      p.ultima_venta || "",
      p.tendencia,
      p.lifetime_value,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `productos_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-[1800px] mx-auto p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Productos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona y analiza el rendimiento de tus productos
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-md !rounded-2xl !p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fecha Inicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={tempFechaInicio}
                  onChange={(e) => setTempFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={tempFechaFin}
                  onChange={(e) => setTempFechaFin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Clientes Multiselect */}
              <div>
                <MultiSelect
                  label="Clientes"
                  options={clientesOptions || []}
                  selected={tempClienteIds}
                  onChange={setTempClienteIds}
                  placeholder="Seleccionar clientes..."
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={tempCategoria}
                  onChange={(e) => setTempCategoria(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {categoriasOptions?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3 justify-end">
              <Button onClick={handleClearFilters} variant="secondary" className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700">
                Limpiar Filtros
              </Button>
              <Button onClick={handleApplyFilters} className="!bg-[#007BFF] hover:!bg-[#0056b3] !text-white">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Productos Activos */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Productos Activos
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      kpis?.total_productos_activos || 0
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#007BFF] to-[#0056b3] flex items-center justify-center shadow-lg flex-shrink-0">
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
              {kpis && (
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                      kpis.variacion_activos_pct >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {kpis.variacion_activos_pct >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(kpis.variacion_activos_pct).toFixed(1)}%
                  </div>
                  <Text className="!text-xs !text-gray-500 truncate">vs período anterior</Text>
                </div>
              )}
            </div>
          </Card>

          {/* Productos Nuevos */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Productos Nuevos
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      kpis?.productos_nuevos_periodo || 0
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <PackagePlus className="h-5 w-5 text-white" />
                </div>
              </div>
              {kpis && (
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                      kpis.variacion_nuevos_pct >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {kpis.variacion_nuevos_pct >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(kpis.variacion_nuevos_pct).toFixed(1)}%
                  </div>
                  <Text className="!text-xs !text-gray-500 truncate">vs período anterior</Text>
                </div>
              )}
            </div>
          </Card>

          {/* Productos en Riesgo */}
          <Card className="!bg-white !border-0 !ring-1 !ring-red-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    En Riesgo
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      kpis?.productos_en_riesgo || 0
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <Text className="!text-xs !text-gray-500 mt-auto pt-2 border-t border-gray-100 truncate">
                Sin vender 60+ días
              </Text>
            </div>
          </Card>

          {/* Revenue Promedio por Producto */}
          <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg hover:!shadow-xl transition-all duration-300 !rounded-2xl overflow-hidden group !p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <Text className="!text-xs !font-medium !text-gray-500 uppercase tracking-wide truncate !mb-0">
                    Revenue Prom/Producto
                  </Text>
                  <Metric className="!text-lg !font-bold !text-gray-900 !mt-2 !mb-0">
                    {kpisLoading ? (
                      <span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <span className="block truncate">
                        {formatCurrency(kpis?.revenue_promedio_producto || 0)}
                      </span>
                    )}
                  </Metric>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#284389] to-[#1a2f5f] flex items-center justify-center shadow-lg flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              {kpis && (
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                      kpis.variacion_revenue_pct >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {kpis.variacion_revenue_pct >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(kpis.variacion_revenue_pct).toFixed(1)}%
                  </div>
                  <Text className="!text-xs !text-gray-500 truncate">vs período anterior</Text>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Tabla */}
        <Card className="!bg-white !border-0 !ring-1 !ring-gray-200 !shadow-lg !rounded-2xl overflow-hidden !p-0">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={exportToCSV}
                  disabled={!products || products.length === 0}
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
            {productsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                  <div className="animate-spin h-10 w-10 border-4 border-[#007BFF] border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-gray-500">Cargando productos...</p>
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
                        onClick={() => setSelectedProductId(row.original.producto_id)}
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
                    de {table.getFilteredRowModel().rows.length} productos
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
        </Card>
      </div>

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          tenantId={TENANT_ID}
          productoId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  )
}
