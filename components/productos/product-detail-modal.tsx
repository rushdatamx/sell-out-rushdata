"use client"

import { Tag, Package, TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import {
  useProductDetail,
  useProductSalesHistory,
  useProductTopClients,
  useProductRecentOrders,
} from "@/hooks/use-product-detail"

interface ProductDetailModalProps {
  tenantId: string
  productoId: number | null
  onClose: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: string | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatDateLong(date: string | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Notion-style property row
function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-1.5 group">
      <span className="w-32 flex-shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1 text-sm text-foreground">{children}</div>
    </div>
  )
}

// Notion-style section header
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h3>
  )
}

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ProductDetailModal({ tenantId, productoId, onClose }: ProductDetailModalProps) {
  const { data: product, isLoading } = useProductDetail(tenantId, productoId)
  const { data: salesHistory } = useProductSalesHistory(tenantId, productoId, 6)
  const { data: topClients } = useProductTopClients(tenantId, productoId, 5)
  const { data: recentOrders } = useProductRecentOrders(tenantId, productoId, 10)

  if (!productoId) return null

  // Prepare chart data
  const chartData =
    salesHistory?.map((item) => ({
      mes: `${item.mes.substring(0, 3)}`,
      ventas: item.total_ventas,
    })) || []

  return (
    <Dialog open={!!productoId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header - Notion style */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-0">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-semibold text-foreground tracking-tight">
                  {product?.nombre}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  {product?.sku}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-medium">
                  {product?.categoria}
                </Badge>
                <Badge variant={product?.activo ? "success" : "secondary"}>
                  {product?.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          )}
        </DialogHeader>

        <Separator />

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="px-6 py-5 space-y-8">
              {/* KPIs - Notion inline style */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lifetime Value</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatCurrency(product?.lifetime_value || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Ordenes</p>
                  <p className="text-xl font-semibold text-foreground">
                    {product?.total_ordenes || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Clientes</p>
                  <p className="text-xl font-semibold text-foreground">
                    {product?.total_clientes || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Precio Venta</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatCurrency(product?.precio_venta_sugerido || 0)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Two columns layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Properties - Notion database style */}
                  <div>
                    <SectionHeader>Informacion</SectionHeader>
                    <div className="space-y-0.5">
                      <PropertyRow label="Categoria">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          {product?.categoria}
                          {product?.subcategoria && ` / ${product.subcategoria}`}
                        </span>
                      </PropertyRow>
                      {product?.marca && (
                        <PropertyRow label="Marca">
                          <span className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            {product.marca}
                          </span>
                        </PropertyRow>
                      )}
                      {product?.linea_producto && (
                        <PropertyRow label="Linea">
                          {product.linea_producto}
                        </PropertyRow>
                      )}
                      <PropertyRow label="Unidad">
                        {product?.unidad_medida || "-"}
                      </PropertyRow>
                      <PropertyRow label="Piezas/Caja">
                        {product?.piezas_por_caja || "-"}
                      </PropertyRow>
                      <PropertyRow label="Peso">
                        {product?.peso_kg ? `${product.peso_kg} kg` : "-"}
                      </PropertyRow>
                      <PropertyRow label="Codigo Barras">
                        <span className="font-mono text-xs">
                          {product?.codigo_barras || "-"}
                        </span>
                      </PropertyRow>
                      <PropertyRow label="Ultima Venta">
                        {formatDateLong(product?.ultima_venta || null)}
                      </PropertyRow>
                    </div>
                  </div>

                  {/* Pricing - Notion style */}
                  <div>
                    <SectionHeader>Precios y Costos</SectionHeader>
                    <div className="space-y-0.5">
                      <PropertyRow label="Costo Produccion">
                        {product?.costo_produccion
                          ? formatCurrency(product.costo_produccion)
                          : "-"}
                      </PropertyRow>
                      <PropertyRow label="Margen Objetivo">
                        {product?.margen_objetivo ? `${product.margen_objetivo}%` : "-"}
                      </PropertyRow>
                      <PropertyRow label="Dias Produccion">
                        {product?.dias_produccion
                          ? `${product.dias_produccion} dias`
                          : "-"}
                      </PropertyRow>
                      {product?.perecedero && (
                        <PropertyRow label="Perecedero">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              Si
                            </Badge>
                            {product?.dias_vida_util && (
                              <span className="text-xs text-muted-foreground">
                                Vida util: {product.dias_vida_util} dias
                              </span>
                            )}
                          </div>
                        </PropertyRow>
                      )}
                    </div>
                  </div>

                  {/* Top Clients - Notion list style */}
                  <div>
                    <SectionHeader>Top Clientes</SectionHeader>
                    {topClients && topClients.length > 0 ? (
                      <div className="space-y-2">
                        {topClients.map((cliente, idx) => (
                          <div
                            key={cliente.cliente_id}
                            className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors group"
                          >
                            <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted rounded">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {cliente.nombre_cliente}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cliente.tipo_cliente} · {cliente.num_ordenes} ordenes
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">
                                {formatCurrency(cliente.total_ventas)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cliente.porcentaje_ventas.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        No hay clientes disponibles
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Sales Chart - Clean Notion style */}
                  <div>
                    <SectionHeader>Historial de Ventas</SectionHeader>
                    {chartData.length > 0 ? (
                      <div className="h-48">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <XAxis
                              dataKey="mes"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                              width={50}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-popover border border-border rounded-md shadow-md px-3 py-2">
                                      <p className="text-sm font-medium text-foreground">
                                        {formatCurrency(payload[0].value as number)}
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Bar
                              dataKey="ventas"
                              fill="hsl(var(--primary))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        No hay datos de ventas disponibles
                      </p>
                    )}
                  </div>

                  {/* Description if exists */}
                  {product?.descripcion && (
                    <div>
                      <SectionHeader>Descripcion</SectionHeader>
                      <p className="text-sm text-foreground leading-relaxed">
                        {product.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Recent Orders - Notion table style */}
                  <div>
                    <SectionHeader>Ordenes Recientes</SectionHeader>
                    {recentOrders && recentOrders.length > 0 ? (
                      <div className="space-y-1">
                        {recentOrders.slice(0, 8).map((order, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground font-mono">
                                {order.numero_orden}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(order.fecha)} · {order.cliente_nombre}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground">
                                {formatCurrency(order.total_ventas)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(order.unidades)} unidades
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        No hay ordenes disponibles
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
