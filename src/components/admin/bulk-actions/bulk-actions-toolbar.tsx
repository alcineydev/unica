'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
    X,
    ChevronDown,
    Trash2,
    CheckCircle,
    XCircle,
    Download,
    MoreHorizontal,
    Loader2
} from 'lucide-react'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { cn } from '@/lib/utils'

export interface BulkAction {
    id: string
    label: string
    icon?: React.ReactNode
    variant?: 'default' | 'destructive' | 'success' | 'warning'
    requiresConfirmation?: boolean
    onClick: (selectedIds: string[]) => Promise<void>
}

interface BulkActionsToolbarProps {
    selectedIds: string[]
    selectedItems?: { id: string; name: string }[]
    onClearSelection: () => void
    itemType: string // "parceiros", "assinantes", etc.
    actions: BulkAction[]
    isLoading?: boolean
}

export function BulkActionsToolbar({
    selectedIds,
    selectedItems = [],
    onClearSelection,
    itemType,
    actions,
    isLoading = false
}: BulkActionsToolbarProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<BulkAction | null>(null)
    const [executingAction, setExecutingAction] = useState<string | null>(null)

    if (selectedIds.length === 0) return null

    const handleActionClick = async (action: BulkAction) => {
        if (action.requiresConfirmation) {
            setPendingAction(action)
            setDeleteModalOpen(true)
            return
        }

        try {
            setExecutingAction(action.id)
            await action.onClick(selectedIds)
            onClearSelection()
        } catch (error) {
            console.error('Erro na ação:', error)
        } finally {
            setExecutingAction(null)
        }
    }

    const handleConfirmDelete = async () => {
        if (!pendingAction) return

        try {
            await pendingAction.onClick(selectedIds)
            onClearSelection()
        } finally {
            setPendingAction(null)
        }
    }

    const primaryActions = actions.slice(0, 3)
    const moreActions = actions.slice(3)

    return (
        <>
            <div className="sticky top-0 z-20 bg-blue-600 text-white rounded-lg p-3 mb-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Info de seleção */}
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                            {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'itens'} selecionado{selectedIds.length !== 1 ? 's' : ''}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearSelection}
                            className="text-white hover:bg-white/20 h-8 px-2"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                        </Button>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {primaryActions.map((action) => (
                            <Button
                                key={action.id}
                                variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                                size="sm"
                                onClick={() => handleActionClick(action)}
                                disabled={isLoading || executingAction !== null}
                                className={cn(
                                    action.variant === 'destructive'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-white/20 hover:bg-white/30 text-white'
                                )}
                            >
                                {executingAction === action.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : action.icon ? (
                                    <span className="mr-2">{action.icon}</span>
                                ) : null}
                                {action.label}
                            </Button>
                        ))}

                        {moreActions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/20 hover:bg-white/30 text-white"
                                    >
                                        <MoreHorizontal className="h-4 w-4 mr-1" />
                                        Mais
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {moreActions.map((action, index) => (
                                        <DropdownMenuItem
                                            key={action.id}
                                            onClick={() => handleActionClick(action)}
                                            className={action.variant === 'destructive' ? 'text-red-600' : ''}
                                        >
                                            {action.icon && <span className="mr-2">{action.icon}</span>}
                                            {action.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmação para exclusão */}
            <DeleteConfirmationModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                onConfirm={handleConfirmDelete}
                itemCount={selectedIds.length}
                itemType={itemType}
                itemNames={selectedItems.map(item => item.name)}
            />
        </>
    )
}
