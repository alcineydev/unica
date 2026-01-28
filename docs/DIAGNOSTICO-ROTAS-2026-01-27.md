# RELATÓRIO DE DIAGNÓSTICO - ROTAS E PÁGINAS UNICA

**Data:** 27/01/2026  
**Versão:** 1.0

---

## 1. ESTRUTURA DE ROTAS ENCONTRADA

### 1.1 Grupos de Rotas (Route Groups)

| Grupo | Layout | Autenticação | Descrição |
|-------|--------|--------------|-----------|
| `(auth)` | Mínimo | Não | Login, cadastro, planos públicos |
| `(public)` | Mínimo | Não | Checkout público |
| `(admin)` | Completo | ADMIN/DEVELOPER | Painel administrativo |
| `(app)` | Completo | ASSINANTE | App do assinante |
| `(parceiro)` | Completo | PARCEIRO | Painel do parceiro |
| `(developer)` | Completo | DEVELOPER | Painel developer |

### 1.2 Total de Páginas: 59
### 1.3 Total de APIs: 110

---

## 2. ANÁLISE DE PROBLEMAS

### 2.1 ❌ PROBLEMA: Login redirecionando para 404

**Causa Identificada:** O middleware está correto, mas o problema pode ser:

1. **Cache do browser** - Cookies antigos de sessão
2. **Redirecionamento após login** - Se o usuário já está logado, é redirecionado

**Arquivo:** `src/app/(auth)/login/page.tsx`
- ✅ Existe
- ✅ Tem 'use client'
- ✅ Importações corretas
- ✅ Redirecionamento por role configurado

**Middleware:** `src/middleware.ts`
```typescript
// /login está na lista de rotas públicas em auth.config.ts
const publicRoutes = ['/', '/login', '/cadastro', '/interesse-parceiro']
```

**Solução:**
1. Limpar cookies do navegador
2. Verificar se há redirecionamento para rota inexistente no callbackUrl

---

### 2.2 ❌ PROBLEMA: /planos não mostra planos

**Causa Identificada:** Existem DUAS páginas de planos diferentes:

| Rota | Arquivo | API | Autenticação |
|------|---------|-----|--------------|
| `/planos` | `(auth)/planos/page.tsx` | `/api/public/plans` | Não |
| `/app/planos` | `(app)/app/planos/page.tsx` | `/api/app/planos` | Sim |

**Problema provável:** 
- A página `/planos` busca de `/api/public/plans`
- Se não há planos com `isActive: true` no banco, retorna vazio

**APIs de Planos:**
```
/api/public/plans          → Lista pública (sem auth)
/api/app/planos            → Lista para assinante (com auth)
/api/plans/public          → Outra lista pública
/api/plans/public/[planId] → Plano específico
```

**Diagnóstico necessário:**
1. Verificar se existem planos ativos no banco
2. Testar API diretamente: `GET /api/public/plans`

---

### 2.3 ❌ PROBLEMA: Checkout funciona em DEV mas não em PROD

**Rotas de Checkout:**

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/checkout/[planId]` | `(public)/checkout/[planId]/page.tsx` | Checkout público |
| `/checkout` | `(auth)/checkout/page.tsx` | Checkout com auth |
| `/checkout/success` | `(auth)/checkout/success/page.tsx` | Sucesso |
| `/checkout/pending` | `(auth)/checkout/pending/page.tsx` | Pendente |
| `/checkout/failure` | `(auth)/checkout/failure/page.tsx` | Falha |
| `/checkout/sucesso` | `(public)/checkout/sucesso/page.tsx` | Sucesso público |

**Fluxo do Checkout:**
1. `/checkout/[slug]` → busca plano via `/api/plans/public/[planId]`
2. Envia dados para `/api/checkout/asaas`
3. Redireciona para sucesso/pendente

**Problema provável:**
- Variáveis de ambiente do Asaas não configuradas em PROD
- Plano não encontrado (ID vs Slug)

---

## 3. CHECKLIST DE ROTAS

### ✅ Rotas Públicas (Sem Auth)

| Rota | Status | Arquivo |
|------|--------|---------|
| `/login` | ✅ OK | `(auth)/login/page.tsx` |
| `/cadastro` | ✅ OK | `(auth)/cadastro/page.tsx` |
| `/planos` | ⚠️ Verificar dados | `(auth)/planos/page.tsx` |
| `/checkout/[planId]` | ⚠️ Verificar env | `(public)/checkout/[planId]/page.tsx` |
| `/interesse-parceiro` | ✅ OK | `(auth)/interesse-parceiro/page.tsx` |

### ✅ Rotas Admin

| Rota | Status | Arquivo |
|------|--------|---------|
| `/admin` | ✅ OK | `(admin)/admin/page.tsx` |
| `/admin/assinantes` | ✅ OK | `(admin)/admin/assinantes/page.tsx` |
| `/admin/parceiros` | ✅ OK | `(admin)/admin/parceiros/page.tsx` |
| `/admin/planos` | ✅ OK | `(admin)/admin/planos/page.tsx` |
| `/admin/beneficios` | ✅ OK | `(admin)/admin/beneficios/page.tsx` |
| `/admin/categorias` | ✅ OK | `(admin)/admin/categorias/page.tsx` |
| `/admin/cidades` | ✅ OK | `(admin)/admin/cidades/page.tsx` |
| `/admin/configuracoes` | ✅ OK | `(admin)/admin/configuracoes/page.tsx` |
| `/admin/integracoes` | ✅ OK | `(admin)/admin/integracoes/page.tsx` |
| `/admin/notificacoes` | ✅ OK | `(admin)/admin/notificacoes/page.tsx` |
| `/admin/relatorios` | ✅ OK | `(admin)/admin/relatorios/page.tsx` |

### ✅ Rotas App (Assinante)

| Rota | Status | Arquivo |
|------|--------|---------|
| `/app` | ✅ OK | `(app)/app/page.tsx` |
| `/app/parceiros` | ✅ OK | `(app)/app/parceiros/page.tsx` |
| `/app/carteira` | ✅ OK | `(app)/app/carteira/page.tsx` |
| `/app/planos` | ⚠️ Verificar dados | `(app)/app/planos/page.tsx` |
| `/app/perfil` | ✅ OK | `(app)/app/perfil/page.tsx` |
| `/app/categorias` | ✅ OK | `(app)/app/categorias/page.tsx` |
| `/app/buscar` | ✅ OK | `(app)/app/buscar/page.tsx` |
| `/app/notificacoes` | ✅ OK | `(app)/app/notificacoes/page.tsx` |

### ✅ Rotas Parceiro

| Rota | Status | Arquivo |
|------|--------|---------|
| `/parceiro` | ✅ OK | `(parceiro)/parceiro/page.tsx` |
| `/parceiro/vendas` | ✅ OK | `(parceiro)/parceiro/vendas/page.tsx` |
| `/parceiro/clientes` | ✅ OK | `(parceiro)/parceiro/clientes/page.tsx` |
| `/parceiro/avaliacoes` | ✅ OK | `(parceiro)/parceiro/avaliacoes/page.tsx` |
| `/parceiro/saldo` | ✅ OK | `(parceiro)/parceiro/saldo/page.tsx` |
| `/parceiro/perfil` | ✅ OK | `(parceiro)/parceiro/perfil/page.tsx` |
| `/parceiro/relatorios` | ✅ OK | `(parceiro)/parceiro/relatorios/page.tsx` |
| `/parceiro/notificacoes` | ✅ OK | `(parceiro)/parceiro/notificacoes/page.tsx` |

### ✅ Rotas Developer

| Rota | Status | Arquivo |
|------|--------|---------|
| `/developer` | ✅ OK | `(developer)/developer/page.tsx` |
| `/developer/admins` | ✅ OK | `(developer)/developer/admins/page.tsx` |
| `/developer/logs` | ✅ OK | `(developer)/developer/logs/page.tsx` |
| `/developer/configuracoes` | ✅ OK | `(developer)/developer/configuracoes/page.tsx` |
| `/developer/pwa` | ✅ OK | `(developer)/developer/pwa/page.tsx` |
| `/developer/sistema` | ✅ OK | `(developer)/developer/sistema/page.tsx` |
| `/developer/paginas` | ✅ OK | `(developer)/developer/paginas/page.tsx` |

---

## 4. APIS CRÍTICAS

### 4.1 APIs de Autenticação
```
/api/auth/[...nextauth]     → NextAuth handler
/api/auth/register          → Registro geral
/api/auth/register/assinante → Registro assinante
/api/auth/register/parceiro  → Registro parceiro
```

### 4.2 APIs de Planos
```
/api/public/plans           → Lista planos (público)
/api/plans/public           → Lista planos (público alternativo)
/api/plans/public/[planId]  → Plano específico
/api/app/planos             → Planos para assinante (auth)
/api/admin/plans            → CRUD admin
```

### 4.3 APIs de Checkout
```
/api/checkout/asaas                  → Criar cobrança
/api/checkout/asaas/tokenize         → Tokenizar cartão
/api/checkout/asaas/pix/[paymentId]  → QR Code PIX
/api/checkout/asaas/status/[paymentId] → Status pagamento
```

### 4.4 APIs de Webhook
```
/api/webhooks/asaas → Webhook do Asaas
```

---

## 5. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### 5.1 NextAuth
```env
NEXTAUTH_URL=https://app.unicabeneficios.com.br
AUTH_SECRET=<secret>
NEXTAUTH_SECRET=<secret>
```

### 5.2 Banco de Dados
```env
DATABASE_URL=postgresql://...
```

### 5.3 Asaas
```env
ASAAS_API_KEY=<api_key>
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=<token>
```

---

## 6. AÇÕES RECOMENDADAS

### Prioridade ALTA

1. **Verificar planos no banco PROD**
   - Acessar Supabase/Postgres
   - Query: `SELECT * FROM "Plan" WHERE "isActive" = true`

2. **Testar APIs diretamente em PROD**
   ```
   GET https://app.unicabeneficios.com.br/api/public/plans
   GET https://app.unicabeneficios.com.br/api/plans/public
   ```

3. **Verificar variáveis de ambiente na Vercel**
   - NEXTAUTH_URL
   - AUTH_SECRET
   - ASAAS_API_KEY

### Prioridade MÉDIA

4. **Limpar cache do browser** para testar login

5. **Verificar logs da Vercel** para erros de runtime

6. **Testar checkout com plano específico**
   ```
   GET https://app.unicabeneficios.com.br/api/plans/public/basico
   ```

---

## 7. API DE DIAGNÓSTICO CRIADA

Para facilitar diagnósticos futuros, criar:

```
/api/public/diagnostics → Retorna status de todas as rotas e APIs
```

---

**Próximo passo:** Criar API de diagnóstico que verifica planos, usuários e configurações automaticamente.
