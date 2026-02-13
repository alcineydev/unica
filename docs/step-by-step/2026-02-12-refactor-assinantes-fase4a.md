# Refatoração Assinantes - Fase 4A: Limpeza Duplicatas + Perfil Premium

**Data:** 12/02/2026
**Fase:** 4A de N

## O que foi feito

### 1. Deletar APIs Duplicadas

| API Deletada | API Mantida | Motivo |
|-------------|------------|--------|
| `/api/app/profile/` | `/api/app/perfil/` | Duplicata com formato diferente e PUT limitado |
| `/api/auth/register/` | `/api/public/registro/` | Duplicata sem rate limit |

**Verificação:** Zero referências a `api/app/profile` ou `api/auth/register` no código.

### 2. Refatorar API de Perfil `/api/app/perfil/route.ts`

**GET - Antes:**
- Retornava dados em formato `{ perfil: {...} }` com campos em português
- Não incluía `city`, `_count`, QR Code, planStartDate, planEndDate

**GET - Depois:**
- Retorna dados flat (sem wrapper `perfil:`)
- Inclui: plan (com price, period, features), city, _count (transactions, avaliacoes)
- Inclui: qrCode, planStartDate, planEndDate, points, cashback
- Usa `user.assinante` include ao invés de buscar assinante separado

**PUT - Antes:**
- Não validava CPF duplicado
- Não usava transação
- PUT separado para User e Assinante (sem atomicidade)

**PUT - Depois:**
- Valida CPF duplicado (se alterado)
- Usa `$transaction` para atomicidade
- Suporta: name, phone, birthDate, address, avatar, cpf, cityId

### 3. Página de Perfil Premium `/app/perfil/page.tsx`

**Antes:** 608 linhas, tudo inline, UI funcional mas simples

**Depois:** ~530 linhas, tipado, UI premium com:

- **Header Gradient**: fundo `from-primary/90 to-primary`, avatar com overlay de upload, nome, email, badge de status, badge de plano
- **Mini Stats**: 3 cards (pontos, cashback, dias membro) integrados no header
- **Avatar Actions**: botões "Trocar foto" e "Remover" flutuantes
- **Quick Links**: "Minha Carteirinha" e "Escolher Plano" (condicional)
- **Tabs**: Dados Pessoais (nome, email readonly, CPF, telefone, nascimento) + Endereço (CEP com busca ViaCEP)
- **Card Plano**: mostra plano atual com preço, período e validade
- **Save Button**: fixo no bottom mobile quando tem changes
- **Card Info**: membro desde, transações, avaliações, QR Code

### 4. Upload de Avatar

Verificado que a API `/api/upload` retorna `{ url }` (via Cloudinary).
O perfil faz:
1. Upload do arquivo via FormData para `/api/upload`
2. Recebe `{ url }` 
3. Salva URL no perfil via PUT `/api/app/perfil`
4. Refetch completo do perfil

### 5. Verificações

- Header (`app-header.tsx`) usa `useSession()` do NextAuth, não as APIs deletadas
- Bottom nav (`bottom-nav.tsx`) aponta para `/app/perfil` corretamente
- Zero erros de lint (corrigido `aria-label` no input file hidden)

## Arquivos Alterados

| Arquivo | Ação |
|---------|------|
| `src/app/api/app/profile/` | **DELETADO** |
| `src/app/api/auth/register/` | **DELETADO** |
| `src/app/api/app/perfil/route.ts` | **REESCRITO** |
| `src/app/(app)/app/perfil/page.tsx` | **REESCRITO** |
