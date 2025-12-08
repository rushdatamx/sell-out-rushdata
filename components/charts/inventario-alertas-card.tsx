"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventarioAlertas } from "@/hooks/use-inventario"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InventarioAlertasCardProps {
  fechaInicio?: string | null
  fechaFin?: string | null
}

export function InventarioAlertasCard({ fechaInicio, fechaFin }: InventarioAlertasCardProps) {
  const { data: alertas, isLoading } = useInventarioAlertas(fechaInicio, fechaFin, 8)

  const getSeverityIcon = (severidad: string) => {
    switch (severidad) {
      case "critico":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "alto":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Info className="h-4 w-4 text-yellow-500" />
    }
  }

  const getSeverityBadge = (severidad: string) => {
    switch (severidad) {
      case "critico":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Crítico</Badge>
      case "alto":
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px] px-1.5 py-0">Alto</Badge>
      default:
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Medio</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  return (
    <Card className="rounded-2xl hover-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Alertas de Inventario
        </CardTitle>
        <CardDescription>Situaciones críticas que requieren atención</CardDescription>
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
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-muted"
              >
                <div className="mt-0.5">{getSeverityIcon(alerta.severidad)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{alerta.producto}</span>
                    {getSeverityBadge(alerta.severidad)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {alerta.tienda} • {alerta.ciudad}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs">
                    <span className="text-red-600 font-medium">
                      {alerta.dias_oos} días OOS
                    </span>
                    <span className="text-muted-foreground">
                      Pérdida: <span className="text-red-500 font-medium">{formatCurrency(alerta.venta_perdida)}</span>
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
            <p className="text-sm font-medium">Sin alertas críticas</p>
            <p className="text-xs">El inventario está en buen estado</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
