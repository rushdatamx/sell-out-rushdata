"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useMercoReabastecimientoKpis } from "@/hooks/use-merco-reabastecimiento"
import { Package, AlertTriangle, Clock, Star } from "lucide-react"

interface ReabastecimientoMercoKpisProps {
  retailerId?: number | null
}

export function ReabastecimientoMercoKpis({ retailerId }: ReabastecimientoMercoKpisProps) {
  const { data: kpis, isLoading } = useMercoReabastecimientoKpis(retailerId)

  const kpiItems = [
    {
      title: "Productos Activos",
      value: kpis?.productos_activos || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Con venta en 30 días",
    },
    {
      title: "Venta Cero",
      value: kpis?.productos_venta_cero || 0,
      icon: AlertTriangle,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      description: "Sin venta pero con stock",
    },
    {
      title: "Cobertura Prom.",
      value: `${kpis?.cobertura_promedio || 0} días`,
      icon: Clock,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Días de inventario estimados",
    },
    {
      title: "Alertas Clase A",
      value: kpis?.alertas_clase_a || 0,
      icon: Star,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: "Top productos con bajo stock",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-6">
              <div className="skeleton-shimmer h-12 w-12 rounded-xl mb-4" />
              <div className="skeleton-shimmer h-8 w-20 mb-2" />
              <div className="skeleton-shimmer h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiItems.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <Card key={index} className="rounded-2xl hover-lift">
            <CardContent className="p-6">
              <div className={`h-12 w-12 rounded-xl ${kpi.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <p className="text-3xl font-bold mb-1">{kpi.value}</p>
              <p className="text-sm font-medium text-foreground">{kpi.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
