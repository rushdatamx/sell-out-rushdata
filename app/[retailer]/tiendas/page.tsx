"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { format, subDays, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Download, MapPin, Layers, Tag, Package, X, AlertTriangle, Store } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import {
  useTiendasFiltros,
  useTiendasKpis,
  useTiendasTabla,
  Tienda,
} from "@/hooks/use-tiendas"
import { DateRangePickerNotion } from "@/components/ui/date-range-picker-notion"
import { MultiSelectFilter, FilterOption } from "@/components/ui/multi-select-filter"
import { VentasPorCiudadChart } from "@/components/charts/ventas-por-ciudad-chart"
import { TiendasRankingChart } from "@/components/charts/tiendas-ranking-chart"
import { useActiveRetailer } from "@/components/retailer/retailer-context"
import { getRetailerConfig } from "@/lib/retailers/config"

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export default function RetailerTiendasPage() {
  const { retailer, isLoading: isLoadingRetailer } = useActiveRetailer()
  const retailerId = retailer?.id || null

  // Estado de filtros - inicialmente undefined, se actualizará cuando tengamos los filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<string[]>([])
  const [clustersSeleccionados, setClustersSeleccionados] = useState<string[]>([])
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState<string>("")
  const [debouncedBusqueda, setDebouncedBusqueda] = useState<string>("")

  // Estado de tabla
  const [sorting, setSorting] = useState<SortingState>([{ id: "ventas", desc: true }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  // Convertir fechas a string para las queries
  const fechaInicio = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null
  const fechaFin = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null

  // Convertir selecciones a arrays de IDs
  const productoIds = productosSeleccionados.map(id => parseInt(id))

  // Debounce búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)
    setTimeout(() => setDebouncedBusqueda(value), 300)
  }

  // Queries con retailerId
  const { data: filtros } = useTiendasFiltros(retailerId)

  // Obtener configuración del retailer para determinar granularidad
  const config = retailer ? getRetailerConfig(retailer.codigo) : null
  const granularidad = config?.periodos?.granularidadMinima || 'diaria'

  // Establecer rango de fechas inicial según granularidad del retailer
  useEffect(() => {
    if (filtros?.fecha_max && filtros?.fecha_min && !dateRange) {
      const fechaMax = new Date(filtros.fecha_max)
      const fechaMin = new Date(filtros.fecha_min)

      let fechaInicio: Date

      if (granularidad === 'mensual') {
        // Para datos mensuales: últimos 3 meses para tener comparativo
        fechaInicio = subMonths(fechaMax, 3)
      } else {
        // Para datos diarios/semanales: últimos 30 días
        fechaInicio = subDays(fechaMax, 30)
      }

      // Asegurar que no sea antes de fecha_min
      if (fechaInicio < fechaMin) {
        fechaInicio = fechaMin
      }

      setDateRange({
        from: fechaInicio,
        to: fechaMax,
      })
    }
  }, [filtros?.fecha_max, filtros?.fecha_min, dateRange, granularidad])
  const { data: kpis, isLoading: isLoadingKpis } = useTiendasKpis(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    clustersSeleccionados.length > 0 ? clustersSeleccionados : null,
    categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null,
    productoIds.length > 0 ? productoIds : null,
    retailerId
  )
  const { data: tablaData, isLoading: isLoadingTabla } = useTiendasTabla(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    clustersSeleccionados.length > 0 ? clustersSeleccionados : null,
    categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null,
    productoIds.length > 0 ? productoIds : null,
    debouncedBusqueda || null,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
    sorting[0]?.id || "ventas",
    sorting[0]?.desc ? "desc" : "asc",
    retailerId
  )

  // Opciones para los filtros
  const ciudadOptions: FilterOption[] = useMemo(() =>
    filtros?.ciudades?.map(ciudad => ({ value: ciudad, label: ciudad })) || []
  , [filtros?.ciudades])

  const clusterOptions: FilterOption[] = useMemo(() =>
    filtros?.clusters?.map(cluster => ({ value: cluster, label: cluster })) || []
  , [filtros?.clusters])

  const categoriaOptions: FilterOption[] = useMemo(() =>
    filtros?.categorias?.map(cat => ({ value: cat, label: cat })) || []
  , [filtros?.categorias])

  const productoOptions: FilterOption[] = useMemo(() =>
    filtros?.productos?.map(p => ({
      value: p.id.toString(),
      label: p.nombre,
      sublabel: p.upc
    })) || []
  , [filtros?.productos])

  // Verificar si hay filtros activos
  const hasActiveFilters = ciudadesSeleccionadas.length > 0 ||
    clustersSeleccionados.length > 0 ||
    categoriasSeleccionadas.length > 0 ||
    productosSeleccionados.length > 0

  const clearAllFilters = () => {
    setCiudadesSeleccionadas([])
    setClustersSeleccionados([])
    setCategoriasSeleccionadas([])
    setProductosSeleccionados([])
  }

  // Columnas de la tabla
  const columns: ColumnDef<Tienda>[] = useMemo(() => [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Tienda
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nombre}</div>
          <div className="text-xs text-muted-foreground">#{row.original.codigo_tienda}</div>
        </div>
      ),
    },
    {
      accessorKey: "ciudad",
      header: "Ciudad",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium">
          {row.original.ciudad || "-"}
        </span>
      ),
    },
    {
      accessorKey: "cluster",
      header: "Cluster",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md bg-slate-100 text-xs font-medium">
          {row.original.cluster || "-"}
        </span>
      ),
    },
    {
      accessorKey: "ventas",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Ventas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-medium">{formatCurrency(row.original.ventas)}</div>
          <div className="text-xs text-muted-foreground">
            Ant: {formatCurrency(row.original.ventas_anterior)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "unidades",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Unidades
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <div>{formatNumber(row.original.unidades)}</div>
          <div className="text-xs text-muted-foreground">
            Ant: {formatNumber(row.original.unidades_anterior)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "skus_activos",
      header: "SKUs",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.skus_activos}
        </div>
      ),
    },
    {
      accessorKey: "participacion",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          % Part.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.participacion.toFixed(2)}%
        </div>
      ),
    },
    {
      accessorKey: "variacion",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Var. %
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const variacion = row.original.variacion
        const isPositive = variacion > 0
        const isNegative = variacion < 0
        return (
          <div className="text-right">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              isPositive
                ? "bg-green-100 text-green-700"
                : isNegative
                  ? "bg-red-100 text-red-600"
                  : "bg-slate-100 text-slate-600"
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
              {formatPercent(variacion)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "dias_quiebre",
      header: "Días OOS",
      cell: ({ row }) => {
        const dias = row.original.dias_quiebre
        return (
          <div className={cn(
            "text-center font-medium",
            dias > 0 && "text-amber-600"
          )}>
            {dias > 0 && <AlertTriangle className="h-3 w-3 inline mr-1" />}
            {dias}
          </div>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: tablaData?.tiendas || [],
    columns,
    pageCount: Math.ceil((tablaData?.total || 0) / pagination.pageSize),
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const kpiCards = [
    {
      title: "Tiendas Activas",
      value: kpis ? formatNumber(kpis.tiendas_activas) : "-",
      subtitle: "Con venta en el período",
    },
    {
      title: "Venta Total",
      value: kpis ? formatCurrency(kpis.venta_total) : "-",
      subtitle: "Ventas del período",
    },
    {
      title: "Venta Prom. / Tienda",
      value: kpis ? formatCurrency(kpis.venta_promedio_tienda) : "-",
      subtitle: "Promedio por punto de venta",
    },
    {
      title: "Tiendas con Quiebre",
      value: kpis ? formatNumber(kpis.tiendas_con_quiebre) : "-",
      subtitle: "Con OOS en el período",
      alert: kpis && kpis.tiendas_con_quiebre > 0,
    },
  ]

  if (isLoadingRetailer) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 premium-bg gradient-overlay min-h-screen">
      {/* Header */}
      <div className="sticky-header-blur flex items-center justify-between">
        <div className="flex items-center gap-4">
          {retailer && (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${retailer.color_hex}20` }}
            >
              <Store className="w-6 h-6" style={{ color: retailer.color_hex }} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tiendas - {retailer?.nombre || ""}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Análisis de rendimiento por sucursal
              <span className="w-2 h-2 rounded-full bg-green-500 pulse-soft" />
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className={cn(
            "rounded-2xl overflow-hidden hover-lift group",
            kpi.alert && "border-amber-300 bg-amber-50/50"
          )}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                {kpi.title}
                {kpi.alert && <AlertTriangle className="h-4 w-4 text-amber-500" />}
              </p>
              {isLoadingKpis ? (
                <div className="mt-2 space-y-2">
                  <div className="skeleton-shimmer h-10 w-32" />
                  <div className="skeleton-shimmer h-4 w-24" />
                </div>
              ) : (
                <>
                  <p className={cn(
                    "text-4xl premium-number mt-2 transition-all duration-300",
                    kpi.alert ? "text-amber-600" : "gradient-text group-hover:glow-blue"
                  )}>
                    {kpi.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
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

            {/* Cluster Multiselect */}
            <MultiSelectFilter
              title="Cluster"
              icon={<Layers className="h-4 w-4" />}
              options={clusterOptions}
              selectedValues={clustersSeleccionados}
              onSelectionChange={setClustersSeleccionados}
              searchPlaceholder="Buscar cluster..."
            />

            {/* Categoría Multiselect */}
            <MultiSelectFilter
              title="Categoría"
              icon={<Tag className="h-4 w-4" />}
              options={categoriaOptions}
              selectedValues={categoriasSeleccionadas}
              onSelectionChange={setCategoriasSeleccionadas}
              searchPlaceholder="Buscar categoría..."
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
                placeholder="Buscar tienda..."
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

      {/* Tabla */}
      <Card className="rounded-2xl hover-lift">
        <CardHeader className="pb-3">
          <CardTitle>Lista de Tiendas</CardTitle>
          <CardDescription>
            {tablaData?.total || 0} tiendas encontradas
            {kpis?.fecha_inicio && kpis?.fecha_fin && (
              <span className="ml-2">
                ({format(new Date(kpis.fecha_inicio), "dd MMM yyyy", { locale: es })} - {format(new Date(kpis.fecha_fin), "dd MMM yyyy", { locale: es })})
              </span>
            )}
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
                      No se encontraron tiendas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {!isLoadingTabla && tablaData?.tiendas && tablaData.tiendas.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={3}>
                      <span className="font-semibold">Total ({tablaData.total} tiendas)</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(tablaData.tiendas.reduce((sum, t) => sum + t.ventas, 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(tablaData.tiendas.reduce((sum, t) => sum + t.unidades, 0))}
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right font-semibold">
                      {tablaData.tiendas.reduce((sum, t) => sum + t.participacion, 0).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-center font-semibold">
                      {tablaData.tiendas.reduce((sum, t) => sum + t.dias_quiebre, 0)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
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

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <VentasPorCiudadChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
          clusters={clustersSeleccionados.length > 0 ? clustersSeleccionados : null}
          categorias={categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null}
          productoIds={productoIds.length > 0 ? productoIds : null}
          retailerId={retailerId}
        />
        <TiendasRankingChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
          clusters={clustersSeleccionados.length > 0 ? clustersSeleccionados : null}
          categorias={categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null}
          productoIds={productoIds.length > 0 ? productoIds : null}
          tipo="top"
          retailerId={retailerId}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TiendasRankingChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
          clusters={clustersSeleccionados.length > 0 ? clustersSeleccionados : null}
          categorias={categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null}
          productoIds={productoIds.length > 0 ? productoIds : null}
          tipo="bottom"
          retailerId={retailerId}
        />
        <Card className="rounded-2xl overflow-hidden relative hover-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/8 via-[#06B6D4]/5 to-transparent" />
          <CardContent className="pt-6 h-full flex flex-col justify-center relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Cobertura Promedio</h3>
                <p className="text-5xl premium-number gradient-text glow-blue">
                  {kpis && tablaData?.tiendas ?
                    `${Math.round(tablaData.tiendas.reduce((sum, t) => sum + t.skus_activos, 0) / tablaData.tiendas.length)} SKUs`
                    : "-"
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  Promedio de SKUs por tienda
                </p>
                {kpis && (
                  <div className="mt-5 space-y-2">
                    <p className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
                      <span className="text-muted-foreground">Tiendas activas:</span>
                      <span className="font-semibold">{formatNumber(kpis.tiendas_activas)}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Con quiebre:</span>
                      <span className="font-semibold">{formatNumber(kpis.tiendas_con_quiebre)}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-[#0066FF]/20 to-[#06B6D4]/10 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(0,102,255,0.3)]">
                <MapPin className="h-14 w-14 text-[#0066FF]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
