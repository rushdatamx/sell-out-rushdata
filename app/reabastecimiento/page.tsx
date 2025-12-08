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
  ShoppingCart,
  Percent,
  Calendar,
  BarChart3,
  Target,
  AlertCircle,
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
  useReabastecimientoFiltros,
  useReabastecimientoKpis,
  useReabastecimientoTabla,
  ReabastecimientoItem,
} from "@/hooks/use-reabastecimiento"
import { DateRangePickerNotion } from "@/components/ui/date-range-picker-notion"
import { MultiSelectFilter, FilterOption } from "@/components/ui/multi-select-filter"
import { ReabastecimientoFillRateChart } from "@/components/charts/reabastecimiento-fill-rate-chart"
import { ReabastecimientoABCChart } from "@/components/charts/reabastecimiento-abc-chart"
import { ReabastecimientoTendenciaChart } from "@/components/charts/reabastecimiento-tendencia-chart"
import { ReabastecimientoAlertasClaseA } from "@/components/charts/reabastecimiento-alertas-clase-a"

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

export default function ReabastecimientoPage() {
  // Estado de filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = useState<string[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([])
  const [prioridadFiltro, setPrioridadFiltro] = useState<string>("todos")
  const [clasificacionFiltro, setClasificacionFiltro] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [debouncedBusqueda, setDebouncedBusqueda] = useState<string>("")

  // Estado de tabla
  const [sorting, setSorting] = useState<SortingState>([{ id: "prioridad_orden", desc: false }])
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

  // Queries
  const { data: filtros } = useReabastecimientoFiltros()
  const { data: kpis, isLoading: isLoadingKpis } = useReabastecimientoKpis(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    productoIds.length > 0 ? productoIds : null
  )
  const { data: tablaData, isLoading: isLoadingTabla } = useReabastecimientoTabla(
    fechaInicio,
    fechaFin,
    ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null,
    productoIds.length > 0 ? productoIds : null,
    prioridadFiltro !== "todos" ? prioridadFiltro : null,
    clasificacionFiltro !== "todos" ? clasificacionFiltro : null,
    debouncedBusqueda || null,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
    sorting[0]?.id || "prioridad_orden",
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

  // Verificar si hay filtros activos
  const hasActiveFilters = ciudadesSeleccionadas.length > 0 ||
    productosSeleccionados.length > 0 ||
    prioridadFiltro !== "todos" ||
    clasificacionFiltro !== "todos"

  const clearAllFilters = () => {
    setCiudadesSeleccionadas([])
    setProductosSeleccionados([])
    setPrioridadFiltro("todos")
    setClasificacionFiltro("todos")
  }

  // Columnas de la tabla
  const columns: ColumnDef<ReabastecimientoItem>[] = useMemo(() => [
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
          <div className="font-medium flex items-center gap-2">
            {row.original.producto_nombre}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                row.original.clasificacion_abc === "A" && "border-green-500 text-green-600 bg-green-50",
                row.original.clasificacion_abc === "B" && "border-blue-500 text-blue-600 bg-blue-50",
                row.original.clasificacion_abc === "C" && "border-slate-400 text-slate-500"
              )}
            >
              {row.original.clasificacion_abc}
            </Badge>
          </div>
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
      accessorKey: "inv_actual",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Inv. Actual
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className={cn(
          "text-right font-medium",
          row.original.inv_actual <= 0 && "text-red-500"
        )}>
          {formatNumber(row.original.inv_actual)}
        </div>
      ),
    },
    {
      accessorKey: "venta_diaria",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Venta/Día
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.venta_diaria.toFixed(1)}
        </div>
      ),
    },
    {
      accessorKey: "tendencia_pct",
      header: "Tendencia",
      cell: ({ row }) => {
        const tendencia = row.original.tendencia_pct
        return (
          <div className={cn(
            "text-center font-medium flex items-center justify-center gap-1",
            tendencia > 0 && "text-green-600",
            tendencia < 0 && "text-red-500"
          )}>
            {tendencia > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : tendencia < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {tendencia > 0 ? "+" : ""}{tendencia}%
          </div>
        )
      },
    },
    {
      accessorKey: "dias_inventario",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Días Inv.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dias = row.original.dias_inventario
        return (
          <div className={cn(
            "text-center font-medium",
            dias < 7 && "text-red-500",
            dias >= 7 && dias < 14 && "text-amber-500",
            dias >= 14 && "text-green-600"
          )}>
            {dias >= 999 ? "∞" : dias}
          </div>
        )
      },
    },
    {
      accessorKey: "sugerido_compra",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Sugerido
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className={cn(
          "text-right font-bold",
          row.original.sugerido_compra > 0 && "text-blue-600"
        )}>
          {formatNumber(row.original.sugerido_compra)}
        </div>
      ),
    },
    {
      accessorKey: "prioridad",
      header: "Prioridad",
      cell: ({ row }) => {
        const prioridad = row.original.prioridad
        return (
          <div className="flex justify-center">
            {prioridad === "URGENTE" && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                URGENTE
              </Badge>
            )}
            {prioridad === "PRONTO" && (
              <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
                <AlertTriangle className="h-3 w-3" />
                PRONTO
              </Badge>
            )}
            {prioridad === "OK" && (
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
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
    manualPagination: true,
    manualSorting: true,
  })

  const kpiCards = [
    {
      title: "Fill Rate",
      value: kpis ? formatPercent(kpis.fill_rate) : "-",
      subtitle: "% días con stock disponible",
      icon: <Percent className="h-5 w-5" />,
      color: "blue",
      alert: kpis && kpis.fill_rate < 90,
    },
    {
      title: "Cobertura",
      value: kpis ? formatPercent(kpis.cobertura) : "-",
      subtitle: "% tiendas con venta activa",
      icon: <Target className="h-5 w-5" />,
      color: "purple",
    },
    {
      title: "Días de Inventario",
      value: kpis ? kpis.dias_inventario_prom.toFixed(1) : "-",
      subtitle: "Promedio general",
      icon: <Calendar className="h-5 w-5" />,
      color: "cyan",
      alert: kpis && kpis.dias_inventario_prom < 7,
    },
    {
      title: "Sugerido Total",
      value: kpis ? formatNumber(kpis.sugerido_total) : "-",
      subtitle: "Unidades a comprar",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "green",
    },
    {
      title: "Productos Urgentes",
      value: kpis ? formatNumber(kpis.productos_urgentes + kpis.productos_pronto) : "-",
      subtitle: `${kpis?.productos_urgentes || 0} urgentes, ${kpis?.productos_pronto || 0} pronto`,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "amber",
      alert: kpis && (kpis.productos_urgentes > 0 || kpis.productos_pronto > 5),
    },
    {
      title: "Venta Perdida Est.",
      value: kpis ? formatCurrency(kpis.venta_perdida_total) : "-",
      subtitle: `${kpis?.productos_clase_a_oos || 0} productos Clase A afectados`,
      icon: <BarChart3 className="h-5 w-5" />,
      color: "red",
      alert: kpis && kpis.venta_perdida_total > 10000,
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6 premium-bg gradient-overlay min-h-screen">
      {/* Header */}
      <div className="sticky-header-blur flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reabastecimiento</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Sugerido de compra y análisis de disponibilidad
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

            {/* Prioridad Select */}
            <Select value={prioridadFiltro} onValueChange={setPrioridadFiltro}>
              <SelectTrigger className="w-[140px] h-9 rounded-full border-dashed">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="URGENTE">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    Urgente
                  </span>
                </SelectItem>
                <SelectItem value="PRONTO">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Pronto
                  </span>
                </SelectItem>
                <SelectItem value="OK">
                  <span className="flex items-center gap-2 text-green-600">
                    OK
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Clasificación ABC */}
            <Select value={clasificacionFiltro} onValueChange={setClasificacionFiltro}>
              <SelectTrigger className="w-[120px] h-9 rounded-full border-dashed">
                <SelectValue placeholder="ABC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="A">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-500 text-green-600 text-[10px] px-1">A</Badge>
                    Clase A
                  </span>
                </SelectItem>
                <SelectItem value="B">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-500 text-blue-600 text-[10px] px-1">B</Badge>
                    Clase B
                  </span>
                </SelectItem>
                <SelectItem value="C">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-400 text-slate-500 text-[10px] px-1">C</Badge>
                    Clase C
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

      {/* Gráficas Row 1: Fill Rate y ABC */}
      <div className="grid gap-6 md:grid-cols-2">
        <ReabastecimientoFillRateChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
        />
        <ReabastecimientoABCChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
        />
      </div>

      {/* Gráficas Row 2: Tendencia y Alertas Clase A */}
      <div className="grid gap-6 md:grid-cols-2">
        <ReabastecimientoTendenciaChart
          ciudades={ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : null}
        />
        <ReabastecimientoAlertasClaseA
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
        />
      </div>

      {/* Tabla */}
      <Card className="rounded-2xl hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            Sugerido de Compra
          </CardTitle>
          <CardDescription>
            {tablaData?.total || 0} combinaciones producto-tienda
            {tablaData?.fecha_inicio && tablaData?.fecha_fin && (
              <span className="ml-2">
                (basado en ventas de {format(new Date(tablaData.fecha_inicio), "dd MMM", { locale: es })} - {format(new Date(tablaData.fecha_fin), "dd MMM yyyy", { locale: es })})
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
                      {formatNumber(tablaData.data.reduce((sum, i) => sum + i.inv_actual, 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {tablaData.data.reduce((sum, i) => sum + i.venta_diaria, 0).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      {formatNumber(tablaData.data.reduce((sum, i) => sum + i.sugerido_compra, 0))}
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
