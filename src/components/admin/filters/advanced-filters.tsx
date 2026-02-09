'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    SlidersHorizontal,
    X,
    ChevronDown,
    ChevronUp,
    RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOption {
    value: string
    label: string
    count?: number
}

export interface FilterConfig {
    id: string
    label: string
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number'
    options?: FilterOption[]
    placeholder?: string
}

interface AdvancedFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    filters: FilterConfig[]
    filterValues: Record<string, string>
    onFilterChange: (filterId: string, value: string) => void
    onClearFilters: () => void
    totalResults?: number
    filteredResults?: number
    className?: string
}

export function AdvancedFilters({
    search,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    filters,
    filterValues,
    onFilterChange,
    onClearFilters,
    totalResults,
    filteredResults,
    className
}: AdvancedFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Contar filtros ativos (excluindo 'all')
    const activeFiltersCount = Object.entries(filterValues).filter(
        ([_, value]) => value && value !== 'all'
    ).length

    const hasActiveFilters = activeFiltersCount > 0 || search.length > 0

    // Dividir filtros: primários (sempre visíveis) e secundários (expansíveis)
    const primaryFilters = filters.slice(0, 3)
    const secondaryFilters = filters.slice(3)

    return (
        <div className={cn('space-y-3', className)}>
            {/* Linha principal: Search + Filtros primários */}
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => onSearchChange('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Filtros primários */}
                <div className="flex flex-wrap gap-2">
                    {primaryFilters.map((filter) => (
                        <Select
                            key={filter.id}
                            value={filterValues[filter.id] || 'all'}
                            onValueChange={(value) => onFilterChange(filter.id, value)}
                        >
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder={filter.placeholder || filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {filter.placeholder || `Todos ${filter.label.toLowerCase()}`}
                                </SelectItem>
                                {filter.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                        {option.count !== undefined && (
                                            <span className="ml-2 text-gray-400">({option.count})</span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}

                    {/* Botão expandir mais filtros */}
                    {secondaryFilters.length > 0 && (
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="gap-2"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Mais filtros
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    )}

                    {/* Limpar filtros */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="default"
                            onClick={onClearFilters}
                            className="gap-2 text-gray-500 hover:text-gray-700"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros secundários (expansíveis) */}
            {isExpanded && secondaryFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg animate-in slide-in-from-top-2 duration-200">
                    {secondaryFilters.map((filter) => (
                        <Select
                            key={filter.id}
                            value={filterValues[filter.id] || 'all'}
                            onValueChange={(value) => onFilterChange(filter.id, value)}
                        >
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder={filter.placeholder || filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {filter.placeholder || `Todos ${filter.label.toLowerCase()}`}
                                </SelectItem>
                                {filter.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}
                </div>
            )}

            {/* Badges de filtros ativos + Contador de resultados */}
            {(hasActiveFilters || (totalResults !== undefined && filteredResults !== undefined)) && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                    {/* Badges de filtros ativos */}
                    <div className="flex flex-wrap gap-2">
                        {search && (
                            <Badge variant="secondary" className="gap-1">
                                Busca: "{search}"
                                <button onClick={() => onSearchChange('')} className="ml-1 hover:text-red-500">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {Object.entries(filterValues)
                            .filter(([_, value]) => value && value !== 'all')
                            .map(([filterId, value]) => {
                                const filter = filters.find(f => f.id === filterId)
                                const option = filter?.options?.find(o => o.value === value)
                                return (
                                    <Badge key={filterId} variant="secondary" className="gap-1">
                                        {filter?.label}: {option?.label || value}
                                        <button
                                            onClick={() => onFilterChange(filterId, 'all')}
                                            className="ml-1 hover:text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )
                            })}
                    </div>

                    {/* Contador de resultados */}
                    {totalResults !== undefined && filteredResults !== undefined && (
                        <span className="text-sm text-gray-500">
                            {filteredResults === totalResults ? (
                                `${totalResults} ${totalResults === 1 ? 'resultado' : 'resultados'}`
                            ) : (
                                `${filteredResults} de ${totalResults} resultados`
                            )}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
