'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface SystemLog {
  id: string
  action: string
  entity: string
  entityId: string
  details: Record<string, unknown>
  userId: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_ADMIN: 'bg-green-600',
  DELETE_ADMIN: 'bg-red-600',
  ACTIVATE_ADMIN: 'bg-blue-600',
  DEACTIVATE_ADMIN: 'bg-amber-600',
  LOGIN: 'bg-purple-600',
  LOGOUT: 'bg-zinc-600',
  DEFAULT: 'bg-zinc-600',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityFilter, setEntityFilter] = useState<string>('')

  useEffect(() => {
    loadLogs()
  }, [pagination.page, actionFilter, entityFilter])

  async function loadLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entity: entityFilter }),
      })

      const response = await fetch(`/api/developer/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast.error('Erro ao carregar logs')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function getActionColor(action: string) {
    return ACTION_COLORS[action] || ACTION_COLORS.DEFAULT
  }

  function formatDetails(details: Record<string, unknown>) {
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Logs do Sistema</h1>
          <p className="text-zinc-400 mt-1">
            Monitoramento de atividades e eventos do sistema
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadLogs()}
          className="border-zinc-700 text-zinc-300"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="">Todas as ações</SelectItem>
                  <SelectItem value="CREATE_ADMIN">Criar Admin</SelectItem>
                  <SelectItem value="DELETE_ADMIN">Deletar Admin</SelectItem>
                  <SelectItem value="ACTIVATE_ADMIN">Ativar Admin</SelectItem>
                  <SelectItem value="DEACTIVATE_ADMIN">Desativar Admin</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue placeholder="Filtrar por entidade" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="">Todas as entidades</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Parceiro">Parceiro</SelectItem>
                  <SelectItem value="Assinante">Assinante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Registros</span>
            <span className="text-sm font-normal text-zinc-400">
              {pagination.total} logs encontrados
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              Nenhum log encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700">
                    <TableHead className="text-zinc-400">Data/Hora</TableHead>
                    <TableHead className="text-zinc-400">Ação</TableHead>
                    <TableHead className="text-zinc-400">Entidade</TableHead>
                    <TableHead className="text-zinc-400">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-zinc-700">
                      <TableCell className="text-zinc-300 font-mono text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {log.entity}
                        {log.entityId && (
                          <span className="text-zinc-500 text-xs ml-2">
                            #{log.entityId.substring(0, 8)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm max-w-md truncate">
                        {formatDetails(log.details as Record<string, unknown>)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700">
                  <p className="text-sm text-zinc-400">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page - 1 }))
                      }
                      disabled={pagination.page === 1}
                      className="border-zinc-700 text-zinc-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page + 1 }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="border-zinc-700 text-zinc-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

