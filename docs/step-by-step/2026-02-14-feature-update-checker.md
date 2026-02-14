# Feature: Popup de Atualização Obrigatória

**Data:** 2026-02-14  
**Fase:** Feature — Update Checker

---

## Objetivo
Implementar um sistema de detecção automática de novas versões com popup obrigatório (sem opção de fechar), forçando o usuário a atualizar quando um novo deploy é feito.

---

## Arquivos Criados

### 1. `src/lib/version.ts`
- **Função:** Armazena a versão atual do app (`APP_VERSION`) e o timestamp do build (`BUILD_TIMESTAMP`).
- **Uso:** Importado pela API `/api/version` para retornar os dados. A cada deploy importante, incrementar `APP_VERSION`.

### 2. `src/app/api/version/route.ts`
- **Função:** Endpoint GET que retorna `{ version, build }` com headers anti-cache (`no-store`, `no-cache`, `must-revalidate`).
- **Config:** `dynamic = 'force-dynamic'` e `revalidate = 0` para nunca cachear no edge/CDN.

### 3. `src/components/app/update-checker.tsx`
- **Função:** Componente client-side que verifica a versão do app periodicamente.
- **Fluxo:**
  - Monta no layout do assinante
  - Após 10s → primeira checagem `GET /api/version`
  - A cada 60s → checa novamente
  - Se versão diferente da constante `CURRENT_VERSION` → exibe popup fullscreen
  - Popup sem botão de fechar — apenas "Atualizar Agora"
  - Ao clicar: limpa Service Workers + caches do browser → reload forçado

---

## Arquivos Atualizados

### 4. `src/app/(app)/layout.tsx`
- **Alteração:** Adicionado import e `<UpdateChecker />` entre `NotificationPermissionModal` e `Toaster`.

### 5. `src/components/app/index.ts`
- **Alteração:** Adicionado export `{ UpdateChecker }` para barrel export.

---

## Como Usar (a cada deploy)

1. Alterar `src/lib/version.ts` → incrementar `APP_VERSION` (ex: `'1.0.1'`)
2. Alterar `src/components/app/update-checker.tsx` → atualizar `CURRENT_VERSION` para o mesmo valor
3. Fazer deploy
4. Usuários com versão antiga verão o popup obrigatório automaticamente

---

## Verificação
- Zero erros de lint
- API retorna JSON com versão e build
- Popup aparece apenas quando versão da API difere da constante no cliente
- Popup não pode ser fechado (sem X, sem clique fora)
- Reload limpa SW e caches antes de recarregar
