const pdfParse = require('pdf-parse')
import sharp from 'sharp'

export async function extractTextFromFile(
    buffer: Buffer,
    mimeType: string
): Promise<string> {

    if (mimeType === 'text/plain') {
        return buffer.toString('utf-8')
    }

    if (mimeType === 'application/pdf') {
        const data = await pdfParse(buffer)
        if (data.text.trim().length > 100) {
            return data.text
        }
    }

    if (mimeType.startsWith('image/')) {
        const optimised = await sharp(buffer)
            .resize(2000, 2000, { fit: 'inside' })
            .jpeg({ quality: 90 })
            .toBuffer()
        return '__IMAGE_BASE64__' + optimised.toString('base64')
    }

    throw new Error('Unsupported file type: ' + mimeType)
}