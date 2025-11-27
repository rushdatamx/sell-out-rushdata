"use client"

import { X, Mail, Phone, MapPin, CreditCard, TrendingUp, Package, ShoppingCart } from "lucide-react"
import { Card, Metric, Text, Badge, BarChart } from "@tremor/react"
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
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function ClientDetailModal({ tenantId, clienteId, onClose }: ClientDetailModalProps) {
  const { data: client, isLoading } = useClientDetail(tenantId, clienteId)
  const { data: salesHistory } = useClientSalesHistory(tenantId, clienteId, 6)
  const { data: topProducts } = useClientTopProducts(tenantId, clienteId, 5)
  const { data: recentOrders } = useClientRecentOrders(tenantId, clienteId, 10)

  if (!clienteId) return null

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      activo: "emerald",
      inactivo: "gray",
      en_riesgo: "red",
    }
    return statusMap[status] || "gray"
  }

  const getClasificacionColor = (clasificacion: string) => {
    const map: Record<string, string> = {
      A: "blue",
      B: "indigo",
      C: "gray",
    }
    return map[clasificacion] || "gray"
  }

  // Prepare chart data
  const chartData =
    salesHistory?.map((item) => ({
      mes: `${item.mes.substring(0, 3)} ${item.anio}`,
      Ventas: item.total_ventas,
    })) || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {isLoading ? (
              <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {client?.nombre}
                  </h2>
                  <p className="text-sm text-gray-500">{client?.clave_cliente}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color={getClasificacionColor(client?.segmento_abc || "C")}>
                    Clase {client?.segmento_abc}
                  </Badge>
                  <Badge
                    color={getStatusColor(
                      client?.activo ? "activo" : "inactivo"
                    )}
                  >
                    {client?.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Text className="!text-xs !text-gray-500">Lifetime Value</Text>
                      <Metric className="!text-lg !text-gray-900">
                        {formatCurrency(client?.lifetime_value || 0)}
                      </Metric>
                    </div>
                  </div>
                </Card>

                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <Text className="!text-xs !text-gray-500">Total Órdenes</Text>
                      <Metric className="!text-lg !text-gray-900">
                        {client?.total_ordenes || 0}
                      </Metric>
                    </div>
                  </div>
                </Card>

                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <Text className="!text-xs !text-gray-500">Ticket Promedio</Text>
                      <Metric className="!text-lg !text-gray-900">
                        {formatCurrency(client?.ticket_promedio || 0)}
                      </Metric>
                    </div>
                  </div>
                </Card>

                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <Text className="!text-xs !text-gray-500">Días Crédito</Text>
                      <Metric className="!text-lg !text-gray-900">
                        {client?.dias_credito || 0}
                      </Metric>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Información General */}
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Información General
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Ubicación</p>
                          <p className="text-sm text-gray-900">
                            {[client?.ciudad, client?.estado, client?.zona]
                              .filter(Boolean)
                              .join(", ") || "Sin información"}
                          </p>
                        </div>
                      </div>

                      {client?.contacto_principal?.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm text-gray-900 truncate">
                              {client.contacto_principal.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {client?.contacto_principal?.telefono && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Teléfono</p>
                            <p className="text-sm text-gray-900">
                              {client.contacto_principal.telefono}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Tipo Cliente</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {client?.tipo_cliente?.replace("_", " ") || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Canal</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {client?.canal || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Última Compra</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(client?.ultima_compra || null)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Frecuencia</p>
                          <p className="text-sm font-medium text-gray-900">
                            {client?.frecuencia_compra_dias
                              ? `Cada ${Math.round(client.frecuencia_compra_dias)} días`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Top Productos */}
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Top 5 Productos
                    </h3>
                    <div className="space-y-3">
                      {topProducts && topProducts.length > 0 ? (
                        topProducts.map((producto) => (
                          <div
                            key={producto.producto_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {producto.nombre_producto}
                              </p>
                              <p className="text-xs text-gray-500">
                                {producto.categoria} • {producto.num_ordenes} órdenes
                              </p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <p className="text-sm font-bold text-blue-600">
                                {formatCurrency(producto.total_ventas)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {producto.porcentaje_ventas.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay productos disponibles
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Sales Chart */}
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Historial de Ventas (últimos 6 meses)
                    </h3>
                    {chartData.length > 0 ? (
                      <BarChart
                        data={chartData}
                        index="mes"
                        categories={["Ventas"]}
                        colors={["blue"]}
                        valueFormatter={formatCurrency}
                        yAxisWidth={80}
                        className="h-64"
                      />
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No hay datos de ventas disponibles
                      </p>
                    )}
                  </Card>

                  {/* Recent Orders */}
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Órdenes Recientes
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentOrders && recentOrders.length > 0 ? (
                        recentOrders.map((order, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {order.numero_orden}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.fecha)} • {order.num_productos} productos
                              </p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(order.total_ventas)}
                              </p>
                              <Badge
                                color={order.estado === "completada" ? "emerald" : "gray"}
                                className="!text-xs"
                              >
                                {order.estado}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay órdenes disponibles
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
