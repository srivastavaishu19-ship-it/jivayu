import { NextRequest, NextResponse } from 'next/server'
import { processReport } from '@/lib/reportPipeline'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        // ── 1. Get the uploaded file ──────────────────────
        const formData = await req.formData()
        const file = formData.get('file') as File
        const userId = formData.get('user_id') as string

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            )
        }

        // ── 2. Convert File to Buffer ─────────────────────
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // ── 3. Upload raw file to Supabase Storage ────────
        const fileName = `${userId}/${Date.now()}-${file.name}`
        const { data: fileData, error: uploadError } = await supabaseAdmin
            .storage
            .from('reports')
            .upload(fileName, buffer, { contentType: file.type })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('reports')
            .getPublicUrl(fileName)

        // ── 4. Run the full AI pipeline ───────────────────
        const result = await processReport(buffer, file.type)

        // ── 5. Save everything to Supabase database ───────
        const { data: report, error: dbError } = await supabaseAdmin
            .from('reports')
            .insert({
                user_id: userId,
                report_name: result.structured.report_name,
                lab_name: result.structured.lab_name,
                report_date: result.structured.report_date,
                raw_text: result.raw_text,
                parameters: result.structured.parameters,
                ai_explanation: result.explanation_en,
                ai_explanation_hindi: result.explanation_hi,
                file_url: publicUrl
            })
            .select()
            .single()

        if (dbError) throw dbError

        // ── 6. Log to health_events (timeline) ───────────
        await supabaseAdmin.from('health_events').insert({
            user_id: userId,
            event_type: 'report_uploaded',
            title: `Report uploaded: ${result.structured.report_name}`,
            body: `${result.structured.summary.total_parameters} parameters found. ${result.structured.summary.abnormal_count} abnormal.`,
            metadata: { report_id: report.id }
        })

        // ── 7. Return success ─────────────────────────────
        return NextResponse.json({
            success: true,
            report_id: report.id,
            structured: result.structured,
            explanation_en: result.explanation_en,
            explanation_hi: result.explanation_hi,
            file_url: publicUrl
        })

    } catch (error: any) {
        console.error('[Jivayu Error]', error)
        return NextResponse.json(
            { error: error.message || 'Something went wrong' },
            { status: 500 }
        )
    }
}