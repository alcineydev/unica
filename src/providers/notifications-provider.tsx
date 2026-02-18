'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface NotificationsContextType {
    unreadCount: number
    refreshCount: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType>({
    unreadCount: 0,
    refreshCount: async () => { },
})

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0)

    const refreshCount = useCallback(async () => {
        try {
            const res = await fetch('/api/app/notifications/count')
            if (res.ok) {
                const data = await res.json()
                setUnreadCount(data.count || 0)
            }
        } catch {
            // silencioso
        }
    }, [])

    useEffect(() => {
        refreshCount()
        const interval = setInterval(refreshCount, 30000) // 30s polling
        return () => clearInterval(interval)
    }, [refreshCount])

    return (
        <NotificationsContext.Provider value={{ unreadCount, refreshCount }}>
            {children}
        </NotificationsContext.Provider>
    )
}

export const useNotifications = () => useContext(NotificationsContext)
