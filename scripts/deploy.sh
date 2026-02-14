#!/bin/bash
set -e

echo "🚀 Deploy UNICA — dev → master"
echo ""

# 1. Bump version
echo "📦 Incrementando versão..."
node scripts/bump-version.js
echo ""

# 2. Commit version bump
echo "📝 Commitando versão..."
git add src/lib/version.ts src/components/app/update-checker.tsx
git commit -m "chore: bump version para deploy"
git push origin dev
echo ""

# 3. Merge to master
echo "🔀 Merge dev → master..."
git checkout master
git merge dev
git push origin master
echo ""

# 4. Voltar pra dev
git checkout dev
echo ""

echo "✅ Deploy concluído! Vercel vai buildar automaticamente."
echo "📱 Usuários com cache antigo verão o popup de atualização."
