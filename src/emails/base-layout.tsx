import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header com Logo */}
          <Section style={header}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td align="center">
                  <div style={logoContainer}>
                    <Text style={logoText}>UNICA</Text>
                  </div>
                  <Text style={tagline}>Clube de Benefícios</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Conteúdo */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} UNICA Clube de Benefícios
            </Text>
            <Text style={footerText}>
              Este é um e-mail automático. Em caso de dúvidas, entre em contato pelo suporte@unicabeneficios.com.br
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const header = {
  padding: '32px 0',
  textAlign: 'center' as const,
}

const logoContainer = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#2563eb',
  borderRadius: '12px',
}

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
}

const tagline = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '8px',
}

const content = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '40px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
}

const footer = {
  padding: '32px 0',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '4px 0',
}
