'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell, Star, Gift, ShoppingCart } from 'lucide-react'

interface NotificationModalProps {
  open: boolean
  onClose: () => void
  notification: {
    title: string
    message: string
    type: string
    link?: string
  } | null
}

export function NotificationModal({ open, onClose, notification }: NotificationModalProps) {
  const router = useRouter()

  if (!notification) return null

  const getIcon = () => {
    switch (notification.type) {
      case 'AVALIACAO':
        return <Star className="h-8 w-8 text-yellow-500" />
      case 'PONTOS':
      case 'CASHBACK':
        return <Gift className="h-8 w-8 text-purple-500" />
      case 'VENDA':
      case 'COMPRA':
        return <ShoppingCart className="h-8 w-8 text-green-500" />
      default:
        return <Bell className="h-8 w-8 text-blue-500" />
    }
  }

  const handleAction = () => {
    if (notification.link) {
      router.push(notification.link)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {getIcon()}
          </div>
          <DialogTitle className="text-xl">{notification.title}</DialogTitle>
          <DialogDescription className="text-base">
            {notification.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Depois
          </Button>
          <Button onClick={handleAction} className="flex-1">
            {notification.type === 'AVALIACAO' ? 'Avaliar Agora' : 'Ver Detalhes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
