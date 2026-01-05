"use client"

import Link from "next/link"
import Image from "next/image"
import { TrendingUp, TrendingDown, Store, Package, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { RetailerSummary } from "@/lib/retailers/types"
import { getRetailerLogo } from "@/lib/retailers/config"

interface RetailerCardProps {
  retailer: RetailerSummary
  className?: string
}

export function RetailerCard({ retailer, className }: RetailerCardProps) {
  const isPositive = retailer.variacion_pct >= 0
  const logoUrl = getRetailerLogo(retailer.codigo)
  const formattedVentas = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(retailer.ventas_30d)

  const formattedFecha = retailer.ultima_fecha
    ? new Date(retailer.ultima_fecha).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      })
    : "Sin datos"

  return (
    <Link href={`/${retailer.codigo}/dashboard`} className="block">
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
          "border-l-4 cursor-pointer",
          className
        )}
        style={{ borderLeftColor: retailer.color_hex }}
      >
        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
          style={{ backgroundColor: retailer.color_hex }}
        />

        <CardContent className="p-6">
          {/* Header: Nombre y badge de color */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: `${retailer.color_hex}20` }}
              >
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`Logo ${retailer.nombre}`}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                ) : (
                  <Store
                    className="w-5 h-5"
                    style={{ color: retailer.color_hex }}
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{retailer.nombre}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {retailer.codigo}
                </p>
              </div>
            </div>

            {/* Variación */}
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                isPositive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{isPositive ? "+" : ""}{retailer.variacion_pct.toFixed(1)}%</span>
            </div>
          </div>

          {/* Ventas principales */}
          <div className="mb-4">
            <p className="text-3xl font-bold tracking-tight">{formattedVentas}</p>
            <p className="text-sm text-muted-foreground">Ventas últimos 30 días</p>
          </div>

          {/* Métricas secundarias */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Store className="w-3.5 h-3.5" />
              </div>
              <p className="font-semibold">{retailer.tiendas_activas}</p>
              <p className="text-xs text-muted-foreground">Tiendas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Package className="w-3.5 h-3.5" />
              </div>
              <p className="font-semibold">{retailer.skus_activos}</p>
              <p className="text-xs text-muted-foreground">SKUs</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <p className="font-semibold text-sm">{formattedFecha}</p>
              <p className="text-xs text-muted-foreground">Última venta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Skeleton para loading state
export function RetailerCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            <div>
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-12 bg-muted animate-pulse rounded mt-1" />
            </div>
          </div>
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
        </div>

        <div className="mb-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded mt-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 w-4 mx-auto bg-muted animate-pulse rounded mb-1" />
              <div className="h-5 w-8 mx-auto bg-muted animate-pulse rounded" />
              <div className="h-3 w-12 mx-auto bg-muted animate-pulse rounded mt-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
