# Variáveis de Ambiente - Unica Clube de Benefícios

## Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

## Database (Vercel Postgres)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

Para desenvolvimento local com Docker:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unica?schema=public"
```

## NextAuth

```env
# Gere com: openssl rand -base64 32
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

## Mercado Pago (Pagamentos)

```env
MERCADO_PAGO_ACCESS_TOKEN=""
MERCADO_PAGO_PUBLIC_KEY=""
MERCADO_PAGO_WEBHOOK_SECRET=""
```

## Evolution API (WhatsApp)

```env
EVOLUTION_API_URL=""
EVOLUTION_API_KEY=""
EVOLUTION_API_INSTANCE=""
```

## Resend (Email)

```env
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@unica.com.br"
```

## Uploadthing (Upload de imagens)

```env
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""
```

## Ambiente

```env
NODE_ENV="development"
```

---

## Exemplo completo de .env

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unica?schema=public"

# NextAuth
NEXTAUTH_SECRET="gere-uma-chave-secreta-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=""
MERCADO_PAGO_PUBLIC_KEY=""
MERCADO_PAGO_WEBHOOK_SECRET=""

# Evolution API
EVOLUTION_API_URL=""
EVOLUTION_API_KEY=""
EVOLUTION_API_INSTANCE=""

# Resend
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@unica.com.br"

# Uploadthing
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Ambiente
NODE_ENV="development"
```

