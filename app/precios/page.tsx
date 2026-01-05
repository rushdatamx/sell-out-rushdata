"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Search,
  Download,
  MapPin,
  Package,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  AlertCircle,
  Store,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import {
  usePreciosFiltros,
  usePreciosKpis,
  usePreciosDetalle,
  PrecioDetalle,
} from "@/hooks/use-precios"
import { DateRangePickerNotion } from "@/components/ui/date-range-picker-notion"
import { MultiSelectFilter, FilterOption } from "@/components/ui/multi-select-filter"
import { PreciosDispersionChart } from "@/components/charts/precios-dispersion-chart"
import { PreciosEvolucionChart } from "@/components/charts/precios-evolucion-chart"
import { PreciosAlertasCard } from "@/components/charts/precios-alertas-card"
import { PreciosPorCiudadChart } from "@/components/charts/precios-por-ciudad-chart"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export default function PreciosPage() {
  // Estado de filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<string[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([])
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState<string>("")
  const [debouncedBusqueda, setDebouncedBusqueda] = useState<string>("")

  // Estado de tabla
  const [sorting, setSorting] = useState<SortingState>([{ id: "coef_variacion", desc: true }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  // Convertir fechas a string para las queries
  const fechaInicio = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null
  const fechaFin = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null

  // Convertir selecciones a arrays de IDs
  const productoIds = productosSeleccionados.map(id => parseInt(id))
  const tiendaIds = tiendasSeleccionadas.map(id => parseInt(id))

  // Debounce búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)
    setTimeout(() => setDebouncedBusqueda(value), 300)
  }

  // Queries
  const { data: filtros } = usePreciosFiltros()
  const { data: kpis, isLoading: isLoadingKpis } = usePreciosKpis(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    productoIds.length > 0 ? productoIds : null
  )
  const { data: tablaData, isLoading: isLoadingTabla } = usePreciosDetalle(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    productoIds.length > 0 ? productoIds : null,
    tiendaIds.length > 0 ? tiendaIds : null,
    debouncedBusqueda || null,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
    sorting[0]?.id || "coef_variacion",
    sorting[0]?.desc ? "desc" : "asc"
  )

  // Opciones para los filtros
  const ciudadOptions: FilterOption[] = useMemo(() =>
    filtros?.ciudades?.map(ciudad => ({ value: ciudad, label: ciudad })) || []
  , [filtros?.ciudades])

  const productoOptions: FilterOption[] = useMemo(() =>
    filtros?.productos?.map(p => ({
      value: p.id.toString(),
      label: p.nombre,
      sublabel: p.categoria
    })) || []
  , [filtros?.productos])

  const tiendaOptions: FilterOption[] = useMemo(() =>
    filtros?.tiendas?.map(t => ({
      value: t.id.toString(),
      label: t.nombre,
      sublabel: t.ciudad
    })) || []
  , [filtros?.tiendas])

  // Verificar si hay filtros activos
  const hasActiveFilters = ciudadesSeleccionadas.length > 0 ||
    productosSeleccionados.length > 0 ||
    tiendasSeleccionadas.length > 0

  const clearAllFilters = () => {
    setCiudadesSeleccionadas([])
    setProductosSeleccionados([])
    setTiendasSeleccionadas([])
  }

  // Columnas de la tabla
  const columns: ColumnDef<PrecioDetalle>[] = useMemo(() => [
    {
      accessorKey: "producto",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Producto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.producto}</div>
      ),
    },
    {
      accessorKey: "tienda",
      header: "Tienda",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.tienda}</div>
          <div className="text-xs text-muted-foreground">{row.original.ciudad}</div>
        </div>
      ),
    },
    {
      accessorKey: "precio_promedio",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Precio Prom.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.precio_promedio)}
        </div>
      ),
    },
    {
      accessorKey: "precio_min",
      header: "Mín",
      cell: ({ row }) => (
        <div className="text-right text-sm text-green-600">
          {formatCurrency(row.original.precio_min)}
        </div>
      ),
    },
    {
      accessorKey: "precio_max",
      header: "Máx",
      cell: ({ row }) => (
        <div className="text-right text-sm text-red-500">
          {formatCurrency(row.original.precio_max)}
        </div>
      ),
    },
    {
      accessorKey: "rango",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Rango
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className={cn(
          "text-right font-medium",
          row.original.rango > 20 && "text-amber-600"
        )}>
          {formatCurrency(row.original.rango)}
        </div>
      ),
    },
    {
      accessorKey: "coef_variacion",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          CV%
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const cv = row.original.coef_variacion
        return (
          <div className="flex justify-center">
            <Badge
              variant={cv > 15 ? "destructive" : cv > 8 ? "secondary" : "outline"}
              className={cn(
                cv > 15 && "bg-red-500",
                cv > 8 && cv <= 15 && "bg-amber-500 text-white",
                cv <= 8 && "bg-green-100 text-green-800"
              )}
            >
              {formatPercent(cv)}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "transacciones",
      header: "Trans.",
      cell: ({ row }) => (
        <div className="text-center text-sm text-muted-foreground">
          {formatNumber(row.original.transacciones)}
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data: tablaData?.data || [],
    columns,
    pageCount: Math.ceil((tablaData?.total || 0) / pagination.pageSize),
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const kpiCards = [
    {
      title: "Precio Promedio",
      value: kpis ? formatCurrency(kpis.precio_promedio) : "-",
      subtitle: `${kpis?.productos_analizados || 0} productos`,
      icon: <DollarSign className="h-5 w-5" />,
      color: "blue",
    },
    {
      title: "Dispersión Promedio",
      value: kpis ? formatPercent(kpis.dispersion_promedio_pct) : "-",
      subtitle: "Coef. de variación promedio",
      icon: <Activity className="h-5 w-5" />,
      color: "purple",
      alert: kpis && kpis.dispersion_promedio_pct > 15,
    },
    {
      title: "Alta Dispersión",
      value: kpis ? formatNumber(kpis.productos_alta_dispersion) : "-",
      subtitle: "Productos con CV > 20%",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "amber",
      alert: kpis && kpis.productos_alta_dispersion > 3,
    },
    {
      title: "Anomalías",
      value: kpis ? formatNumber(kpis.combinaciones_anomalas) : "-",
      subtitle: "Combinaciones producto-tienda",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "red",
      alert: kpis && kpis.combinaciones_anomalas > 5,
    },
    {
      title: "Tiendas",
      value: kpis ? formatNumber(kpis.tiendas_analizadas) : "-",
      subtitle: "Con datos de precio",
      icon: <Store className="h-5 w-5" />,
      color: "cyan",
    },
    {
      title: "Transacciones",
      value: kpis ? formatNumber(kpis.total_transacciones) : "-",
      subtitle: "En el período",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "green",
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6 premium-bg gradient-overlay min-h-screen">
      {/* Header */}
      <div className="sticky-header-blur flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Precios</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Análisis de consistencia y dispersión de precios
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-soft" />
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className={cn(
            "rounded-2xl overflow-hidden hover-lift group",
            kpi.alert && "border-red-300 bg-red-50/50"
          )}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {kpi.title}
                </p>
                <div className={cn(
                  "p-1.5 rounded-lg",
                  kpi.color === "blue" && "bg-blue-100 text-blue-600",
                  kpi.color === "purple" && "bg-purple-100 text-purple-600",
                  kpi.color === "cyan" && "bg-cyan-100 text-cyan-600",
                  kpi.color === "green" && "bg-green-100 text-green-600",
                  kpi.color === "amber" && "bg-amber-100 text-amber-600",
                  kpi.color === "red" && "bg-red-100 text-red-600",
                )}>
                  {kpi.icon}
                </div>
              </div>
              {isLoadingKpis ? (
                <div className="space-y-2">
                  <div className="skeleton-shimmer h-8 w-20" />
                  <div className="skeleton-shimmer h-3 w-24" />
                </div>
              ) : (
                <>
                  <p className={cn(
                    "text-2xl premium-number transition-all duration-300",
                    kpi.alert ? "text-red-600" : "gradient-text"
                  )}>
                    {kpi.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {kpi.subtitle}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="rounded-2xl border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Date Range Picker */}
            <DateRangePickerNotion
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              minDate={filtros?.fecha_min ? new Date(filtros.fecha_min) : undefined}
              maxDate={filtros?.fecha_max ? new Date(filtros.fecha_max) : undefined}
            />

            {/* Ciudad Multiselect */}
            <MultiSelectFilter
              title="Ciudad"
              icon={<MapPin className="h-4 w-4" />}
              options={ciudadOptions}
              selectedValues={ciudadesSeleccionadas}
              onSelectionChange={setCiudadesSeleccionadas}
              searchPlaceholder="Buscar ciudad..."
            />

            {/* Producto Multiselect */}
            <MultiSelectFilter
              title="Producto"
              icon={<Package className="h-4 w-4" />}
              options={productoOptions}
              selectedValues={productosSeleccionados}
              onSelectionChange={setProductosSeleccionados}
              searchPlaceholder="Buscar producto..."
            />

            {/* Tienda Multiselect */}
            <MultiSelectFilter
              title="Tienda"
              icon={<Store className="h-4 w-4" />}
              options={tiendaOptions}
              selectedValues={tiendasSeleccionadas}
              onSelectionChange={setTiendasSeleccionadas}
              searchPlaceholder="Buscar tienda..."
            />

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}

            {/* Separador */}
            <div className="flex-1" />

            {/* Búsqueda */}
            <div className="relative min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                className="pl-9 h-9 rounded-lg"
              />
            </div>

            {/* Exportar */}
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficas Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <PreciosDispersionChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
        />
        <PreciosPorCiudadChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          productoIds={productoIds.length > 0 ? productoIds : null}
        />
      </div>

      {/* Gráficas Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <PreciosEvolucionChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
        />
        <PreciosAlertasCard
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
        />
      </div>

      {/* Tabla */}
      <Card className="rounded-2xl hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Detalle de Precios por Producto-Tienda
          </CardTitle>
          <CardDescription>
            {tablaData?.total || 0} combinaciones • CV% = Coeficiente de Variación (dispersión)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-slate-50/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoadingTabla ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <div className="skeleton-shimmer h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No se encontraron registros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {pagination.pageIndex * pagination.pageSize + 1} - {Math.min((pagination.pageIndex + 1) * pagination.pageSize, tablaData?.total || 0)} de {tablaData?.total || 0}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
