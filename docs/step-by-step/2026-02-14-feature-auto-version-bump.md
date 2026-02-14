# Feature: Auto Version Bump + Deploy Script

**Data:** 2026-02-14  
**Tipo:** Feature — Automação de deploy

---

## Objetivo
Automatizar o processo de bump de versão e deploy (dev → master) com um único comando.

---

## Arquivos Criados

### 1. `scripts/bump-version.js`
- **Função:** Incrementa automaticamente a versão patch (1.0.0 → 1.0.1 → 1.0.2...)
- **Atualiza:**
  - `src/lib/version.ts` — `APP_VERSION` + `BUILD_TIMESTAMP`
  - `src/components/app/update-checker.tsx` — `CURRENT_VERSION`
- **Uso:** `npm run bump-version`

### 2. `scripts/deploy.sh`
- **Função:** Script completo de deploy
- **Fluxo:**
  1. Executa `bump-version.js` (incrementa versão)
  2. Commita os 2 arquivos de versão
  3. Push para `dev`
  4. Checkout `master` + merge `dev`
  5. Push para `master`
  6. Volta para `dev`
- **Uso:** `npm run deploy`

---

## Arquivo Alterado

### 3. `package.json`
- **Scripts adicionados:**
  - `bump-version` → `node scripts/bump-version.js`
  - `deploy` → `bash scripts/deploy.sh`

---

## Como Usar

```bash
# Apenas incrementar versão (sem deploy)
npm run bump-version

# Deploy completo (bump + commit + merge + push)
npm run deploy
```

---

## Verificação
- `npm run bump-version` testado: 1.0.0 → 1.0.1 com sucesso
- Ambos os arquivos atualizados corretamente
- Script deploy.sh com permissão executável
