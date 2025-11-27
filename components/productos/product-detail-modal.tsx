"use client"

import { X, Tag, Package, DollarSign, TrendingUp, Users, ShoppingCart, Calendar } from "lucide-react"
import { Card, Metric, Text, Badge, BarChart } from "@tremor/react"
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
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function ProductDetailModal({ tenantId, productoId, onClose }: ProductDetailModalProps) {
  const { data: product, isLoading } = useProductDetail(tenantId, productoId)
  const { data: salesHistory } = useProductSalesHistory(tenantId, productoId, 6)
  const { data: topClients } = useProductTopClients(tenantId, productoId, 5)
  const { data: recentOrders } = useProductRecentOrders(tenantId, productoId, 10)

  if (!productoId) return null

  const getStatusColor = (status: boolean) => {
    return status ? "emerald" : "gray"
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
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {isLoading ? (
              <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {product?.nombre}
                  </h2>
                  <p className="text-sm text-gray-500">{product?.sku}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color="indigo">{product?.categoria}</Badge>
                  <Badge color={getStatusColor(product?.activo || false)}>
                    {product?.activo ? "Activo" : "Inactivo"}
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
              <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
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
                        {formatCurrency(product?.lifetime_value || 0)}
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
                        {product?.total_ordenes || 0}
                      </Metric>
                    </div>
                  </div>
                </Card>

                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <Text className="!text-xs !text-gray-500">Total Clientes</Text>
                      <Metric className="!text-lg !text-gray-900">
                        {product?.total_clientes || 0}
                      </Metric>
                    </div>
                  </div>
                </Card>

                <Card className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <Text className="!text-xs !text-gray-500">Precio Venta</Text>
                      <Metric className="!text-lg !text-gray-900">
                        {formatCurrency(product?.precio_venta_sugerido || 0)}
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
                        <Tag className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Clasificación</p>
                          <p className="text-sm text-gray-900">
                            {product?.categoria}
                            {product?.subcategoria && ` • ${product.subcategoria}`}
                          </p>
                        </div>
                      </div>

                      {product?.marca && (
                        <div className="flex items-start gap-3">
                          <Package className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Marca</p>
                            <p className="text-sm text-gray-900">{product.marca}</p>
                          </div>
                        </div>
                      )}

                      {product?.linea_producto && (
                        <div className="flex items-start gap-3">
                          <Package className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Línea de Producto</p>
                            <p className="text-sm text-gray-900">{product.linea_producto}</p>
                          </div>
                        </div>
                      )}

                      {product?.descripcion && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Descripción</p>
                          <p className="text-sm text-gray-900">{product.descripcion}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Unidad</p>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.unidad_medida || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Piezas/Caja</p>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.piezas_por_caja || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Peso (kg)</p>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.peso_kg || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Código Barras</p>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.codigo_barras || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Costo Producción</p>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.costo_produccion
                              ? formatCurrency(product.costo_produccion)
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Margen Objetivo</p>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.margen_objetivo ? `${product.margen_objetivo}%` : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Días Producción</p>
                          <p className="text-sm font-medium text-gray-900">
                            {product?.dias_produccion
                              ? `${product.dias_produccion} días`
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Última Venta</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(product?.ultima_venta || null)}
                          </p>
                        </div>
                      </div>

                      {product?.perecedero && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <Badge color="orange">Perecedero</Badge>
                            {product?.dias_vida_util && (
                              <span className="text-xs text-gray-600">
                                Vida útil: {product.dias_vida_util} días
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Top Clientes */}
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Top 5 Clientes
                    </h3>
                    <div className="space-y-3">
                      {topClients && topClients.length > 0 ? (
                        topClients.map((cliente) => (
                          <div
                            key={cliente.cliente_id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {cliente.nombre_cliente}
                              </p>
                              <p className="text-xs text-gray-500">
                                {cliente.tipo_cliente} • {cliente.num_ordenes} órdenes
                              </p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <p className="text-sm font-bold text-indigo-600">
                                {formatCurrency(cliente.total_ventas)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {cliente.porcentaje_ventas.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay clientes disponibles
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
                        colors={["indigo"]}
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
                                {formatDate(order.fecha)} • {order.cliente_nombre}
                              </p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(order.total_ventas)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {Math.round(order.unidades)} unidades
                              </p>
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
