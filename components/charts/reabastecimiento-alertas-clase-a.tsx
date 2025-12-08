"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useReabastecimientoAlertasClaseA } from "@/hooks/use-reabastecimiento"
import { AlertTriangle, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ReabastecimientoAlertasClaseAProps {
  fechaInicio?: string | null
  fechaFin?: string | null
}

export function ReabastecimientoAlertasClaseA({
  fechaInicio,
  fechaFin,
}: ReabastecimientoAlertasClaseAProps) {
  const { data: alertas, isLoading } = useReabastecimientoAlertasClaseA(
    fechaInicio,
    fechaFin,
    10
  )

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const totalVentaPerdida = alertas?.reduce((sum, a) => sum + a.venta_perdida_est, 0) || 0

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Alertas Clase A
            </CardTitle>
            <CardDescription>Productos top con problemas de stock</CardDescription>
          </div>
          {alertas && alertas.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-red-50">
              <p className="text-[10px] text-muted-foreground">Pérdida Est.</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(totalVentaPerdida)}</p>
            </div>
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
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {alertas.map((alerta, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-200"
              >
                <div className="mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{alerta.producto}</span>
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 text-[10px] px-1">
                      A
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {alerta.tienda} • {alerta.ciudad}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs">
                    <span className="text-amber-600 font-medium">
                      {alerta.dias_oos} días OOS
                    </span>
                    <span className="text-muted-foreground">
                      Pérdida: <span className="text-red-500 font-medium">{formatCurrency(alerta.venta_perdida_est)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium">Sin alertas en Clase A</p>
            <p className="text-xs">Los productos top tienen buen stock</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
