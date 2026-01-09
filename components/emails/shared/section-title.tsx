import { Text } from '@react-email/components'

interface SectionTitleProps {
  children: React.ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <table style={titleTable}>
      <tbody>
        <tr>
          <td style={lineCell}>
            <div style={line} />
          </td>
          <td style={textCell}>
            <Text style={titleStyle}>{children}</Text>
          </td>
          <td style={lineCell}>
            <div style={line} />
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// Estilos
const titleTable = {
  width: '100%',
  marginBottom: '20px',
}

const lineCell = {
  width: '30%',
  verticalAlign: 'middle' as const,
}

const textCell = {
  width: '40%',
  textAlign: 'center' as const,
  padding: '0 12px',
}

const line = {
  height: '1px',
  backgroundColor: '#e5e7eb',
}

const titleStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#374151',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  whiteSpace: 'nowrap' as const,
}

export default SectionTitle
