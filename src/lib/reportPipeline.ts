import Anthropic from '@anthropic-ai/sdk'
import { extractTextFromFile } from './extractor'
import {
  EXTRACT_REPORT_PROMPT,
  EXPLAIN_REPORT_PROMPT,
  EXPLAIN_HINDI_PROMPT
} from '../prompts/extract-report'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function getReportText(buffer: Buffer, mimeType: string) {
  return extractTextFromFile(buffer, mimeType)
}

async function extractStructuredData(reportText: string) {
  const isImage = reportText.startsWith('__IMAGE_BASE64__')
  let response

  if (isImage) {
    const base64 = reportText.replace('__IMAGE_BASE64__', '')
    response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: EXTRACT_REPORT_PROMPT.replace('{{REPORT_TEXT}}', '[See image above]') }
        ]
      }]
    })
  } else {
    response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: EXTRACT_REPORT_PROMPT.replace('{{REPORT_TEXT}}', reportText)
      }]
    })
  }

  const raw = (response.content[0] as any).text

  // Clean the response - remove markdown, fix unicode issues
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // Try to extract just the JSON object if parsing fails
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (e2) {
        console.error('[Jivayu] JSON parse failed:', cleaned.substring(0, 200))
        throw new Error('Could not parse report data. Please try again.')
      }
    }
    throw new Error('Invalid response from AI. Please try again.')
  }
}

async function generateExplanation(structuredData: any) {
  const jsonStr = JSON.stringify(structuredData, null, 2)

  const [engRes, hinRes] = await Promise.all([
    claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: EXPLAIN_REPORT_PROMPT.replace('{{STRUCTURED_JSON}}', jsonStr) }]
    }),
    claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: EXPLAIN_HINDI_PROMPT.replace('{{STRUCTURED_JSON}}', jsonStr) }]
    })
  ])

  return {
    english: (engRes.content[0] as any).text,
    hindi: (hinRes.content[0] as any).text
  }
}

export async function processReport(buffer: Buffer, mimeType: string) {
  console.log('Step 1: Reading the file...')
  const rawText = await getReportText(buffer, mimeType)

  console.log('Step 2: Sending to Claude...')
  const structured = await extractStructuredData(rawText)

  console.log('Step 3: Generating explanations...')
  const explanations = await generateExplanation(structured)

  return {
    structured,
    explanation_en: explanations.english,
    explanation_hi: explanations.hindi,
    raw_text: rawText.startsWith('__IMAGE_BASE64__') ? '[image]' : rawText
  }
}
