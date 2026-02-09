'use client'

import { useState, useEffect } from 'react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from 'lucide-react'

interface DeleteConfirmationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>
    itemCount: number
    itemType: string // "parceiros", "assinantes", etc.
    itemNames?: string[] // Lista de nomes para mostrar
}

function generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString()
}

export function DeleteConfirmationModal({
    open,
    onOpenChange,
    onConfirm,
    itemCount,
    itemType,
    itemNames = []
}: DeleteConfirmationModalProps) {
    const [confirmationCode, setConfirmationCode] = useState('')
    const [generatedCode, setGeneratedCode] = useState('')
    const [inputCode, setInputCode] = useState('')
    const [understood, setUnderstood] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState('')

    // Gerar novo código quando modal abre
    useEffect(() => {
        if (open) {
            const code = generateCode()
            setGeneratedCode(code)
            setInputCode('')
            setUnderstood(false)
            setError('')
            setIsDeleting(false)
        }
    }, [open])

    const canConfirm = understood && inputCode === generatedCode

    const handleConfirm = async () => {
        if (!canConfirm) return

        try {
            setIsDeleting(true)
            setError('')
            await onConfirm()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir')
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-full bg-red-100">
                            <ShieldAlert className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl">
                            Exclusão em Massa
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>ATENÇÃO!</strong> Esta ação é irreversível e excluirá permanentemente{' '}
                                    <strong>{itemCount} {itemType}</strong> do sistema.
                                </AlertDescription>
                            </Alert>

                            {itemNames.length > 0 && itemNames.length <= 5 && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <p className="font-medium text-gray-700 mb-2">Itens selecionados:</p>
                                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                                        {itemNames.map((name, i) => (
                                            <li key={i} className="truncate">{name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {itemNames.length > 5 && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <p className="text-gray-600">
                                        {itemNames.slice(0, 3).join(', ')} e mais {itemCount - 3} itens...
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        id="understood"
                                        checked={understood}
                                        onCheckedChange={(checked) => setUnderstood(checked === true)}
                                        className="mt-1"
                                    />
                                    <Label htmlFor="understood" className="text-sm leading-relaxed cursor-pointer">
                                        Eu entendo que esta ação é <strong>permanente</strong> e não pode ser desfeita.
                                        Todos os dados relacionados serão perdidos.
                                    </Label>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        Digite o código <span className="font-mono font-bold text-red-600 text-lg">{generatedCode}</span> para confirmar:
                                    </Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={4}
                                        placeholder="0000"
                                        value={inputCode}
                                        onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                                        className={`text-center text-2xl font-mono tracking-widest h-14 ${inputCode.length === 4 && inputCode !== generatedCode
                                                ? 'border-red-500 focus:ring-red-500'
                                                : ''
                                            }`}
                                    />
                                    {inputCode.length === 4 && inputCode !== generatedCode && (
                                        <p className="text-sm text-red-500">Código incorreto</p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!canConfirm || isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir {itemCount} {itemType}
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
