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
    return '__IMAGE_BASE64__' + buffer.toString('base64')
  }

  throw new Error('Unsupported file type: ' + mimeType)
}
