'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface TermsAcceptanceProps {
    onAcceptanceChange: (accepted: boolean) => void
}

export function TermsAcceptance({ onAcceptanceChange }: TermsAcceptanceProps) {
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

    const handleTermsChange = (checked: boolean) => {
        setAcceptedTerms(checked)
        onAcceptanceChange(checked && acceptedPrivacy)
    }

    const handlePrivacyChange = (checked: boolean) => {
        setAcceptedPrivacy(checked)
        onAcceptanceChange(acceptedTerms && checked)
    }

    return (
        <div className="space-y-4 py-4 border-t border-b my-4">
            <p className="text-sm font-medium text-gray-700">
                Para continuar, você precisa aceitar os termos:
            </p>

            <div className="flex items-start space-x-3">
                <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => handleTermsChange(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Li e aceito os{' '}
                    <Link
                        href="/termos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Termos e Condições
                    </Link>
                    {' '}do serviço.
                </Label>
            </div>

            <div className="flex items-start space-x-3">
                <Checkbox
                    id="privacy"
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => handlePrivacyChange(checked === true)}
                />
                <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                    Li e aceito a{' '}
                    <Link
                        href="/privacidade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Política de Privacidade
                    </Link>.
                </Label>
            </div>
        </div>
    )
}
