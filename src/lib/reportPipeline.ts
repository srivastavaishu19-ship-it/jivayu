import Anthropic from '@anthropic-ai/sdk'
import { extractTextFromFile } from './extractor'
import {
    EXTRACT_REPORT_PROMPT,
    EXPLAIN_REPORT_PROMPT,
    EXPLAIN_HINDI_PROMPT
} from '../prompts/extract-report'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── STEP 1: Extract text from the file ─────────────
async function getReportText(
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    return extractTextFromFile(buffer, mimeType)
}

// ── STEP 2: Send to Claude — get structured JSON ────
async function extractStructuredData(
    reportText: string
): Promise<any> {

    // Is this an image? Use vision model
    const isImage = reportText.startsWith('__IMAGE_BASE64__')

    let response

    if (isImage) {
        // Vision call — image input
        const base64 = reportText.replace('__IMAGE_BASE64__', '')
        response = await claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64
                        }
                    },
                    {
                        type: 'text',
                        text: EXTRACT_REPORT_PROMPT.replace('{{REPORT_TEXT}}', '[See image above]')
                    }
                ]
            }]
        })
    } else {
        // Text call — PDF text input
        response = await claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: EXTRACT_REPORT_PROMPT.replace('{{REPORT_TEXT}}', reportText)
            }]
        })
    }

    // Parse the JSON response — clean any accidental markdown
    const raw = (response.content[0] as any).text
    const cleaned = raw
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

    return JSON.parse(cleaned)
}

// ── STEP 3: Generate plain language explanation ─────
async function generateExplanation(
    structuredData: any
): Promise<{ english: string; hindi: string }> {

    const jsonStr = JSON.stringify(structuredData, null, 2)

    // Run English + Hindi explanations in parallel (saves time)
    const [englishRes, hindiRes] = await Promise.all([
        claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: EXPLAIN_REPORT_PROMPT.replace('{{STRUCTURED_JSON}}', jsonStr)
            }]
        }),
        claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: EXPLAIN_HINDI_PROMPT.replace('{{STRUCTURED_JSON}}', jsonStr)
            }]
        })
    ])

    return {
        english: (englishRes.content[0] as any).text,
        hindi: (hindiRes.content[0] as any).text
    }
}

// ── MASTER FUNCTION — call this from the API route ──
export async function processReport(
    buffer: Buffer,
    mimeType: string
) {
    console.log('[Jivayu] Step 1: Extracting text...')
    const rawText = await getReportText(buffer, mimeType)

    console.log('[Jivayu] Step 2: Sending to Claude for extraction...')
    const structured = await extractStructuredData(rawText)

    console.log('[Jivayu] Step 3: Generating explanations...')
    const explanations = await generateExplanation(structured)

    return {
        structured,          // full JSON with all parameters
        explanation_en: explanations.english,
        explanation_hi: explanations.hindi,
        raw_text: rawText.startsWith('__IMAGE_BASE64__') ? '[image]' : rawText
    }
}