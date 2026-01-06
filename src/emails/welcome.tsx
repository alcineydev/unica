import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface WelcomeEmailProps {
  name: string
  planName?: string
  appUrl?: string
}

export function WelcomeEmail({
  name = 'Usuário',
  planName = 'Básico',
  appUrl = 'https://app.unicabeneficios.com.br',
}: WelcomeEmailProps) {
  return (
    <BaseLayout preview="Bem-vindo ao UNICA Clube de Benefícios!">
      <Heading style={heading}>Bem-vindo ao UNICA! 🎉</Heading>

      <Text style={paragraph}>
        Olá, <strong>{name}</strong>!
      </Text>

      <Text style={paragraph}>
        Sua conta foi criada com sucesso! Agora você faz parte do <strong>UNICA Clube de Benefícios</strong> e tem acesso a descontos exclusivos em diversos parceiros.
      </Text>

      {planName && (
        <Section style={planBox}>
          <Text style={planLabel}>Seu plano</Text>
          <Text style={planNameStyle}>{planName}</Text>
        </Section>
      )}

      <Text style={paragraph}>
        Acesse o app para descobrir todos os benefícios disponíveis:
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={appUrl}>
          Acessar o App
        </Button>
      </Section>

      <Text style={paragraph}>
        Qualquer dúvida, estamos à disposição!
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

const planBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #bfdbfe',
}

const planLabel = {
  color: '#64748b',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 4px',
}

const planNameStyle = {
  color: '#2563eb',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0',
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

const signature = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
}

export default WelcomeEmail
