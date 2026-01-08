"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProductoPromocionAnalisis } from "@/lib/promociones/types"

interface PromocionProductosTablaProps {
  productos: ProductoPromocionAnalisis[]
  isLoading?: boolean
}

function formatCurrency(value: number): string {
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
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function PromocionProductosTabla({
  productos,
  isLoading,
}: PromocionProductosTablaProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Análisis por Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="skeleton-shimmer h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Calcular totales
  const totales = productos.reduce(
    (acc, p) => ({
      ventaPromo: acc.ventaPromo + p.ventaPromo,
      ventaBaseline: acc.ventaBaseline + p.ventaBaseline,
      unidadesPromo: acc.unidadesPromo + p.unidadesPromo,
      unidadesBaseline: acc.unidadesBaseline + p.unidadesBaseline,
    }),
    { ventaPromo: 0, ventaBaseline: 0, unidadesPromo: 0, unidadesBaseline: 0 }
  )

  const upliftTotal =
    totales.ventaBaseline > 0
      ? ((totales.ventaPromo - totales.ventaBaseline) / totales.ventaBaseline) *
        100
      : 0

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Análisis por Producto</CardTitle>
        <CardDescription>
          Desempeño individual de cada producto durante la promoción
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="text-right font-semibold">
                  Venta Promo
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Venta Baseline
                </TableHead>
                <TableHead className="text-right font-semibold">Uplift</TableHead>
                <TableHead className="text-right font-semibold">
                  Unidades
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Contribución
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((producto) => (
                <TableRow key={producto.productoId} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium">{producto.productoNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {producto.upc}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(producto.ventaPromo)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(producto.ventaBaseline)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-medium",
                        producto.upliftPct >= 0
                          ? "bg-green-500/10 text-green-700"
                          : "bg-red-500/10 text-red-700"
                      )}
                    >
                      {formatPercent(producto.upliftPct)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-medium">
                        {formatNumber(producto.unidadesPromo)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(producto.upliftUnidadesPct)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${producto.contribucionTotal}%` }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">
                        {producto.contribucionTotal.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-medium">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totales.ventaPromo)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totales.ventaBaseline)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-medium",
                      upliftTotal >= 0
                        ? "bg-green-500/10 text-green-700"
                        : "bg-red-500/10 text-red-700"
                    )}
                  >
                    {formatPercent(upliftTotal)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(totales.unidadesPromo)}
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
