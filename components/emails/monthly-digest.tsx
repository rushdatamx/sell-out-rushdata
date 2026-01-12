import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Preview,
} from '@react-email/components'
import type { DigestData } from '@/lib/digest/types'

interface MonthlyDigestEmailProps {
  data: DigestData
  insights: string
  unsubscribeUrl: string
  dashboardUrl: string
}

export function MonthlyDigestEmail({
  data,
  insights,
  unsubscribeUrl,
  dashboardUrl,
}: MonthlyDigestEmailProps) {
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatNumber = (value: number) => value.toLocaleString('es-MX')

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const alertasCriticas = data.alertas_inventario.filter((a) => a.nivel_alerta === 'critico').length
  const alertasBajas = data.alertas_inventario.filter((a) => a.nivel_alerta === 'bajo').length

  return (
    <Html>
      <Head />
      <Preview>
        Resumen mensual de {data.retailer.nombre} - {formatCurrency(data.kpis.ventas_actuales)} (
        {formatPercent(data.kpis.variacion_pct)})
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>RushData</Text>
            <Heading style={title}>Resumen Mensual</Heading>
            <Text style={retailerName}>{data.retailer.nombre}</Text>
            <Text style={periodo}>
              Periodo: {data.periodo.fecha_inicio} al {data.periodo.fecha_fin}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* KPIs Principales */}
          <Section style={kpiSection}>
            <table style={kpiTable}>
              <tbody>
                <tr>
                  <td style={kpiCell}>
                    <Text style={kpiLabel}>VENTAS DEL MES</Text>
                    <Text style={kpiValueLarge}>{formatCurrency(data.kpis.ventas_actuales)}</Text>
                    <Text style={kpiChange(data.kpis.variacion_pct)}>
                      {formatPercent(data.kpis.variacion_pct)} vs mes anterior
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>

            <table style={{ ...kpiTable, marginTop: '24px' }}>
              <tbody>
                <tr>
                  <td style={kpiCellSmall}>
                    <Text style={kpiLabelSmall}>Unidades</Text>
                    <Text style={kpiValueSmall}>{formatNumber(data.kpis.unidades_actuales)}</Text>
                  </td>
                  <td style={kpiCellSmall}>
                    <Text style={kpiLabelSmall}>Tiendas</Text>
                    <Text style={kpiValueSmall}>{data.kpis.tiendas_activas}</Text>
                  </td>
                  <td style={kpiCellSmall}>
                    <Text style={kpiLabelSmall}>SKUs</Text>
                    <Text style={kpiValueSmall}>{data.kpis.productos_activos}</Text>
                  </td>
                  <td style={kpiCellSmall}>
                    <Text style={kpiLabelSmall}>Ticket Prom.</Text>
                    <Text style={kpiValueSmall}>{formatCurrency(data.kpis.ticket_promedio)}</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* AI Analysis */}
          {insights && (
            <>
              <Section style={section}>
                <Heading as="h2" style={sectionTitle}>
                  Analisis del Mes
                </Heading>
                <div style={analysisBox}>
                  <Text style={analysisText}>{insights}</Text>
                </div>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* Productos: Creciendo y Cayendo */}
          <Section style={section}>
            <table style={twoColumnTable}>
              <tbody>
                <tr>
                  <td style={twoColumnCell}>
                    <Text style={columnTitle}>Productos Creciendo</Text>
                    {data.productos_creciendo.length > 0 ? (
                      data.productos_creciendo.map((p, i) => (
                        <Text key={i} style={productGrowing}>
                          {p.producto}: {formatPercent(p.variacion_pct)}
                        </Text>
                      ))
                    ) : (
                      <Text style={noData}>Sin datos</Text>
                    )}
                  </td>
                  <td style={twoColumnCell}>
                    <Text style={columnTitle}>Productos Cayendo</Text>
                    {data.productos_cayendo.length > 0 ? (
                      data.productos_cayendo.map((p, i) => (
                        <Text key={i} style={productFalling}>
                          {p.producto}: {p.variacion_pct.toFixed(1)}%
                        </Text>
                      ))
                    ) : (
                      <Text style={noData}>Ninguno</Text>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* Top Productos */}
          <Section style={section}>
            <Heading as="h2" style={sectionTitle}>
              Top 5 Productos
            </Heading>
            <table style={rankingTable}>
              <thead>
                <tr>
                  <th style={tableHeader}>#</th>
                  <th style={{ ...tableHeader, textAlign: 'left' as const }}>Producto</th>
                  <th style={tableHeader}>Ventas</th>
                  <th style={tableHeader}>%</th>
                </tr>
              </thead>
              <tbody>
                {data.top_productos.slice(0, 5).map((p, i) => (
                  <tr key={i}>
                    <td style={tableCell}>{i + 1}</td>
                    <td style={{ ...tableCell, textAlign: 'left' as const }}>{p.producto}</td>
                    <td style={tableCell}>{formatCurrency(p.ventas)}</td>
                    <td style={tableCell}>{p.participacion_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* Top Tiendas */}
          <Section style={section}>
            <Heading as="h2" style={sectionTitle}>
              Top 5 Tiendas
            </Heading>
            <table style={rankingTable}>
              <thead>
                <tr>
                  <th style={tableHeader}>#</th>
                  <th style={{ ...tableHeader, textAlign: 'left' as const }}>Tienda</th>
                  <th style={{ ...tableHeader, textAlign: 'left' as const }}>Ciudad</th>
                  <th style={tableHeader}>Ventas</th>
                </tr>
              </thead>
              <tbody>
                {data.top_tiendas.slice(0, 5).map((t, i) => (
                  <tr key={i}>
                    <td style={tableCell}>{i + 1}</td>
                    <td style={{ ...tableCell, textAlign: 'left' as const }}>{t.tienda}</td>
                    <td style={{ ...tableCell, textAlign: 'left' as const }}>{t.ciudad || '-'}</td>
                    <td style={tableCell}>{formatCurrency(t.ventas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Resumen por Ciudades */}
          {data.resumen_ciudades.length > 0 && (
            <>
              <Hr style={divider} />
              <Section style={section}>
                <Heading as="h2" style={sectionTitle}>
                  Ventas por Ciudad
                </Heading>
                {data.resumen_ciudades.slice(0, 5).map((c, i) => (
                  <Text key={i} style={listItem}>
                    {c.ciudad}: {formatCurrency(c.ventas)} ({c.tiendas} tiendas)
                  </Text>
                ))}
              </Section>
            </>
          )}

          {/* Alertas de Inventario */}
          {(alertasCriticas > 0 || alertasBajas > 0) && (
            <>
              <Hr style={divider} />
              <Section style={alertSection}>
                <Heading as="h2" style={sectionTitle}>
                  Alertas de Inventario
                </Heading>
                {alertasCriticas > 0 && (
                  <Text style={alertCritical}>
                    CRITICO: {alertasCriticas} producto(s) sin stock
                  </Text>
                )}
                {alertasBajas > 0 && (
                  <Text style={alertWarning}>
                    ATENCION: {alertasBajas} producto(s) con menos de 3 dias de inventario
                  </Text>
                )}
                <Text style={alertLink}>
                  <Link href={`${dashboardUrl}/inventario`} style={linkStyle}>
                    Ver detalle en inventario
                  </Link>
                </Text>
              </Section>
            </>
          )}

          {/* Tendencia 6 Meses */}
          {data.tendencia_6_meses && data.tendencia_6_meses.length > 0 && (
            <>
              <Hr style={divider} />
              <Section style={section}>
                <Heading as="h2" style={sectionTitle}>
                  Tendencia de Ventas (6 meses)
                </Heading>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
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
                                  backgroundColor: isLast ? '#6366f1' : '#e5e7eb',
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
                          <td key={idx} style={{ ...trendValueStyle, fontWeight: isLast ? '700' : '400', color: isLast ? '#6366f1' : '#6b7280' }}>
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
            </>
          )}

          <Hr style={divider} />

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={dashboardUrl} style={ctaButton}>
              Ver Dashboard Completo
            </Link>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              RushData - Analytics de Sell-Out
              <br />
              <Link href={unsubscribeUrl} style={footerLink}>
                Cancelar suscripcion
              </Link>
              {' | '}
              <Link href={`${dashboardUrl}/configuracion/alertas`} style={footerLink}>
                Configurar alertas
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 48px',
  textAlign: 'center' as const,
  backgroundColor: '#1a1a1a',
}

const logoText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#6366f1',
  margin: '0 0 16px 0',
}

const title = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0 0 8px 0',
}

const retailerName = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#d1d5db',
  margin: '0 0 4px 0',
}

const periodo = {
  fontSize: '14px',
  color: '#9ca3af',
  margin: '0',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '0',
}

const section = {
  padding: '24px 48px',
}

const alertSection = {
  padding: '24px 48px',
  backgroundColor: '#fef2f2',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
  margin: '0 0 16px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const kpiSection = {
  padding: '32px 48px',
  backgroundColor: '#f9fafb',
}

const kpiTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const kpiCell = {
  textAlign: 'center' as const,
}

const kpiCellSmall = {
  textAlign: 'center' as const,
  padding: '0 8px',
  width: '25%',
}

const kpiLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
}

const kpiLabelSmall = {
  fontSize: '11px',
  fontWeight: '500',
  color: '#9ca3af',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
}

const kpiValueLarge = {
  fontSize: '36px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
}

const kpiValueSmall = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#374151',
  margin: '0',
}

const kpiChange = (value: number) => ({
  fontSize: '14px',
  fontWeight: '600',
  color: value >= 0 ? '#059669' : '#dc2626',
  margin: '0',
})

const analysisBox = {
  backgroundColor: '#f3f4f6',
  padding: '16px',
  borderRadius: '8px',
  borderLeft: '4px solid #6366f1',
}

const analysisText = {
  fontSize: '14px',
  lineHeight: '1.7',
  color: '#374151',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}

const twoColumnTable = {
  width: '100%',
}

const twoColumnCell = {
  width: '50%',
  verticalAlign: 'top' as const,
  padding: '0 12px',
}

const columnTitle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 12px 0',
}

const productGrowing = {
  fontSize: '13px',
  color: '#059669',
  margin: '0 0 6px 0',
}

const productFalling = {
  fontSize: '13px',
  color: '#dc2626',
  margin: '0 0 6px 0',
}

const noData = {
  fontSize: '13px',
  color: '#9ca3af',
  fontStyle: 'italic' as const,
  margin: '0',
}

const rankingTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '13px',
}

const tableHeader = {
  padding: '8px 12px',
  backgroundColor: '#f3f4f6',
  fontWeight: '600',
  color: '#374151',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e5e7eb',
}

const tableCell = {
  padding: '10px 12px',
  borderBottom: '1px solid #f3f4f6',
  textAlign: 'center' as const,
  color: '#4b5563',
}

const listItem = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 8px 0',
}

const alertCritical = {
  fontSize: '14px',
  color: '#dc2626',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const alertWarning = {
  fontSize: '14px',
  color: '#d97706',
  fontWeight: '500',
  margin: '0 0 8px 0',
}

const alertLink = {
  margin: '12px 0 0 0',
}

const linkStyle = {
  color: '#6366f1',
  fontSize: '13px',
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
  padding: '32px 48px',
  textAlign: 'center' as const,
}

const ctaButton = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '14px 32px',
  display: 'inline-block',
}

const footer = {
  padding: '24px 48px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
  lineHeight: '1.6',
}

const footerLink = {
  color: '#6366f1',
  textDecoration: 'underline',
}

export default MonthlyDigestEmail
