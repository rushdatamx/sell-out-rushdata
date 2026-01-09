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
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import Image from "next/image"
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Download, Tag, Store, Package, X } from "lucide-react"

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

import { useActiveRetailer } from "@/components/retailer/retailer-context"
import { getRetailerConfig, getRetailerLogo } from "@/lib/retailers/config"
import {
  useProductosFiltros,
  useProductosKpis,
  useProductosTabla,
  Producto,
} from "@/hooks/use-productos"
import { ProductosParetoChart } from "@/components/charts/productos-pareto-chart"
import { ProductosVariacionChart } from "@/components/charts/productos-variacion-chart"
import { DateRangePickerNotion } from "@/components/ui/date-range-picker-notion"
import { MonthRangePicker } from "@/components/ui/month-range-picker"
import { MultiSelectFilter, FilterOption } from "@/components/ui/multi-select-filter"

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

export default function RetailerProductosPage() {
  const { retailer, isLoading: isLoadingRetailer } = useActiveRetailer()
  const retailerId = retailer?.id || null

  // Estado de filtros - inicialmente undefined, se actualizará cuando tengamos los filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = useState<string[]>([])
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
  const tiendaIds = tiendasSeleccionadas.map(id => parseInt(id))
  const productoIds = productosSeleccionados.map(id => parseInt(id))

  // Debounce busqueda
  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)
    setTimeout(() => setDebouncedBusqueda(value), 300)
  }

  // Queries con retailerId
  const { data: filtros } = useProductosFiltros(retailerId)

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
  const { data: kpis, isLoading: isLoadingKpis } = useProductosKpis(
    fechaInicio,
    fechaFin,
    categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null,
    tiendaIds.length > 0 ? tiendaIds : null,
    productoIds.length > 0 ? productoIds : null,
    retailerId
  )
  const { data: tablaData, isLoading: isLoadingTabla } = useProductosTabla(
    fechaInicio,
    fechaFin,
    categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null,
    tiendaIds.length > 0 ? tiendaIds : null,
    productoIds.length > 0 ? productoIds : null,
    debouncedBusqueda || null,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
    sorting[0]?.id || "ventas",
    sorting[0]?.desc ? "desc" : "asc",
    retailerId
  )

  // Opciones para los filtros
  const categoriaOptions: FilterOption[] = useMemo(() =>
    filtros?.categorias?.map(cat => ({ value: cat, label: cat })) || []
  , [filtros?.categorias])

  const tiendaOptions: FilterOption[] = useMemo(() =>
    filtros?.tiendas?.map(t => ({
      value: t.id.toString(),
      label: t.nombre,
      sublabel: t.ciudad
    })) || []
  , [filtros?.tiendas])

  const productoOptions: FilterOption[] = useMemo(() =>
    filtros?.productos?.map(p => ({
      value: p.id.toString(),
      label: p.nombre,
      sublabel: p.upc
    })) || []
  , [filtros?.productos])

  // Verificar si hay filtros activos
  const hasActiveFilters = categoriasSeleccionadas.length > 0 ||
    tiendasSeleccionadas.length > 0 ||
    productosSeleccionados.length > 0

  const clearAllFilters = () => {
    setCategoriasSeleccionadas([])
    setTiendasSeleccionadas([])
    setProductosSeleccionados([])
  }

  // Columnas de la tabla
  const columns: ColumnDef<Producto>[] = useMemo(() => [
    {
      accessorKey: "nombre",
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
        <div>
          <div className="font-medium">{row.original.nombre}</div>
          <div className="text-xs text-muted-foreground">{row.original.upc}</div>
        </div>
      ),
    },
    {
      accessorKey: "categoria",
      header: "Categoria",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md bg-slate-100 text-xs font-medium">
          {row.original.categoria || "-"}
        </span>
      ),
    },
    {
      accessorKey: "marca",
      header: "Marca",
      cell: ({ row }) => row.original.marca || "-",
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
      accessorKey: "precio_promedio",
      header: "Precio Prom.",
      cell: ({ row }) => (
        <div className="text-right">
          ${row.original.precio_promedio.toFixed(2)}
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
      accessorKey: "num_tiendas",
      header: "# Tiendas",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.num_tiendas}
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data: tablaData?.productos || [],
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
      title: "SKUs Activos",
      value: kpis ? formatNumber(kpis.skus_activos) : "-",
      subtitle: "Productos con venta en el periodo",
    },
    {
      title: "Venta Total",
      value: kpis ? formatCurrency(kpis.venta_total) : "-",
      subtitle: "Ventas del periodo seleccionado",
    },
    {
      title: "Unidades Vendidas",
      value: kpis ? formatNumber(kpis.unidades_vendidas) : "-",
      subtitle: "Total de unidades",
    },
    {
      title: "Ticket Promedio",
      value: kpis ? formatCurrency(kpis.ticket_promedio) : "-",
      subtitle: "Venta promedio por SKU",
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
      <div className="sticky-header-blur flex items-center gap-4">
        {retailer && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: `${retailer.color_hex}20` }}
          >
            {getRetailerLogo(retailer.codigo) ? (
              <Image
                src={getRetailerLogo(retailer.codigo)!}
                alt={`Logo ${retailer.nombre}`}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <Package className="w-6 h-6" style={{ color: retailer.color_hex }} />
            )}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Productos - {retailer?.nombre || ""}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Analisis de rendimiento de productos
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-soft" />
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="rounded-2xl overflow-hidden hover-lift group">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground font-medium">
                {kpi.title}
              </p>
              {isLoadingKpis ? (
                <div className="mt-2 space-y-2">
                  <div className="skeleton-shimmer h-10 w-32" />
                  <div className="skeleton-shimmer h-4 w-24" />
                </div>
              ) : (
                <>
                  <p className="text-2xl premium-number mt-2 transition-all duration-300">
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

      {/* Filtros - Notion Style */}
      <Card className="rounded-2xl border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Date Range Picker - Condicional según granularidad */}
            {granularidad === 'mensual' ? (
              <MonthRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                minDate={filtros?.fecha_min ? new Date(filtros.fecha_min) : undefined}
                maxDate={filtros?.fecha_max ? new Date(filtros.fecha_max) : undefined}
              />
            ) : (
              <DateRangePickerNotion
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                minDate={filtros?.fecha_min ? new Date(filtros.fecha_min) : undefined}
                maxDate={filtros?.fecha_max ? new Date(filtros.fecha_max) : undefined}
              />
            )}

            {/* Categoria Multiselect */}
            <MultiSelectFilter
              title="Categoria"
              icon={<Tag className="h-4 w-4" />}
              options={categoriaOptions}
              selectedValues={categoriasSeleccionadas}
              onSelectionChange={setCategoriasSeleccionadas}
              searchPlaceholder="Buscar categoria..."
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

            {/* Busqueda */}
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

      {/* Tabla */}
      <Card className="rounded-2xl hover-lift">
        <CardHeader className="pb-3">
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            {tablaData?.total || 0} productos encontrados
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
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {!isLoadingTabla && tablaData?.productos && tablaData.productos.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={3}>
                      <span className="font-semibold">Total ({tablaData.total} productos)</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(tablaData.productos.reduce((sum, p) => sum + p.ventas, 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(tablaData.productos.reduce((sum, p) => sum + p.unidades, 0))}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right font-semibold">
                      {tablaData.productos.reduce((sum, p) => sum + p.participacion, 0).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {/* Paginacion */}
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
        <ProductosParetoChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          categorias={categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null}
          tiendaIds={tiendaIds.length > 0 ? tiendaIds : null}
          productoIds={productoIds.length > 0 ? productoIds : null}
          retailerId={retailerId}
        />
        <div className="space-y-6">
          <ProductosVariacionChart
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            tipo="crecimiento"
            categorias={categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null}
            tiendaIds={tiendaIds.length > 0 ? tiendaIds : null}
            productoIds={productoIds.length > 0 ? productoIds : null}
            retailerId={retailerId}
          />
          <ProductosVariacionChart
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            tipo="caida"
            categorias={categoriasSeleccionadas.length > 0 ? categoriasSeleccionadas : null}
            tiendaIds={tiendaIds.length > 0 ? tiendaIds : null}
            productoIds={productoIds.length > 0 ? productoIds : null}
            retailerId={retailerId}
          />
        </div>
      </div>
    </div>
  )
}
