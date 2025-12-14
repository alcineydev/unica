import crypto from 'crypto'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'unica'
): Promise<string | null> {
  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      console.error('[CLOUDINARY] Variáveis de ambiente não configuradas')
      console.error('[CLOUDINARY] CLOUD_NAME:', !!CLOUD_NAME)
      console.error('[CLOUDINARY] API_KEY:', !!API_KEY)
      console.error('[CLOUDINARY] API_SECRET:', !!API_SECRET)
      return null
    }

    const timestamp = Math.floor(Date.now() / 1000).toString()
    
    // Criar assinatura
    const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    // Converter buffer para base64
    const base64Data = `data:image/jpeg;base64,${buffer.toString('base64')}`

    // Criar FormData
    const formData = new FormData()
    formData.append('file', base64Data)
    formData.append('folder', folder)
    formData.append('timestamp', timestamp)
    formData.append('api_key', API_KEY)
    formData.append('signature', signature)

    // Upload via API REST
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CLOUDINARY] Erro na resposta:', response.status, errorText)
      return null
    }

    const data = await response.json()
    console.log('[CLOUDINARY] Upload bem sucedido:', data.secure_url)
    return data.secure_url

  } catch (error) {
    console.error('[CLOUDINARY] Erro no upload:', error)
    return null
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return false
    }

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    const formData = new FormData()
    formData.append('public_id', publicId)
    formData.append('timestamp', timestamp)
    formData.append('api_key', API_KEY)
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData
      }
    )

    return response.ok

  } catch {
    return false
  }
}
