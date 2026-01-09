import { Section, Text, Link } from '@react-email/components'

interface EmailFooterProps {
  unsubscribeUrl: string
  settingsUrl: string
}

export function EmailFooter({ unsubscribeUrl, settingsUrl }: EmailFooterProps) {
  return (
    <Section style={footerContainer}>
      <table style={footerTable}>
        <tbody>
          <tr>
            <td style={logoCell}>
              <Text style={brandText}>RushData</Text>
              <Text style={taglineText}>Analytics de Sell-Out para Retail</Text>
            </td>
          </tr>
          <tr>
            <td style={linksCell}>
              <Link href={unsubscribeUrl} style={linkStyle}>
                Cancelar suscripcion
              </Link>
              <span style={dividerStyle}>|</span>
              <Link href={settingsUrl} style={linkStyle}>
                Configurar alertas
              </Link>
            </td>
          </tr>
          <tr>
            <td style={copyrightCell}>
              <Text style={copyrightText}>
                © {new Date().getFullYear()} RushData. Todos los derechos reservados.
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  )
}

// Estilos
const footerContainer = {
  backgroundColor: '#f9fafb',
  padding: '24px',
  borderTop: '1px solid #e5e7eb',
}

const footerTable = {
  width: '100%',
}

const logoCell = {
  textAlign: 'center' as const,
  paddingBottom: '16px',
}

const brandText = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#0066FF',
  margin: '0 0 4px 0',
}

const taglineText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
}

const linksCell = {
  textAlign: 'center' as const,
  paddingBottom: '16px',
}

const linkStyle = {
  color: '#0066FF',
  fontSize: '12px',
  textDecoration: 'underline',
}

const dividerStyle = {
  color: '#d1d5db',
  margin: '0 12px',
}

const copyrightCell = {
  textAlign: 'center' as const,
}

const copyrightText = {
  fontSize: '11px',
  color: '#9ca3af',
  margin: '0',
}

export default EmailFooter
