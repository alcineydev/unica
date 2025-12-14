import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'unica'
): Promise<string | null> {
  try {
    console.log('[CLOUDINARY] Config:', {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key_exists: !!process.env.CLOUDINARY_API_KEY,
      api_secret_exists: !!process.env.CLOUDINARY_API_SECRET
    })

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('[CLOUDINARY] ❌ Erro:', error)
            resolve(null)
          } else {
            console.log('[CLOUDINARY] ✅ Upload OK:', result?.secure_url)
            resolve(result?.secure_url || null)
          }
        }
      )
      
      uploadStream.end(buffer)
    })
  } catch (error) {
    console.error('[CLOUDINARY] ❌ Exception:', error)
    return null
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch {
    return false
  }
}

