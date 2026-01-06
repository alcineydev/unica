import {
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface VerificationCodeEmailProps {
  name: string
  code: string
  expiresIn?: string
}

export function VerificationCodeEmail({
  name = 'Usuário',
  code = '123456',
  expiresIn = '10 minutos',
}: VerificationCodeEmailProps) {
  return (
    <BaseLayout preview={`Seu código de verificação é ${code}`}>
      <Heading style={heading}>Verifique seu e-mail</Heading>

      <Text style={paragraph}>
        Olá, <strong>{name}</strong>!
      </Text>

      <Text style={paragraph}>
        Use o código abaixo para verificar seu e-mail e ativar sua conta no UNICA Clube de Benefícios:
      </Text>

      <Section style={codeContainer}>
        <Text style={codeText}>{code}</Text>
      </Section>

      <Text style={paragraph}>
        Este código expira em <strong>{expiresIn}</strong>.
      </Text>

      <Text style={paragraph}>
        Se você não solicitou este código, ignore este e-mail.
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

const codeContainer = {
  backgroundColor: '#f1f5f9',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
}

const codeText = {
  color: '#2563eb',
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '8px',
  margin: '0',
}

const signature = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
}

export default VerificationCodeEmail
