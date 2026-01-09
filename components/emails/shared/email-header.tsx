import { Section, Img, Text, Heading } from '@react-email/components'

interface EmailHeaderProps {
  title: string
  subtitle: string
  retailerName: string
  periodo: string
  logoUrl?: string
}

export function EmailHeader({
  title,
  subtitle,
  retailerName,
  periodo,
  logoUrl,
}: EmailHeaderProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const logo = logoUrl || `${baseUrl}/logo.png`

  return (
    <Section style={headerContainer}>
      <table style={headerTable}>
        <tbody>
          <tr>
            <td style={logoCell}>
              <Img
                src={logo}
                alt="RushData"
                width="140"
                height="40"
                style={logoStyle}
              />
            </td>
          </tr>
          <tr>
            <td style={titleCell}>
              <Heading as="h1" style={titleStyle}>
                {title}
              </Heading>
              <Text style={subtitleStyle}>{subtitle}</Text>
            </td>
          </tr>
          <tr>
            <td style={metaCell}>
              <Text style={retailerStyle}>{retailerName}</Text>
              <Text style={periodoStyle}>{periodo}</Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  )
}

// Estilos
const headerContainer = {
  backgroundColor: '#0066FF',
  padding: '32px 24px',
}

const headerTable = {
  width: '100%',
}

const logoCell = {
  textAlign: 'center' as const,
  paddingBottom: '20px',
}

const logoStyle = {
  margin: '0 auto',
}

const titleCell = {
  textAlign: 'center' as const,
  paddingBottom: '12px',
}

const titleStyle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 4px 0',
  letterSpacing: '-0.5px',
}

const subtitleStyle = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
  margin: '0',
}

const metaCell = {
  textAlign: 'center' as const,
}

const retailerStyle = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 4px 0',
}

const periodoStyle = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '13px',
  margin: '0',
}

export default EmailHeader
