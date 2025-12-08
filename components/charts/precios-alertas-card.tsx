"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePreciosAlertas } from "@/hooks/use-precios"
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PreciosAlertasCardProps {
  fechaInicio?: string | null
  fechaFin?: string | null
}

export function PreciosAlertasCard({
  fechaInicio,
  fechaFin,
}: PreciosAlertasCardProps) {
  const { data: alertas, isLoading } = usePreciosAlertas(
    fechaInicio,
    fechaFin,
    10
  )

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  const alertasAltas = alertas?.filter(a => a.tipo_alerta === "PRECIO_ALTO") || []
  const alertasBajas = alertas?.filter(a => a.tipo_alerta === "PRECIO_BAJO") || []

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertas de Precios
            </CardTitle>
            <CardDescription>Precios fuera del rango esperado</CardDescription>
          </div>
          {alertas && alertas.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="destructive" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {alertasAltas.length} altos
              </Badge>
              <Badge className="gap-1 bg-blue-500">
                <TrendingDown className="h-3 w-3" />
                {alertasBajas.length} bajos
              </Badge>
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
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {alertas.map((alerta, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors border border-transparent hover:border-muted ${
                  alerta.tipo_alerta === "PRECIO_ALTO"
                    ? "bg-red-50/50 hover:bg-red-50"
                    : "bg-blue-50/50 hover:bg-blue-50"
                }`}
              >
                <div className="mt-0.5">
                  {alerta.tipo_alerta === "PRECIO_ALTO" ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{alerta.producto}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {alerta.tienda} • {alerta.ciudad}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs">
                    <span className="text-muted-foreground">
                      Tienda: <span className={`font-medium ${alerta.tipo_alerta === "PRECIO_ALTO" ? "text-red-600" : "text-blue-600"}`}>
                        {formatCurrency(alerta.precio_tienda)}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Prom: <span className="font-medium">{formatCurrency(alerta.precio_promedio)}</span>
                    </span>
                    <Badge
                      variant={alerta.tipo_alerta === "PRECIO_ALTO" ? "destructive" : "secondary"}
                      className={`text-[10px] px-1.5 ${alerta.tipo_alerta === "PRECIO_BAJO" ? "bg-blue-500 text-white" : ""}`}
                    >
                      {alerta.diferencia_pct > 0 ? "+" : ""}{alerta.diferencia_pct}%
                    </Badge>
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
            <p className="text-sm font-medium">Sin alertas de precio</p>
            <p className="text-xs">Los precios están dentro del rango esperado</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
