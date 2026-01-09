import { Text } from '@react-email/components'

interface KPICardProps {
  label: string
  value: string
  change?: number | null
  subtitle?: string
}

export function KPICard({ label, value, change, subtitle }: KPICardProps) {
  const hasChange = change !== undefined && change !== null
  const isPositive = hasChange && change >= 0
  const arrow = hasChange ? (isPositive ? '▲' : '▼') : ''
  const changeColor = isPositive ? '#059669' : '#dc2626'

  return (
    <td style={cardCell}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={valueStyle}>{value}</Text>
      {hasChange ? (
        <Text style={{ ...changeStyle, color: changeColor }}>
          {arrow} {Math.abs(change).toFixed(1)}% vs ant.
        </Text>
      ) : subtitle ? (
        <Text style={subtitleStyle}>{subtitle}</Text>
      ) : null}
    </td>
  )
}

// Componente para renderizar una fila de KPIs
interface KPIRowProps {
  children: React.ReactNode
}

export function KPIRow({ children }: KPIRowProps) {
  return (
    <table style={rowTable}>
      <tbody>
        <tr>{children}</tr>
      </tbody>
    </table>
  )
}

// Estilos
const rowTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const cardCell = {
  width: '25%',
  textAlign: 'center' as const,
  padding: '16px 8px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 6px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const valueStyle = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 4px 0',
  letterSpacing: '-0.5px',
}

const changeStyle = {
  fontSize: '12px',
  fontWeight: '600',
  margin: '0',
}

const subtitleStyle = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
}

export default KPICard
