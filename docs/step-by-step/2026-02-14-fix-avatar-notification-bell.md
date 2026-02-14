# FIX: Avatar Mobile + Dropdown Notificações no Sino

**Data:** 2026-02-14  
**Tipo:** Fix — Avatar + NotificationBell

---

## Problemas Resolvidos
1. **Foto do perfil não aparecia no mobile** — API `/api/app/home` não retornava avatar do user
2. **Sino era apenas link estático** — Sem preview de notificações, apenas redirecionava

---

## Arquivos Alterados

### 1. `src/app/api/app/home/route.ts`
- **Alteração:** Adicionada query `prisma.user.findUnique` para buscar `avatar` do User
- **Campo:** `user.avatar` agora retornado na response (com fallback `null`)

### 2. `src/app/api/app/notifications/route.ts`
- **Alteração:** Suporte a query param `?limit=N` (padrão 50, máximo 100)
- **Assinatura:** `GET()` → `GET(request: Request)` para acessar `searchParams`

### 3. `src/components/app/notification-bell.tsx` (CRIADO)
- **Função:** Componente client-side com sino + dropdown de notificações
- **Variantes:** `dark` (mobile hero navy) e `light` (desktop hero branco)
- **Features:**
  - Badge com contagem de não-lidas (9+ para >9)
  - Dropdown com até 3 notificações recentes
  - Ícone por tipo (CASHBACK, PROMOCAO, SISTEMA, PARCEIRO)
  - Indicador visual de não-lida (bolinha azul)
  - Tempo relativo (date-fns ptBR)
  - Link "Ver todas" → `/app/notificacoes`
  - Fecha ao clicar fora (mousedown listener)
  - Polling a cada 30s para atualizar count e lista

### 4. `src/app/(app)/app/page.tsx`
- **Interface:** `user.avatar: string | null` adicionado ao `HomeData`
- **Mobile Hero:** Avatar real com `<Image>` + fallback para iniciais
- **Mobile Hero:** `<Link>` do sino substituído por `<NotificationBell variant="dark" />`
- **Desktop Hero:** `<NotificationBell variant="light" />` adicionado ao lado da saudação
- **Cleanup:** Import de `Bell` removido (não mais usado diretamente)

### 5. `src/components/app/index.ts`
- **Alteração:** Export `{ NotificationBell }` adicionado ao barrel

---

## Verificação
- Zero erros de lint
- Campo correto do Prisma: `User.avatar` (não `image`)
- Botão de fechar com `title` para acessibilidade
- API notifications suporta `?limit=3` para o dropdown

---

## Fluxo do NotificationBell
1. Componente monta → fetch count + últimas 3 notificações
2. Badge vermelho aparece se há não-lidas
3. Clique no sino → dropdown abre com preview
4. Clique em "Ver todas" → navega para `/app/notificacoes`
5. Clique fora → dropdown fecha
6. A cada 30s → re-fetch automático
