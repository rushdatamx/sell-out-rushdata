import { Section, Text } from '@react-email/components'

type AlertType = 'critical' | 'warning' | 'info'

interface AlertItem {
  title: string
  description: string
}

interface AlertBoxProps {
  type: AlertType
  title: string
  count: number
  items?: AlertItem[]
}

const ALERT_COLORS = {
  critical: {
    bg: '#fee2e2',
    border: '#dc2626',
    title: '#991b1b',
    text: '#7f1d1d',
    icon: '●',
  },
  warning: {
    bg: '#fef3c7',
    border: '#d97706',
    title: '#92400e',
    text: '#78350f',
    icon: '●',
  },
  info: {
    bg: '#dbeafe',
    border: '#2563eb',
    title: '#1e40af',
    text: '#1e3a5f',
    icon: '●',
  },
}

export function AlertBox({ type, title, count, items }: AlertBoxProps) {
  const colors = ALERT_COLORS[type]

  return (
    <Section
      style={{
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        padding: '14px 16px',
        marginBottom: '12px',
        borderRadius: '4px',
      }}
    >
      <Text
        style={{
          color: colors.title,
          fontSize: '13px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          textTransform: 'uppercase' as const,
        }}
      >
        <span style={{ color: colors.border, marginRight: '6px' }}>{colors.icon}</span>
        {title} ({count})
      </Text>
      {items && items.length > 0 && (
        <table style={{ width: '100%' }}>
          <tbody>
            {items.slice(0, 5).map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '2px 0' }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: '13px',
                      margin: '0',
                    }}
                  >
                    • {item.title}
                    {item.description && (
                      <span style={{ color: colors.text, opacity: 0.8 }}>
                        {' '}
                        ({item.description})
                      </span>
                    )}
                  </Text>
                </td>
              </tr>
            ))}
            {items.length > 5 && (
              <tr>
                <td style={{ padding: '4px 0 0 0' }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: '12px',
                      fontStyle: 'italic' as const,
                      margin: '0',
                    }}
                  >
                    ... y {items.length - 5} mas
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Section>
  )
}

export default AlertBox
