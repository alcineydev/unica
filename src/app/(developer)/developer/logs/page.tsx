'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  LogIn,
  UserPlus,
  Trash2,
  Edit,
  Key,
  Mail,
  Power,
  Clock,
  Terminal,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Log {
  id: string
  type: string
  action: string
  message: string
  details: string | null
  userId: string | null
  targetId: string | null
  ip: string | null
  createdAt: string
  user: {
    id: string
    email: string
    role: string
    admin: {
      name: string
    } | null
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const typeColors: Record<string, string> = {
  AUTH: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ADMIN: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  USER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  PARTNER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  SUBSCRIBER: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  CONFIG: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ERROR: 'bg-red-500/20 text-red-400 border-red-500/30',
  SYSTEM: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const actionIcons: Record<string, React.ElementType> = {
  LOGIN: LogIn,
  LOGOUT: LogIn,
  LOGIN_FAILED: AlertTriangle,
  CREATE: UserPlus,
  UPDATE: Edit,
  DELETE: Trash2,
  ACTIVATE: Power,
  DEACTIVATE: Power,
  PASSWORD_CHANGE: Key,
  PASSWORD_RESET: Key,
  EMAIL_CHANGE: Mail,
  EMAIL_CHANGE_CONFIRM: Mail,
  CONFIG_UPDATE: Settings,
  ERROR: AlertTriangle,
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    action: '',
    search: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (filters.type) params.append('type', filters.type)
      if (filters.action) params.append('action', filters.action)
      if (filters.search) params.append('search', filters.search)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/developer/logs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
        setPagination(data.pagination)
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchLogs()
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      action: '',
      search: '',
      startDate: '',
      endDate: '',
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const ActionIcon = ({ action }: { action: string }) => {
    const Icon = actionIcons[action] || FileText
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-400" />
            system_logs[]
          </h1>
          <p className="text-slate-500 font-mono text-sm">// historico de acoes do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all font-mono ${
              showFilters
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            filters()
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-900 rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all font-mono disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            refresh()
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(stats).map(([type, count]) => (
          <button
            key={type}
            onClick={() => handleFilterChange('type', filters.type === type ? '' : type)}
            className={`p-3 rounded-xl border transition-all ${
              filters.type === type
                ? typeColors[type]
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }`}
          >
            <p className="text-xs text-slate-500 font-mono">{type}</p>
            <p className="text-lg font-bold text-white font-mono">{count}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-mono">type:</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm font-mono focus:border-emerald-500 outline-none"
              >
                <option value="">Todos</option>
                <option value="AUTH">AUTH</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
                <option value="CONFIG">CONFIG</option>
                <option value="ERROR">ERROR</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-mono">action:</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm font-mono focus:border-emerald-500 outline-none"
              >
                <option value="">Todas</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
                <option value="EMAIL_CHANGE">EMAIL_CHANGE</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-mono">start_date:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm font-mono focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-mono">end_date:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm font-mono focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-mono">search:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm font-mono placeholder:text-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </form>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-white font-mono"
            >
              clear_filters()
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase font-mono">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase font-mono">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase font-mono">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase font-mono">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase font-mono">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase font-mono">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                      <Clock className="w-4 h-4 text-slate-600" />
                      {format(new Date(log.createdAt), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-mono border ${typeColors[log.type] || typeColors.SYSTEM}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                      <ActionIcon action={log.action} />
                      {log.action}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-300 text-sm max-w-md truncate" title={log.message}>
                      {log.message}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-xs text-emerald-400 font-mono">
                            {log.user.admin?.name?.charAt(0) || log.user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-slate-400 text-sm font-mono truncate max-w-[120px]">
                          {log.user.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-sm font-mono">system</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-500 text-sm font-mono">
                      {log.ip || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-700">
          {logs.map((log) => (
            <div key={log.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-mono border ${typeColors[log.type] || typeColors.SYSTEM}`}>
                  {log.type}
                </span>
                <span className="text-slate-500 text-xs font-mono">
                  {format(new Date(log.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                <ActionIcon action={log.action} />
                {log.action}
              </div>
              <p className="text-slate-400 text-sm">{log.message}</p>
              {log.user && (
                <p className="text-slate-500 text-xs font-mono">by: {log.user.email}</p>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {logs.length === 0 && !loading && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 font-mono">// nenhum log encontrado</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-500 font-mono">loading_logs()...</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm font-mono">
            // showing {logs.length} of {pagination.total} logs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-400 font-mono text-sm px-3">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
