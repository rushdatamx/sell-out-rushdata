"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMercoReabastecimientoVentaCero } from "@/hooks/use-merco-reabastecimiento"
import { TrendingDown, Package, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ReabastecimientoMercoVentaCeroProps {
  retailerId?: number | null
}

export function ReabastecimientoMercoVentaCero({ retailerId }: ReabastecimientoMercoVentaCeroProps) {
  const { data: productos, isLoading } = useMercoReabastecimientoVentaCero(retailerId, 15)

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sin registro"
    try {
      return format(new Date(dateStr), "d MMM yyyy", { locale: es })
    } catch {
      return dateStr
    }
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-gray-500" />
              Venta Cero
            </CardTitle>
            <CardDescription>Productos sin venta en 30 días pero con inventario</CardDescription>
          </div>
          {productos && productos.length > 0 && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              {productos.length} productos
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <div className="skeleton-shimmer h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton-shimmer h-4 w-3/4" />
                  <div className="skeleton-shimmer h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : productos && productos.length > 0 ? (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {productos.map((producto, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="mt-0.5">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" title={producto.producto_nombre}>
                    {producto.producto_nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    UPC: {producto.upc}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs">
                    <span className="text-gray-600">
                      Inventario: <span className="font-medium">{formatNumber(producto.inventario)} uds</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Última venta: {formatDate(producto.ultima_venta)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">Sin productos con venta cero</p>
            <p className="text-xs">Todos los productos con inventario tienen ventas</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
