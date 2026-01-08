"use client"

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Store,
  BarChart3,
  Target,
  Activity,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PromocionKpis } from "@/lib/promociones/types"

interface PromocionKpisGridProps {
  kpis: PromocionKpis
  isLoading?: boolean
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value)
}

function formatPercent(value: number | null): string {
  if (value === null) return "N/A"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function PromocionKpisGrid({ kpis, isLoading }: PromocionKpisGridProps) {
  const kpiCards = [
    {
      title: "Uplift",
      value: formatPercent(kpis.ventaDiferenciaPct),
      subtitle: "vs baseline",
      icon: kpis.ventaDiferenciaPct >= 0 ? TrendingUp : TrendingDown,
      color: kpis.ventaDiferenciaPct >= 0 ? "text-green-500" : "text-red-500",
      bgColor: kpis.ventaDiferenciaPct >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      title: "ROI Promoción",
      value: kpis.roi !== null ? formatPercent(kpis.roi) : "N/A",
      subtitle: "rentabilidad",
      icon: Target,
      color: kpis.roi !== null && kpis.roi >= 0 ? "text-green-500" : "text-red-500",
      bgColor: kpis.roi !== null && kpis.roi >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      title: "Elasticidad",
      value: kpis.elasticidadPrecio !== null ? kpis.elasticidadPrecio.toFixed(2) : "N/A",
      subtitle:
        kpis.elasticidadPrecio !== null
          ? Math.abs(kpis.elasticidadPrecio) > 1
            ? "elástico"
            : "inelástico"
          : "",
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Cobertura",
      value: `${kpis.coberturaPct.toFixed(0)}%`,
      subtitle: `${kpis.tiendasConVentaPromo}/${kpis.tiendasTotales} tiendas`,
      icon: Store,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Ventas Promo",
      value: formatCurrency(kpis.ventaPromo),
      subtitle: `${formatCurrency(kpis.ventaDiferenciaAbs)} vs baseline`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Unidades",
      value: formatNumber(kpis.unidadesPromo),
      subtitle: `${formatPercent(kpis.unidadesDiferenciaPct)} vs baseline`,
      icon: Package,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="pt-6">
              <div className="skeleton-shimmer h-4 w-20 mb-2" />
              <div className="skeleton-shimmer h-8 w-24 mb-1" />
              <div className="skeleton-shimmer h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiCards.map((kpi, index) => {
        const IconComponent = kpi.icon
        return (
          <Card
            key={index}
            className="rounded-2xl overflow-hidden hover-lift group"
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg", kpi.bgColor)}>
                  <IconComponent className={cn("h-4 w-4", kpi.color)} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {kpi.title}
                </p>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  kpi.title === "Uplift" || kpi.title === "ROI Promoción"
                    ? kpi.color
                    : ""
                )}
              >
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.subtitle}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
