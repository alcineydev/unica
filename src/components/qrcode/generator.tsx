'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent } from '@/components/ui/card'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  title?: string
  subtitle?: string
}

export function QRCodeGenerator({ 
  value, 
  size = 200,
  title,
  subtitle 
}: QRCodeGeneratorProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 flex flex-col items-center">
        {title && (
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
        )}
        
        <div className="bg-white p-4 rounded-xl">
          <QRCodeSVG
            value={value}
            size={size}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 font-mono">
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

