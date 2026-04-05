export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }

  if (mimeType === 'application/pdf') {
    return buffer.toString('utf-8')
  }

  if (mimeType.startsWith('image/')) {
    const sharp = require('sharp')
    
    // Get image info first
    const metadata = await sharp(buffer).metadata()
    const sizeInMB = buffer.length / (1024 * 1024)
    
    let processedBuffer = buffer
    
    if (sizeInMB > 4) {
      // Compress: resize to max 1600px wide and reduce quality
      processedBuffer = await sharp(buffer)
        .resize(1600, 1600, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 70 })
        .toBuffer()
      
      console.log(`[Jivayu] Compressed image from ${sizeInMB.toFixed(1)}MB to ${(processedBuffer.length / 1024 / 1024).toFixed(1)}MB`)
    }
    
    return '__IMAGE_BASE64__' + processedBuffer.toString('base64')
  }

  throw new Error('Unsupported file type: ' + mimeType)
}
