'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Gift, Search, Check } from 'lucide-react'

interface Benefit {
    id: string
    name: string
    description?: string
    type?: string
}

interface PlanBenefitsSelectorProps {
    allBenefits: Benefit[]
    selectedBenefitIds: string[]
    onChange: (ids: string[]) => void
}

export function PlanBenefitsSelector({
    allBenefits,
    selectedBenefitIds,
    onChange
}: PlanBenefitsSelectorProps) {
    const [search, setSearch] = useState('')

    const toggleBenefit = (benefitId: string) => {
        if (selectedBenefitIds.includes(benefitId)) {
            onChange(selectedBenefitIds.filter(id => id !== benefitId))
        } else {
            onChange([...selectedBenefitIds, benefitId])
        }
    }

    const toggleAll = () => {
        if (selectedBenefitIds.length === allBenefits.length) {
            onChange([])
        } else {
            onChange(allBenefits.map(b => b.id))
        }
    }

    // Filtrar por busca
    const filteredBenefits = allBenefits.filter(benefit =>
        benefit.name?.toLowerCase().includes(search.toLowerCase()) ||
        benefit.description?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Benefícios do Plano
                    </CardTitle>
                    <Badge variant="secondary">
                        {selectedBenefitIds.length} selecionado(s)
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Busca e Selecionar Todos */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar benefício..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                    >
                        {selectedBenefitIds.length === allBenefits.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                </div>

                {/* Lista de Benefícios */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredBenefits.map((benefit) => {
                            const isSelected = selectedBenefitIds.includes(benefit.id)

                            return (
                                <div
                                    key={benefit.id}
                                    onClick={() => toggleBenefit(benefit.id)}
                                    className={`
                    relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${isSelected
                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }
                  `}
                                >
                                    {/* Checkbox customizado */}
                                    <div className={`
                    flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center
                    transition-colors duration-200
                    ${isSelected
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-300 bg-white'
                                        }
                  `}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {benefit.name}
                                        </p>
                                        {benefit.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {benefit.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Indicador de selecionado */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {filteredBenefits.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Gift className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>Nenhum benefício encontrado</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
