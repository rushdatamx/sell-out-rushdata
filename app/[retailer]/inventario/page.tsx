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
import Image from "next/image"
import {
  ArrowUpDown,
  Search,
  Download,
  MapPin,
  Store,
  Package,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  useInventarioFiltros,
  useInventarioKpis,
  useInventarioTabla,
  InventarioItem,
} from "@/hooks/use-inventario"
import { DateRangePickerNotion } from "@/components/ui/date-range-picker-notion"
import { MultiSelectFilter, FilterOption } from "@/components/ui/multi-select-filter"
import { InventarioAlertasCard } from "@/components/charts/inventario-alertas-card"
import { InventarioVentaPerdidaChart } from "@/components/charts/inventario-venta-perdida-chart"
import { InventarioEvolucionChart } from "@/components/charts/inventario-evolucion-chart"
import { useActiveRetailer } from "@/components/retailer/retailer-context"
import { getRetailerLogo } from "@/lib/retailers/config"

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
  return `${value.toFixed(1)}%`
}

export default function RetailerInventarioPage() {
  const { retailer, isLoading: isLoadingRetailer } = useActiveRetailer()
  const retailerId = retailer?.id || null

  // Estado de filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<string[]>([])
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = useState<string[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([])
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [debouncedBusqueda, setDebouncedBusqueda] = useState<string>("")

  // Estado de tabla
  const [sorting, setSorting] = useState<SortingState>([{ id: "dias_oos", desc: true }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  // Convertir fechas a string para las queries
  const fechaInicio = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null
  const fechaFin = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null

  // Convertir selecciones a arrays de IDs
  const tiendaIds = tiendasSeleccionadas.map(id => parseInt(id))
  const productoIds = productosSeleccionados.map(id => parseInt(id))

  // Debounce búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusqueda(value)
    setTimeout(() => setDebouncedBusqueda(value), 300)
  }

  // Queries con retailerId
  const { data: filtros } = useInventarioFiltros(retailerId)
  const { data: kpis, isLoading: isLoadingKpis } = useInventarioKpis(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    tiendaIds.length > 0 ? tiendaIds : null,
    productoIds.length > 0 ? productoIds : null,
    retailerId
  )
  const { data: tablaData, isLoading: isLoadingTabla } = useInventarioTabla(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    tiendaIds.length > 0 ? tiendaIds : null,
    productoIds.length > 0 ? productoIds : null,
    estadoFiltro !== "todos" ? estadoFiltro : null,
    debouncedBusqueda || null,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
    sorting[0]?.id || "dias_oos",
    sorting[0]?.desc ? "desc" : "asc",
    retailerId
  )

  // Opciones para los filtros
  const ciudadOptions: FilterOption[] = useMemo(() =>
    filtros?.ciudades?.map(ciudad => ({ value: ciudad, label: ciudad })) || []
  , [filtros?.ciudades])

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
  const hasActiveFilters = ciudadesSeleccionadas.length > 0 ||
    tiendasSeleccionadas.length > 0 ||
    productosSeleccionados.length > 0 ||
    estadoFiltro !== "todos"

  const clearAllFilters = () => {
    setCiudadesSeleccionadas([])
    setTiendasSeleccionadas([])
    setProductosSeleccionados([])
    setEstadoFiltro("todos")
  }

  // Columnas de la tabla
  const columns: ColumnDef<InventarioItem>[] = useMemo(() => [
    {
      accessorKey: "producto_nombre",
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
          <div className="font-medium">{row.original.producto_nombre}</div>
          <div className="text-xs text-muted-foreground">{row.original.upc}</div>
        </div>
      ),
    },
    {
      accessorKey: "tienda_nombre",
      header: "Tienda",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.tienda_nombre}</div>
          <div className="text-xs text-muted-foreground">{row.original.ciudad}</div>
        </div>
      ),
    },
    {
      accessorKey: "inventario_actual",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Inventario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className={cn(
          "text-right font-medium",
          row.original.inventario_actual === 0 && "text-red-500"
        )}>
          {formatNumber(row.original.inventario_actual)}
        </div>
      ),
    },
    {
      accessorKey: "dias_oos",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Días OOS
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dias = row.original.dias_oos
        return (
          <div className={cn(
            "text-center font-medium",
            dias > 7 && "text-red-500",
            dias > 3 && dias <= 7 && "text-amber-500"
          )}>
            {dias > 0 && <AlertTriangle className="h-3 w-3 inline mr-1" />}
            {dias}
          </div>
        )
      },
    },
    {
      accessorKey: "venta_perdida",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Venta Perdida
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className={cn(
          "text-right font-medium",
          row.original.venta_perdida > 0 && "text-red-500"
        )}>
          {formatCurrency(row.original.venta_perdida)}
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.original.estado
        return (
          <div className="flex justify-center">
            {estado === "oos" && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                OOS
              </Badge>
            )}
            {estado === "bajo" && (
              <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                <AlertTriangle className="h-3 w-3" />
                Bajo
              </Badge>
            )}
            {estado === "ok" && (
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3" />
                OK
              </Badge>
            )}
          </div>
        )
      },
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
      title: "Registros de Inventario",
      value: kpis ? formatNumber(kpis.total_registros) : "-",
      subtitle: "En el período seleccionado",
    },
    {
      title: "% OOS (Out of Stock)",
      value: kpis ? formatPercent(kpis.pct_oos) : "-",
      subtitle: `${kpis?.registros_oos || 0} registros sin stock`,
      alert: kpis && kpis.pct_oos > 5,
    },
    {
      title: "Venta Perdida Estimada",
      value: kpis ? formatCurrency(kpis.venta_perdida_estimada) : "-",
      subtitle: "Por falta de inventario",
      alert: kpis && kpis.venta_perdida_estimada > 10000,
    },
    {
      title: "Tiendas Afectadas",
      value: kpis ? formatNumber(kpis.tiendas_afectadas) : "-",
      subtitle: "Con al menos 1 día OOS",
      alert: kpis && kpis.tiendas_afectadas > 10,
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
                <AlertTriangle className="w-6 h-6" style={{ color: retailer.color_hex }} />
              )}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventario - {retailer?.nombre || ""}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Control de stock y quiebres (OOS)
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
            kpi.alert && "border-red-300 bg-red-50/50"
          )}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                {kpi.title}
                {kpi.alert && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </p>
              {isLoadingKpis ? (
                <div className="mt-2 space-y-2">
                  <div className="skeleton-shimmer h-10 w-32" />
                  <div className="skeleton-shimmer h-4 w-24" />
                </div>
              ) : (
                <>
                  <p className={cn(
                    "text-2xl premium-number mt-2 transition-all duration-300",
                    kpi.alert && "text-red-600"
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

            {/* Estado Select */}
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-[140px] h-9 rounded-full border-dashed">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ok">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    OK
                  </span>
                </SelectItem>
                <SelectItem value="bajo">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Bajo
                  </span>
                </SelectItem>
                <SelectItem value="oos">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    OOS
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

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

      {/* Alertas y Top Venta Perdida */}
      <div className="grid gap-6 md:grid-cols-2">
        <InventarioAlertasCard
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          retailerId={retailerId}
        />
        <InventarioVentaPerdidaChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
          retailerId={retailerId}
        />
      </div>

      {/* Evolución de Inventario */}
      <InventarioEvolucionChart
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        retailerId={retailerId}
      />

      {/* Tabla */}
      <Card className="rounded-2xl hover-lift">
        <CardHeader className="pb-3">
          <CardTitle>Detalle de Inventario por Producto-Tienda</CardTitle>
          <CardDescription>
            {tablaData?.total || 0} combinaciones encontradas
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
                      No se encontraron registros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {!isLoadingTabla && tablaData?.data && tablaData.data.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={2}>
                      <span className="font-semibold">Total ({tablaData.total} registros)</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(tablaData.data.reduce((sum, i) => sum + i.inventario_actual, 0))}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {tablaData.data.reduce((sum, i) => sum + i.dias_oos, 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-500">
                      {formatCurrency(tablaData.data.reduce((sum, i) => sum + i.venta_perdida, 0))}
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
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
    </div>
  )
}
