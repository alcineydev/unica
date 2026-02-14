const fs = require('fs')
const path = require('path')

// Ler versão atual
const versionFile = path.join(__dirname, '..', 'src', 'lib', 'version.ts')
const content = fs.readFileSync(versionFile, 'utf8')
const match = content.match(/APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/)

if (!match) {
  console.error('❌ Versão não encontrada em src/lib/version.ts')
  process.exit(1)
}

const [, major, minor, patch] = match
const newVersion = `${major}.${minor}.${parseInt(patch) + 1}`

// Atualizar version.ts
const newVersionContent = `// Incrementado automaticamente via npm run bump-version
export const APP_VERSION = '${newVersion}'
export const BUILD_TIMESTAMP = ${Date.now()}
`
fs.writeFileSync(versionFile, newVersionContent)
console.log(`✅ src/lib/version.ts → ${newVersion}`)

// Atualizar update-checker.tsx
const checkerFile = path.join(__dirname, '..', 'src', 'components', 'app', 'update-checker.tsx')
let checkerContent = fs.readFileSync(checkerFile, 'utf8')
checkerContent = checkerContent.replace(
  /const CURRENT_VERSION = '[^']+'/,
  `const CURRENT_VERSION = '${newVersion}'`
)
fs.writeFileSync(checkerFile, checkerContent)
console.log(`✅ src/components/app/update-checker.tsx → ${newVersion}`)

console.log(`\n🚀 Versão atualizada: ${major}.${minor}.${patch} → ${newVersion}`)
