# Correções: Email Parceiro + Push Notifications + Limpeza Checkout

**Data:** 2026-02-13
**Branch:** dev

---

## Alterações Realizadas

### 1. Checkout Legado Deletado
- **Removido:** `src/app/(auth)/checkout/` (4 arquivos)
  - `page.tsx` - Checkout Mercado Pago (quebrado, api/checkout/create não existia)
  - `success/page.tsx` - Sucesso Mercado Pago
  - `pending/page.tsx` - Pendente Mercado Pago
  - `failure/page.tsx` - Falha Mercado Pago
- **Motivo:** Substituído pelo checkout Asaas em `src/app/(public)/checkout/`
- **Verificação:** Zero referências residuais a `/auth/checkout` ou `checkout/create`

### 2. Template de Email para Parceiro
- **Arquivo:** `src/services/email.ts`
- **Adicionado:** Método `sendPartnerWelcomeEmail(to, data)` na classe `EmailService`
- **Adicionado:** Template privado `getPartnerWelcomeTemplate(data)`
- **Conteúdo do email:**
  - Header com gradiente roxo (identidade visual UNICA)
  - Boas-vindas personalizadas com nome da empresa
  - Box com credenciais de acesso (email + senha)
  - Botão CTA "Acessar Painel do Parceiro"
  - Próximos passos (4 itens)
  - Aviso de segurança para trocar senha
  - Versão texto puro como fallback

### 3. Email + Push na Criação de Parceiro
- **Arquivo:** `src/app/api/admin/partners/route.ts`
- **Imports adicionados:** `getEmailService`, `sendPushToAdmins`
- **Após criação do parceiro (POST):**
  - Envia email de boas-vindas com credenciais via `sendPartnerWelcomeEmail`
  - Envia push notification para admins via `sendPushToAdmins`
  - Ambos com try/catch + warn (não bloqueiam resposta)

### 4. Push na Criação de Assinante (Admin)
- **Arquivo:** `src/app/api/admin/assinantes/route.ts`
- **Após criação (POST):**
  - Adicionado push notification via `notifyNewSubscriber` (de `push-notifications.ts`)
  - O email de boas-vindas JÁ EXISTIA nesse endpoint

### 5. Push no Registro Público
- **Arquivo:** `src/app/api/public/registro/route.ts`
- **Após criação do User+Assinante (POST):**
  - Adicionado push notification via `sendPushToAdmins` para notificar admins
  - Mensagem: "🆕 {nome} se cadastrou pelo site"

---

## Infraestrutura Existente Utilizada (sem alteração)

| Componente | Arquivo | Funções |
|---|---|---|
| Email Service | `src/services/email.ts` | `getEmailService()`, `sendEmail()`, templates |
| Web Push | `src/lib/web-push.ts` | `sendPushNotification()`, VAPID config |
| Push Service | `src/lib/push-notifications.ts` | `sendPushToAdmins()`, `notifyNewSubscriber()`, `sendPushToPartner()`, etc. |
| Service Worker | `public/sw.js` | Push listener, notificationclick handler |

---

## Checklist

- [x] Checkout legado (Mercado Pago) deletado
- [x] Zero referências a `/auth/checkout` ou `checkout/create`
- [x] `sendPartnerWelcomeEmail` adicionado ao EmailService
- [x] POST `/api/admin/partners` envia email + push
- [x] POST `/api/admin/assinantes` envia push (email já existia)
- [x] POST `/api/public/registro` envia push
- [x] Funções push existentes reutilizadas (sem duplicação)
- [x] Nenhum erro de lint
- [x] Push/email não bloqueiam resposta (try/catch + warn)
