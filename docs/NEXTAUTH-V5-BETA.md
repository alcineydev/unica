# NextAuth v5 (Auth.js) - Status Beta

## Situação Atual

O projeto UNICA utiliza NextAuth v5 (Auth.js) que ainda está em versão **beta**.

```json
"next-auth": "^5.0.0-beta.30"
```

## Riscos Conhecidos

### 1. Breaking Changes
Atualizações podem introduzir mudanças que quebram a autenticação sem aviso prévio.

### 2. Bugs em Produção
Possíveis bugs não descobertos que podem afetar a experiência do usuário.

### 3. Documentação Incompleta
A documentação oficial ainda está em evolução e pode não cobrir todos os casos de uso.

### 4. API Instável
A API pode mudar entre versões beta, exigindo refatoração.

## Mitigações Implementadas

- [x] Versão travada no package.json (^5.0.0-beta.30)
- [x] Testes manuais de login em cada deploy
- [x] Middleware de proteção de rotas robusto (`src/lib/auth.config.ts`)
- [x] Logging de autenticação para debug (`src/lib/auth.ts`)
- [x] Sessão JWT com duração de 30 dias
- [x] Suporte a múltiplos roles (DEVELOPER, ADMIN, PARCEIRO, ASSINANTE)

## Arquivos Críticos

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/auth.ts` | Configuração principal do NextAuth com providers |
| `src/lib/auth.config.ts` | Configuração para Edge Runtime (middleware) |
| `src/middleware.ts` | Middleware de autenticação |
| `src/app/api/auth/[...nextauth]/route.ts` | Route handlers do NextAuth |

## Plano de Ação

### Monitoramento Contínuo
1. Acompanhar releases: https://github.com/nextauthjs/next-auth/releases
2. Verificar changelog antes de qualquer atualização
3. Testar em ambiente de staging antes de produção

### Quando Atualizar
- Aguardar versão estável (v5.0.0 sem beta)
- Ou atualizar apenas para correções críticas de segurança

### Rollback
Em caso de problemas, reverter para a versão anterior:
```bash
npm install next-auth@5.0.0-beta.29
```

## Checklist de Deploy

Antes de cada deploy, verificar:

- [ ] Login com email/senha funciona
- [ ] Redirecionamento por role funciona
- [ ] Sessão persiste após refresh
- [ ] Logout funciona corretamente
- [ ] Middleware protege rotas privadas

## Última Verificação

- **Data:** 2025-12-29
- **Status:** Funcionando em produção
- **Versão:** 5.0.0-beta.30

## Contatos

Em caso de problemas críticos de autenticação:
- Documentação: https://authjs.dev/
- GitHub Issues: https://github.com/nextauthjs/next-auth/issues

---

*Documento atualizado em: 2025-12-29*
