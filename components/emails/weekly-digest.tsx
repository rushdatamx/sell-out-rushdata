import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Button,
  Preview,
} from '@react-email/components'
import type { DigestData } from '@/lib/digest/types'
import {
  EmailHeader,
  KPICard,
  KPIRow,
  SectionTitle,
  AlertBox,
  EmailFooter,
  VariationText,
} from './shared'

interface WeeklyDigestEmailProps {
  data: DigestData
  insights: string
  unsubscribeUrl: string
  dashboardUrl: string
}

export function WeeklyDigestEmail({
  data,
  insights,
  unsubscribeUrl,
  dashboardUrl,
}: WeeklyDigestEmailProps) {
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const formatNumber = (value: number) => value.toLocaleString('es-MX')

  // Calcular semana del año
  const fechaFin = new Date(data.periodo.fecha_fin)
  const startOfYear = new Date(fechaFin.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(
    ((fechaFin.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  )

  // Separar alertas por tipo
  const alertasCriticas = data.alertas_inventario.filter((a) => a.nivel_alerta === 'critico')
  const alertasBajas = data.alertas_inventario.filter((a) => a.nivel_alerta === 'bajo')

  // Calcular variación de unidades (aproximada)
  const unidadesVariacion =
    data.kpis.unidades_anteriores > 0
      ? ((data.kpis.unidades_actuales - data.kpis.unidades_anteriores) /
          data.kpis.unidades_anteriores) *
        100
      : 0

  // Calcular total de ventas para porcentajes de ciudades
  const totalVentasCiudades = data.resumen_ciudades.reduce((sum, c) => sum + c.ventas, 0)

  return (
    <Html>
      <Head />
      <Preview>
        Resumen Semanal {data.retailer.nombre} - {formatCurrency(data.kpis.ventas_actuales)} (
        {data.kpis.variacion_pct >= 0 ? '+' : ''}
        {data.kpis.variacion_pct.toFixed(1)}%)
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ═══════════════ HEADER ═══════════════ */}
          <EmailHeader
            title="RESUMEN SEMANAL"
            subtitle={`Semana ${weekNumber} del ${fechaFin.getFullYear()}`}
            retailerName={data.retailer.nombre}
            retailerCodigo={data.retailer.codigo}
            periodo={`${data.periodo.fecha_inicio} al ${data.periodo.fecha_fin}`}
          />

          {/* ═══════════════ KPIs PRINCIPALES ═══════════════ */}
          <Section style={kpiSection}>
            <SectionTitle>Resumen Ejecutivo</SectionTitle>
            <KPIRow>
              <KPICard
                label="Ventas"
                value={formatCurrency(data.kpis.ventas_actuales)}
                change={data.kpis.variacion_pct}
              />
              <KPICard
                label="Unidades"
                value={formatNumber(data.kpis.unidades_actuales)}
                change={unidadesVariacion !== 0 ? unidadesVariacion : null}
              />
              <KPICard
                label="Tiendas"
                value={data.kpis.tiendas_activas.toString()}
                subtitle="activas"
              />
              <KPICard
                label="SKUs"
                value={data.kpis.productos_activos.toString()}
                subtitle="activos"
              />
            </KPIRow>
            <Text style={ticketPromedioStyle}>
              Ticket Promedio: <strong>{formatCurrency(data.kpis.ticket_promedio)}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ═══════════════ INSIGHTS IA ═══════════════ */}
          {insights && (
            <>
              <Section style={section}>
                <SectionTitle>Insights de la Semana</SectionTitle>
                <div style={insightsBox}>
                  <Text style={insightsText}>{insights}</Text>
                </div>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* ═══════════════ ALERTAS DE INVENTARIO ═══════════════ */}
          {(alertasCriticas.length > 0 || alertasBajas.length > 0) && (
            <>
              <Section style={section}>
                <SectionTitle>Alertas de Inventario</SectionTitle>

                {alertasCriticas.length > 0 && (
                  <AlertBox
                    type="critical"
                    title="CRITICO - Sin Stock"
                    count={alertasCriticas.length}
                    items={alertasCriticas.map((a) => ({
                      title: a.producto,
                      description: `${a.tienda}, ${a.ciudad || 'N/A'}`,
                    }))}
                  />
                )}

                {alertasBajas.length > 0 && (
                  <AlertBox
                    type="warning"
                    title="ATENCION - Stock Bajo"
                    count={alertasBajas.length}
                    items={alertasBajas.map((a) => ({
                      title: a.producto,
                      description: `${a.stock_actual} uds en ${a.tienda}`,
                    }))}
                  />
                )}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* ═══════════════ TOP 5 PRODUCTOS ═══════════════ */}
          <Section style={section}>
            <SectionTitle>Top 5 Productos</SectionTitle>
            <table style={rankingTable}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>#</th>
                  <th style={{ ...thStyle, width: '47%', textAlign: 'left' }}>Producto</th>
                  <th style={{ ...thStyle, width: '22%', textAlign: 'right' }}>Venta</th>
                  <th style={{ ...thStyle, width: '12%', textAlign: 'center' }}>%</th>
                  <th style={{ ...thStyle, width: '11%', textAlign: 'center' }}>Tiendas</th>
                </tr>
              </thead>
              <tbody>
                {data.top_productos.slice(0, 5).map((p, idx) => (
                  <tr key={idx} style={idx % 2 === 1 ? altRowStyle : {}}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>
                      {idx + 1}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>
                      <Text style={productNameStyle}>{p.producto}</Text>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(p.ventas)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{p.participacion_pct}%</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{p.tiendas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* ═══════════════ TOP 5 TIENDAS ═══════════════ */}
          <Section style={section}>
            <SectionTitle>Top 5 Tiendas</SectionTitle>
            <table style={rankingTable}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>#</th>
                  <th style={{ ...thStyle, width: '40%', textAlign: 'left' }}>Tienda</th>
                  <th style={{ ...thStyle, width: '22%', textAlign: 'left' }}>Ciudad</th>
                  <th style={{ ...thStyle, width: '18%', textAlign: 'right' }}>Venta</th>
                  <th style={{ ...thStyle, width: '12%', textAlign: 'center' }}>SKUs</th>
                </tr>
              </thead>
              <tbody>
                {data.top_tiendas.slice(0, 5).map((t, idx) => (
                  <tr key={idx} style={idx % 2 === 1 ? altRowStyle : {}}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>
                      {idx + 1}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>
                      <Text style={productNameStyle}>{t.tienda}</Text>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#6b7280' }}>
                      {t.ciudad || '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(t.ventas)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {t.productos_vendidos}/{data.kpis.productos_activos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* ═══════════════ PRODUCTOS EN MOVIMIENTO ═══════════════ */}
          <Section style={section}>
            <SectionTitle>Productos en Movimiento</SectionTitle>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  {/* Columna CRECIENDO */}
                  <td style={movementColumnStyle}>
                    <Text style={movementTitleGreen}>▲ CRECIENDO</Text>
                    {data.productos_creciendo.length > 0 ? (
                      data.productos_creciendo.slice(0, 3).map((p, idx) => (
                        <Text key={idx} style={movementItemStyle}>
                          {p.producto.length > 25
                            ? p.producto.substring(0, 25) + '...'
                            : p.producto}{' '}
                          <VariationText value={p.variacion_pct} />
                        </Text>
                      ))
                    ) : (
                      <Text style={noDataStyle}>Sin productos en crecimiento</Text>
                    )}
                  </td>

                  {/* Columna CAYENDO */}
                  <td style={movementColumnStyle}>
                    <Text style={movementTitleRed}>▼ CAYENDO</Text>
                    {data.productos_cayendo.length > 0 ? (
                      data.productos_cayendo.slice(0, 3).map((p, idx) => (
                        <Text key={idx} style={movementItemStyle}>
                          {p.producto.length > 25
                            ? p.producto.substring(0, 25) + '...'
                            : p.producto}{' '}
                          <VariationText value={p.variacion_pct} />
                        </Text>
                      ))
                    ) : (
                      <Text style={noDataStyle}>Ninguno esta semana</Text>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* ═══════════════ VENTAS POR CIUDAD ═══════════════ */}
          {data.resumen_ciudades.length > 0 && (
            <>
              <Section style={section}>
                <SectionTitle>Ventas por Ciudad</SectionTitle>
                <table style={rankingTable}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '35%', textAlign: 'left' }}>Ciudad</th>
                      <th style={{ ...thStyle, width: '15%', textAlign: 'center' }}>Tiendas</th>
                      <th style={{ ...thStyle, width: '28%', textAlign: 'right' }}>Venta</th>
                      <th style={{ ...thStyle, width: '22%', textAlign: 'center' }}>% Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.resumen_ciudades.slice(0, 5).map((c, idx) => (
                      <tr key={idx} style={idx % 2 === 1 ? altRowStyle : {}}>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: '500' }}>
                          {c.ciudad}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{c.tiendas}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>
                          {formatCurrency(c.ventas)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {totalVentasCiudades > 0
                            ? ((c.ventas / totalVentasCiudades) * 100).toFixed(0)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* ═══════════════ TENDENCIA 6 MESES ═══════════════ */}
          {data.tendencia_6_meses && data.tendencia_6_meses.length > 0 && (
            <>
              <Section style={section}>
                <SectionTitle>Tendencia de Ventas (6 meses)</SectionTitle>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {/* Barras de tendencia */}
                    <tr>
                      {data.tendencia_6_meses.map((mes, idx) => {
                        const maxVentas = Math.max(...data.tendencia_6_meses.map(m => m.ventas))
                        const barHeight = maxVentas > 0 ? Math.round((mes.ventas / maxVentas) * 80) : 0
                        const isLast = idx === data.tendencia_6_meses.length - 1
                        return (
                          <td key={idx} style={trendCellStyle}>
                            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: `${barHeight}px`,
                                  backgroundColor: isLast ? '#0066FF' : '#e5e7eb',
                                  borderRadius: '4px 4px 0 0',
                                }}
                              />
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                    {/* Valores */}
                    <tr>
                      {data.tendencia_6_meses.map((mes, idx) => {
                        const isLast = idx === data.tendencia_6_meses.length - 1
                        return (
                          <td key={idx} style={{ ...trendValueStyle, fontWeight: isLast ? '700' : '400', color: isLast ? '#0066FF' : '#6b7280' }}>
                            {formatCurrency(mes.ventas)}
                          </td>
                        )
                      })}
                    </tr>
                    {/* Meses */}
                    <tr>
                      {data.tendencia_6_meses.map((mes, idx) => {
                        const isLast = idx === data.tendencia_6_meses.length - 1
                        return (
                          <td key={idx} style={{ ...trendLabelStyle, fontWeight: isLast ? '600' : '400' }}>
                            {mes.mes_nombre}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* ═══════════════ CTA BUTTON ═══════════════ */}
          <Section style={ctaSection}>
            <Button href={dashboardUrl} style={ctaButton}>
              Ver Dashboard Completo →
            </Button>
          </Section>

          {/* ═══════════════ FOOTER ═══════════════ */}
          <EmailFooter
            unsubscribeUrl={unsubscribeUrl}
            settingsUrl={`${dashboardUrl.replace('/dashboard', '')}/configuracion/alertas`}
          />
        </Container>
      </Body>
    </Html>
  )
}

// ═══════════════ ESTILOS ═══════════════

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
}

const section = {
  padding: '24px 28px',
}

const kpiSection = {
  padding: '24px 28px',
  backgroundColor: '#f9fafb',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '0',
}

const ticketPromedioStyle = {
  textAlign: 'center' as const,
  fontSize: '14px',
  color: '#6b7280',
  margin: '16px 0 0 0',
}

const insightsBox = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #0066FF',
  padding: '16px',
  borderRadius: '4px',
}

const insightsText = {
  fontSize: '14px',
  lineHeight: '1.7',
  color: '#1e3a5f',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}

const rankingTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const thStyle = {
  padding: '10px 8px',
  backgroundColor: '#f3f4f6',
  fontWeight: '600',
  color: '#374151',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  borderBottom: '2px solid #e5e7eb',
}

const tdStyle = {
  padding: '12px 8px',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
}

const altRowStyle = {
  backgroundColor: '#fafafa',
}

const productNameStyle = {
  margin: '0',
  fontSize: '13px',
  color: '#1a1a1a',
}

const movementColumnStyle = {
  width: '50%',
  verticalAlign: 'top' as const,
  padding: '0 12px',
}

const movementTitleGreen = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#059669',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
}

const movementTitleRed = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#dc2626',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
}

const movementItemStyle = {
  fontSize: '13px',
  color: '#374151',
  margin: '0 0 8px 0',
  lineHeight: '1.4',
}

const noDataStyle = {
  fontSize: '13px',
  color: '#9ca3af',
  fontStyle: 'italic' as const,
  margin: '0',
}

const trendCellStyle = {
  textAlign: 'center' as const,
  padding: '0 4px',
  verticalAlign: 'bottom' as const,
}

const trendValueStyle = {
  textAlign: 'center' as const,
  fontSize: '11px',
  padding: '8px 2px 4px 2px',
}

const trendLabelStyle = {
  textAlign: 'center' as const,
  fontSize: '12px',
  color: '#374151',
  padding: '0 2px',
}

const ctaSection = {
  padding: '32px 28px',
  textAlign: 'center' as const,
}

const ctaButton = {
  backgroundColor: '#0066FF',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '14px 32px',
  display: 'inline-block',
}

export default WeeklyDigestEmail
