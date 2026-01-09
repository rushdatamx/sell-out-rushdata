import { Text } from '@react-email/components'

interface RankingColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface RankingTableProps<T> {
  columns: RankingColumn[]
  data: T[]
  renderCell: (item: T, columnKey: string, index: number) => React.ReactNode
  maxRows?: number
}

export function RankingTable<T>({
  columns,
  data,
  renderCell,
  maxRows = 5,
}: RankingTableProps<T>) {
  const displayData = data.slice(0, maxRows)

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{
                ...headerCell,
                textAlign: col.align || 'left',
                width: col.width,
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {displayData.map((item, rowIndex) => (
          <tr key={rowIndex} style={rowIndex % 2 === 1 ? altRowStyle : {}}>
            {columns.map((col) => (
              <td
                key={col.key}
                style={{
                  ...dataCell,
                  textAlign: col.align || 'left',
                }}
              >
                {renderCell(item, col.key, rowIndex)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Componente helper para texto con variación
interface VariationTextProps {
  value: number
  showArrow?: boolean
}

export function VariationText({ value, showArrow = true }: VariationTextProps) {
  const isPositive = value >= 0
  const arrow = showArrow ? (isPositive ? '▲' : '▼') : ''
  const color = isPositive ? '#059669' : '#dc2626'
  const sign = isPositive ? '+' : ''

  return (
    <Text style={{ ...variationStyle, color }}>
      {arrow} {sign}
      {value.toFixed(1)}%
    </Text>
  )
}

// Estilos
const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '13px',
}

const headerCell = {
  padding: '10px 8px',
  backgroundColor: '#f3f4f6',
  fontWeight: '600',
  color: '#374151',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  borderBottom: '2px solid #e5e7eb',
}

const dataCell = {
  padding: '12px 8px',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
}

const altRowStyle = {
  backgroundColor: '#fafafa',
}

const variationStyle = {
  fontSize: '12px',
  fontWeight: '600',
  margin: '0',
  display: 'inline' as const,
}

export default RankingTable
