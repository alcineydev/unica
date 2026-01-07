import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface EmailChangeConfirmationProps {
  userName: string
  oldEmail: string
  newEmail: string
  confirmUrl: string
}

export function EmailChangeConfirmation({
  userName,
  oldEmail,
  newEmail,
  confirmUrl,
}: EmailChangeConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirme a alteração do seu e-mail - UNICA</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={logoContainer}>
              <Text style={logoText}>UNICA</Text>
            </div>
            <Text style={tagline}>Clube de Benefícios</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>
              Confirmação de Alteração de E-mail
            </Heading>

            <Text style={paragraph}>
              Olá {userName},
            </Text>

            <Text style={paragraph}>
              Recebemos uma solicitação para alterar o e-mail da sua conta UNICA.
            </Text>

            <Section style={infoBox}>
              <Text style={infoLabel}>
                <strong>E-mail anterior:</strong> {oldEmail}
              </Text>
              <Text style={infoValue}>
                <strong>Novo e-mail:</strong> {newEmail}
              </Text>
            </Section>

            <Text style={paragraph}>
              Clique no botão abaixo para confirmar esta alteração:
            </Text>

            <Section style={buttonContainer}>
              <Button href={confirmUrl} style={button}>
                Confirmar Alteração
              </Button>
            </Section>

            <Text style={smallText}>
              Este link expira em 24 horas. Se você não solicitou essa alteração, ignore este e-mail.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} UNICA Clube de Benefícios
            </Text>
            <Text style={footerText}>
              Este é um e-mail automático.
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
  backgroundColor: '#10B981',
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

const heading = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  color: '#1e293b',
  margin: '0 0 24px',
}

const paragraph = {
  fontSize: '16px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '16px 0',
}

const infoBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const infoLabel = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
}

const infoValue = {
  fontSize: '14px',
  color: '#64748b',
  margin: '8px 0 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
}

const smallText = {
  fontSize: '14px',
  color: '#94a3b8',
  lineHeight: '1.5',
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

export default EmailChangeConfirmation
