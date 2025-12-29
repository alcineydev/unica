'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Skeleton para QR Code
function QRCodeSkeleton() {
  return (
    <div className="flex items-center justify-center p-4">
      <Skeleton className="w-48 h-48 rounded-lg" />
    </div>
  )
}

// Skeleton para Scanner
function ScannerSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Skeleton className="w-64 h-64 rounded-lg" />
      <Skeleton className="w-32 h-4" />
    </div>
  )
}

// Skeleton para Image Cropper
function CropperSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <Skeleton className="w-full h-64 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="w-24 h-10 rounded" />
        <Skeleton className="w-24 h-10 rounded" />
      </div>
    </div>
  )
}

// Skeleton para WhatsApp Preview
function WhatsAppPreviewSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="w-full h-32 rounded-lg" />
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-4" />
    </div>
  )
}

// Lazy QR Code Generator
export const LazyQRCodeGenerator = dynamic(
  () => import('@/components/qrcode/generator').then(mod => mod.QRCodeGenerator),
  {
    loading: () => <QRCodeSkeleton />,
    ssr: false,
  }
)

// Lazy QR Code Scanner
export const LazyQRCodeScanner = dynamic(
  () => import('@/components/qrcode/scanner').then(mod => mod.QRCodeScanner),
  {
    loading: () => <ScannerSkeleton />,
    ssr: false,
  }
)

// Lazy Image Cropper
export const LazyImageCropper = dynamic(
  () => import('@/components/ui/image-cropper').then(mod => mod.ImageCropper),
  {
    loading: () => <CropperSkeleton />,
    ssr: false,
  }
)

// Lazy WhatsApp Preview
export const LazyWhatsAppPreview = dynamic(
  () => import('@/components/admin/WhatsAppPreview').then(mod => mod.default),
  {
    loading: () => <WhatsAppPreviewSkeleton />,
    ssr: false,
  }
)

// Lazy Gallery Upload
export const LazyGalleryUpload = dynamic(
  () => import('@/components/ui/gallery-upload').then(mod => mod.GalleryUpload),
  {
    loading: () => <CropperSkeleton />,
    ssr: false,
  }
)
