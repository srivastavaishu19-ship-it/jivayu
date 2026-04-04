import sharp from 'sharp'

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }

  if (mimeType.startsWith('image/')) {
    const optimised = await sharp(buffer)
      .resize(2000, 2000, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer()
    return '__IMAGE_BASE64__' + optimised.toString('base64')
  }

  if (mimeType === 'application/pdf') {
    return buffer.toString('utf-8')
  }

  throw new Error('Unsupported file type: ' + mimeType)
}
