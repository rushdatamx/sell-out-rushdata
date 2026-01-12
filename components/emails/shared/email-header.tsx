import { Section, Img, Text, Heading } from '@react-email/components'

interface EmailHeaderProps {
  title: string
  subtitle: string
  retailerName: string
  retailerCodigo?: string
  periodo: string
}

// Mapeo de retailer a su logo
const RETAILER_LOGOS: Record<string, string> = {
  heb: '/heblogo.png',
  merco: '/mercologo.png',
}

export function EmailHeader({
  title,
  subtitle,
  retailerName,
  retailerCodigo,
  periodo,
}: EmailHeaderProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retail.rushdata.com.mx'
  const iconoRushData = `${baseUrl}/icono.png`
  const retailerLogo = retailerCodigo && RETAILER_LOGOS[retailerCodigo]
    ? `${baseUrl}${RETAILER_LOGOS[retailerCodigo]}`
    : null

  return (
    <Section style={headerContainer}>
      {/* Fila de logos: RushData (izq) + Retailer (der) */}
      <table width="100%" cellPadding="0" cellSpacing="0" style={logosTable}>
        <tbody>
          <tr>
            <td align="left" valign="top" width="50%">
              <Img
                src={iconoRushData}
                alt="RushData"
                width="40"
                height="40"
                style={iconoStyle}
              />
            </td>
            <td align="right" valign="top" width="50%">
              {retailerLogo && (
                <Img
                  src={retailerLogo}
                  alt={retailerName}
                  width="80"
                  height="40"
                />
              )}
            </td>
          </tr>
        </tbody>
      </table>
      {/* Título y subtítulo */}
      <table style={contentTable}>
        <tbody>
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
              <Text style={retailerTextStyle}>{retailerName}</Text>
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
  backgroundColor: '#f5f5f5',
  padding: '32px 24px',
  borderBottom: '3px solid #e5e5e5',
}

const logosTable = {
  width: '100%',
  marginBottom: '24px',
}

const logoLeftCell = {
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
}

const logoRightCell = {
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
}

const iconoStyle = {
  borderRadius: '8px',
}

const retailerLogoStyle = {
  objectFit: 'contain' as const,
}

const contentTable = {
  width: '100%',
}

const titleCell = {
  textAlign: 'center' as const,
  paddingBottom: '12px',
}

const titleStyle = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 4px 0',
  letterSpacing: '-0.5px',
}

const subtitleStyle = {
  color: '#666666',
  fontSize: '14px',
  margin: '0',
}

const metaCell = {
  textAlign: 'center' as const,
}

const retailerTextStyle = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 4px 0',
}

const periodoStyle = {
  color: '#666666',
  fontSize: '13px',
  margin: '0',
}

export default EmailHeader
