'use client'

import { useCallback } from 'react'

export function useTermsConsent() {
    const registerConsent = useCallback(async () => {
        try {
            const response = await fetch('/api/public/legal/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slugs: ['termos-e-condicoes', 'politica-de-privacidade']
                }),
            })

            if (!response.ok) {
                console.error('Erro ao registrar aceite dos termos')
                return false
            }

            return true
        } catch (error) {
            console.error('Erro ao registrar aceite:', error)
            return false
        }
    }, [])

    return { registerConsent }
}
