"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMercoReabastecimientoAlertasClaseA } from "@/hooks/use-merco-reabastecimiento"
import { AlertTriangle, Star, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ReabastecimientoMercoAlertasAProps {
  retailerId?: number | null
}

export function ReabastecimientoMercoAlertasA({ retailerId }: ReabastecimientoMercoAlertasAProps) {
  const { data: alertas, isLoading } = useMercoReabastecimientoAlertasClaseA(retailerId, 10)

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getEstadoIcon = (estado: string) => {
    if (estado === "SIN_STOCK") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    if (estado === "CRITICO") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    return <AlertTriangle className="h-4 w-4 text-amber-500" />
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Alertas Clase A
            </CardTitle>
            <CardDescription>Productos top con cobertura baja ({"<"} 15 días)</CardDescription>
          </div>
          {alertas && alertas.length > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {alertas.length} alertas
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
        ) : alertas && alertas.length > 0 ? (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {alertas.map((alerta, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors border border-transparent hover:border-amber-200 ${
                  alerta.estado === "SIN_STOCK" || alerta.estado === "CRITICO"
                    ? "bg-red-50/50 hover:bg-red-50"
                    : "bg-amber-50/50 hover:bg-amber-50"
                }`}
              >
                <div className="mt-0.5">
                  {getEstadoIcon(alerta.estado)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate" title={alerta.producto_nombre}>
                      {alerta.producto_nombre}
                    </span>
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 text-[10px] px-1">
                      A
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    UPC: {alerta.upc}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs">
                    <span className={`font-medium ${alerta.dias_cobertura < 7 ? "text-red-600" : "text-amber-600"}`}>
                      {alerta.dias_cobertura} días cobertura
                    </span>
                    <span className="text-muted-foreground">
                      Inv: <span className="font-medium">{formatNumber(alerta.inventario)}</span>
                    </span>
                    {alerta.sugerido_15d > 0 && (
                      <span className="text-orange-600 font-medium">
                        Sugerido: {formatNumber(alerta.sugerido_15d)} uds
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">Sin alertas en Clase A</p>
            <p className="text-xs">Los productos top tienen buena cobertura</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
