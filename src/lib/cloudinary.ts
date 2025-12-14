const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unica_unsigned'

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'unica'
): Promise<string | null> {
  try {
    console.log('[CLOUDINARY] Iniciando upload unsigned...')
    console.log('[CLOUDINARY] Cloud name:', CLOUD_NAME)
    console.log('[CLOUDINARY] Upload preset:', UPLOAD_PRESET)

    if (!CLOUD_NAME) {
      console.error('[CLOUDINARY] CLOUD_NAME não configurado!')
      return null
    }

    const base64Data = `data:image/jpeg;base64,${buffer.toString('base64')}`

    const formData = new FormData()
    formData.append('file', base64Data)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', folder)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[CLOUDINARY] Erro:', JSON.stringify(errorData))
      return null
    }

    const data = await response.json()
    console.log('[CLOUDINARY] Sucesso! URL:', data.secure_url)
    
    return data.secure_url

  } catch (error) {
    console.error('[CLOUDINARY] Exceção:', error)
    return null
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  console.log('[CLOUDINARY] Delete solicitado para:', publicId)
  return true
}
