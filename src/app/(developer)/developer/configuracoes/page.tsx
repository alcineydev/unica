'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Server, Shield, Zap } from 'lucide-react'

export default function ConfiguracoesPage() {
  const systemInfo = {
    version: '1.0.0',
    nextVersion: '16.0.7',
    nodeVersion: process.env.NODE_ENV === 'production' ? 'N/A' : '20.x',
    prismaVersion: '5.22.0',
    database: 'PostgreSQL (Supabase)',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
        <p className="text-zinc-400 mt-1">
          Informações técnicas e configurações avançadas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Informações do Sistema
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Versões e ambiente de execução
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Versão do App</span>
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                v{systemInfo.version}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Next.js</span>
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                v{systemInfo.nextVersion}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Prisma ORM</span>
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                v{systemInfo.prismaVersion}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Ambiente</span>
              <Badge 
                className={
                  process.env.NODE_ENV === 'production' 
                    ? 'bg-green-600' 
                    : 'bg-amber-600'
                }
              >
                {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              Banco de Dados
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configurações de conexão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Provedor</span>
              <span className="text-white">{systemInfo.database}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Pooling</span>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">SSL</span>
              <Badge className="bg-green-600">Habilitado</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Status</span>
              <Badge className="bg-green-600">Conectado</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Segurança
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configurações de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Autenticação</span>
              <span className="text-white">NextAuth.js v5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Estratégia</span>
              <span className="text-white">JWT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Hash de Senhas</span>
              <span className="text-white">bcrypt (12 rounds)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">RBAC</span>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Features Info */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Funcionalidades
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Módulos e integrações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Painel Admin</span>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Painel Parceiro</span>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">App Assinante</span>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Integrações</span>
              <Badge className="bg-amber-600">Pendente</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

