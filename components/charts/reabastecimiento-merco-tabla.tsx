"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMercoReabastecimientoTabla } from "@/hooks/use-merco-reabastecimiento"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

interface ReabastecimientoMercoTablaProps {
  retailerId?: number | null
}

export function ReabastecimientoMercoTabla({ retailerId }: ReabastecimientoMercoTablaProps) {
  const [clasificacion, setClasificacion] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 15

  const { data, isLoading } = useMercoReabastecimientoTabla(
    retailerId,
    clasificacion,
    pageSize,
    page * pageSize
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = {
      CRITICO: "bg-red-100 text-red-700 border-red-200",
      BAJO: "bg-amber-100 text-amber-700 border-amber-200",
      OK: "bg-green-100 text-green-700 border-green-200",
      SIN_STOCK: "bg-red-100 text-red-700 border-red-200",
      VENTA_CERO: "bg-gray-100 text-gray-700 border-gray-200",
    }
    const labels: Record<string, string> = {
      CRITICO: "Crítico",
      BAJO: "Bajo",
      OK: "OK",
      SIN_STOCK: "Sin Stock",
      VENTA_CERO: "Venta Cero",
    }
    return (
      <Badge variant="outline" className={estilos[estado] || "bg-gray-100"}>
        {labels[estado] || estado}
      </Badge>
    )
  }

  const getClasificacionBadge = (clasificacion: string) => {
    const estilos: Record<string, string> = {
      A: "bg-green-100 text-green-700 border-green-500",
      B: "bg-blue-100 text-blue-700 border-blue-500",
      C: "bg-gray-100 text-gray-600 border-gray-400",
    }
    return (
      <Badge variant="outline" className={estilos[clasificacion]}>
        {clasificacion}
      </Badge>
    )
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Tabla de Reabastecimiento
            </CardTitle>
            <CardDescription>
              {data?.total || 0} productos • Cobertura estimada basada en snapshot mensual
            </CardDescription>
          </div>
          <Select
            value={clasificacion || "all"}
            onValueChange={(v) => {
              setClasificacion(v === "all" ? null : v)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Clasificación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="A">Clase A</SelectItem>
              <SelectItem value="B">Clase B</SelectItem>
              <SelectItem value="C">Clase C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton-shimmer h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Producto</TableHead>
                    <TableHead className="text-right font-semibold">Venta 30d</TableHead>
                    <TableHead className="text-right font-semibold">Inventario</TableHead>
                    <TableHead className="text-right font-semibold">Cobertura</TableHead>
                    <TableHead className="text-center font-semibold">ABC</TableHead>
                    <TableHead className="text-right font-semibold">Sugerido</TableHead>
                    <TableHead className="text-center font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.productos?.map((item) => (
                    <TableRow key={item.producto_id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[250px]" title={item.producto_nombre}>
                            {item.producto_nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.upc}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium">{formatCurrency(item.venta_30d)}</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(item.unidades_30d)} uds</p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(item.inventario)} uds
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${item.dias_cobertura < 7 ? "text-red-600" : item.dias_cobertura < 15 ? "text-amber-600" : "text-green-600"}`}>
                          {item.dias_cobertura} días
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getClasificacionBadge(item.clasificacion)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.sugerido_15d > 0 ? (
                          <span className="text-orange-600">{formatNumber(item.sugerido_15d)} uds</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getEstadoBadge(item.estado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data?.total || 0)} de {data?.total || 0}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {page + 1} de {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
