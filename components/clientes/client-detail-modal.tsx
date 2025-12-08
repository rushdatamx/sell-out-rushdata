"use client"

import { X, MapPin, Mail, Phone, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import {
  useClientDetail,
  useClientSalesHistory,
  useClientTopProducts,
  useClientRecentOrders,
} from "@/hooks/use-client-detail"

interface ClientDetailModalProps {
  tenantId: string
  clienteId: number | null
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

export function ClientDetailModal({ tenantId, clienteId, onClose }: ClientDetailModalProps) {
  const { data: client, isLoading } = useClientDetail(tenantId, clienteId)
  const { data: salesHistory } = useClientSalesHistory(tenantId, clienteId, 6)
  const { data: topProducts } = useClientTopProducts(tenantId, clienteId, 5)
  const { data: recentOrders } = useClientRecentOrders(tenantId, clienteId, 10)

  if (!clienteId) return null

  // Prepare chart data
  const chartData =
    salesHistory?.map((item) => ({
      mes: `${item.mes.substring(0, 3)}`,
      ventas: item.total_ventas,
    })) || []

  return (
    <Dialog open={!!clienteId} onOpenChange={(open) => !open && onClose()}>
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
                  {client?.nombre}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  {client?.clave_cliente}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    client?.segmento_abc === "A"
                      ? "default"
                      : client?.segmento_abc === "B"
                      ? "secondary"
                      : "outline"
                  }
                  className="font-semibold"
                >
                  Clase {client?.segmento_abc}
                </Badge>
                <Badge variant={client?.activo ? "success" : "secondary"}>
                  {client?.activo ? "Activo" : "Inactivo"}
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
                    {formatCurrency(client?.lifetime_value || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Órdenes</p>
                  <p className="text-xl font-semibold text-foreground">
                    {client?.total_ordenes || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ticket Promedio</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatCurrency(client?.ticket_promedio || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Días Crédito</p>
                  <p className="text-xl font-semibold text-foreground">
                    {client?.dias_credito || 0}
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
                    <SectionHeader>Información</SectionHeader>
                    <div className="space-y-0.5">
                      <PropertyRow label="Ubicación">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {[client?.ciudad, client?.estado, client?.zona]
                            .filter(Boolean)
                            .join(", ") || "Sin información"}
                        </span>
                      </PropertyRow>
                      {client?.contacto_principal?.email && (
                        <PropertyRow label="Email">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {client.contacto_principal.email}
                          </span>
                        </PropertyRow>
                      )}
                      {client?.contacto_principal?.telefono && (
                        <PropertyRow label="Teléfono">
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {client.contacto_principal.telefono}
                          </span>
                        </PropertyRow>
                      )}
                      <PropertyRow label="Tipo Cliente">
                        <span className="capitalize">
                          {client?.tipo_cliente?.replace("_", " ") || "-"}
                        </span>
                      </PropertyRow>
                      <PropertyRow label="Canal">
                        <span className="capitalize">{client?.canal || "-"}</span>
                      </PropertyRow>
                      <PropertyRow label="Última Compra">
                        {formatDateLong(client?.ultima_compra || null)}
                      </PropertyRow>
                      <PropertyRow label="Frecuencia">
                        {client?.frecuencia_compra_dias
                          ? `Cada ${Math.round(client.frecuencia_compra_dias)} días`
                          : "-"}
                      </PropertyRow>
                    </div>
                  </div>

                  {/* Top Products - Notion list style */}
                  <div>
                    <SectionHeader>Top Productos</SectionHeader>
                    {topProducts && topProducts.length > 0 ? (
                      <div className="space-y-2">
                        {topProducts.map((producto, idx) => (
                          <div
                            key={producto.producto_id}
                            className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors group"
                          >
                            <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted rounded">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {producto.nombre_producto}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {producto.categoria} · {producto.num_ordenes} órdenes
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">
                                {formatCurrency(producto.total_ventas)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {producto.porcentaje_ventas.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        No hay productos disponibles
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

                  {/* Recent Orders - Notion table style */}
                  <div>
                    <SectionHeader>Órdenes Recientes</SectionHeader>
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
                                {formatDate(order.fecha)} · {order.num_productos} productos
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {formatCurrency(order.total_ventas)}
                              </p>
                              <Badge
                                variant={order.estado === "completada" ? "success" : "secondary"}
                                className="text-xs"
                              >
                                {order.estado}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        No hay órdenes disponibles
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
