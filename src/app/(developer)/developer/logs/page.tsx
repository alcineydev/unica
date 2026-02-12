'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ScrollText,
  RefreshCw,
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Globe,
} from 'lucide-react'
import { PageLoading, PageHeader, FilterBar } from '@/components/developer'
import { Pagination } from '@/components/developer/pagination'
import { LogBadge, LevelBadge } from '@/components/developer/log-badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SystemLog {
  id: string
  level: string
  action: string
  userId?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
  createdAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

const actionOptions = [
  { value: 'all', label: 'Todas as Ações' },
  { value: 'CREATE_ADMIN', label: 'Admin Criado' },
  { value: 'DELETE_ADMIN', label: 'Admin Removido' },
  { value: 'ACTIVATE_ADMIN', label: 'Admin Ativado' },
  { value: 'DEACTIVATE_ADMIN', label: 'Admin Desativado' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'LOGIN_FAILED', label: 'Login Falhou' },
  { value: 'CONFIG_UPDATE', label: 'Config Atualizada' },
]

const levelOptions = [
  { value: 'all', label: 'Todos os Níveis' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARN', label: 'Aviso' },
  { value: 'ERROR', label: 'Erro' },
  { value: 'DEBUG', label: 'Debug' },
]

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filtros
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  // Expandir detalhes
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (levelFilter !== 'all') params.append('level', levelFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/developer/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [actionFilter, levelFilter, search, pagination.limit])

  useEffect(() => {
    fetchLogs(1)
  }, [actionFilter, levelFilter])

  const handleSearch = () => {
    fetchLogs(1)
  }

  const handlePageChange = (page: number) => {
    fetchLogs(page)
  }

  const handleRefresh = () => {
    fetchLogs(pagination.page)
  }

  const handleExport = () => {
    // TODO: Implementar exportação
    console.log('Exportar logs')
  }

  const clearFilters = () => {
    setSearch('')
    setActionFilter('all')
    setLevelFilter('all')
  }

  const hasFilters = search || actionFilter !== 'all' || levelFilter !== 'all'

  if (loading) {
    return <PageLoading text="Carregando logs..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Logs do Sistema"
        description="Monitore todas as atividades e eventos do sistema"
        icon={<ScrollText className="h-6 w-6" />}
        badge={{ text: `${pagination.total} registros`, variant: 'default' }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar por IP, usuário ou detalhes...',
        }}
        actions={
          <Button
            onClick={handleSearch}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Buscar
          </Button>
        }
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-zinc-300">
                <Filter className="h-4 w-4 mr-2 text-zinc-500" />
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {actionOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-700 text-zinc-300">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {levelOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-white"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        }
        totalResults={pagination.total}
      />

      {/* Tabela de Logs */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-lg font-medium text-zinc-400">Nenhum log encontrado</p>
            <p className="text-sm text-zinc-500 mt-1">
              {hasFilters ? 'Tente ajustar os filtros' : 'Os logs aparecerão aqui'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Data/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Nível
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Ação
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 hidden md:table-cell">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 hidden lg:table-cell">
                    User Agent
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-zinc-500 hidden sm:block" />
                          <div>
                            <p className="text-sm font-medium text-zinc-300">
                              {format(new Date(log.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {format(new Date(log.createdAt), 'HH:mm:ss', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <LevelBadge level={log.level} />
                      </td>
                      <td className="px-4 py-3">
                        <LogBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Globe className="h-4 w-4" />
                          {log.ip || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-zinc-500 truncate max-w-[200px]">
                          {log.userAgent || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                        >
                          {expandedId === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>

                    {/* Detalhes expandidos */}
                    {expandedId === log.id && (
                      <tr key={`${log.id}-details`}>
                        <td colSpan={6} className="bg-zinc-900/50 px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs font-medium text-zinc-500 uppercase mb-1">ID</p>
                              <p className="text-sm text-zinc-300 font-mono">{log.id}</p>
                            </div>
                            {log.userId && (
                              <div>
                                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">User ID</p>
                                <p className="text-sm text-zinc-300 font-mono">{log.userId}</p>
                              </div>
                            )}
                            <div className="md:col-span-2 lg:col-span-2">
                              <p className="text-xs font-medium text-zinc-500 uppercase mb-1">User Agent</p>
                              <p className="text-sm text-zinc-300 break-all">{log.userAgent || '-'}</p>
                            </div>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="col-span-full">
                                <p className="text-xs font-medium text-zinc-500 uppercase mb-1">Detalhes</p>
                                <pre className="text-xs text-zinc-400 bg-zinc-900 p-3 rounded-lg overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
