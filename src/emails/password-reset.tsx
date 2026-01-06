import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface PasswordResetEmailProps {
  name: string
  resetLink: string
  expiresIn?: string
}

export function PasswordResetEmail({
  name = 'Usuário',
  resetLink = 'https://app.unicabeneficios.com.br/redefinir-senha',
  expiresIn = '1 hora',
}: PasswordResetEmailProps) {
  return (
    <BaseLayout preview="Redefina sua senha - UNICA">
      <Heading style={heading}>Redefinir Senha</Heading>

      <Text style={paragraph}>
        Olá, <strong>{name}</strong>!
      </Text>

      <Text style={paragraph}>
        Recebemos uma solicitação para redefinir a senha da sua conta no UNICA Clube de Benefícios.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={resetLink}>
          Redefinir Senha
        </Button>
      </Section>

      <Text style={paragraph}>
        Este link expira em <strong>{expiresIn}</strong>.
      </Text>

      <Text style={warningText}>
        Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá a mesma.
      </Text>

      <Text style={signature}>
        Equipe UNICA
      </Text>
    </BaseLayout>
  )
}

// Estilos
const heading = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const paragraph = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 32px',
  textDecoration: 'none',
}

const warningText = {
  color: '#94a3b8',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  margin: '24px 0',
}

const signature = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
}

export default PasswordResetEmail
