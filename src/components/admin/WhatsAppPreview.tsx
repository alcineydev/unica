'use client'

import { ExternalLink } from 'lucide-react'

interface WhatsAppPreviewProps {
  message: string
  imageUrl?: string
  linkUrl?: string
  linkText?: string
}

export function WhatsAppPreview({ message, imageUrl, linkUrl, linkText }: WhatsAppPreviewProps) {
  return (
    <div className="bg-[#0b141a] rounded-lg p-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#222d34]">
        <div className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center">
          <span className="text-white font-bold text-lg">U</span>
        </div>
        <div>
          <p className="text-white font-medium text-sm">Unica Benefícios</p>
          <p className="text-[#8696a0] text-xs">online</p>
        </div>
      </div>

      {/* Message Bubble */}
      <div className="flex justify-start">
        <div className="bg-[#202c33] rounded-lg rounded-tl-none max-w-[280px] overflow-hidden">
          {/* Image */}
          {imageUrl && (
            <div className="w-full">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-40 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
          
          {/* Message Text */}
          <div className="p-3">
            <p className="text-[#e9edef] text-sm whitespace-pre-wrap break-words">
              {message || 'Sua mensagem aparecerá aqui...'}
            </p>
            
            {/* Link Button */}
            {linkUrl && linkText && (
              <div className="mt-2 pt-2 border-t border-[#3b4a54]">
                <a 
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-[#53bdeb] text-sm hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {linkText}
                </a>
              </div>
            )}
            
            {/* Time */}
            <div className="flex justify-end mt-1">
              <span className="text-[#8696a0] text-[10px]">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area (visual only) */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 bg-[#2a3942] rounded-full py-2 px-4">
          <span className="text-[#8696a0] text-sm">Mensagem</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

