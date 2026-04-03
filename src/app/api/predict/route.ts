import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { detectTrends } from '@/lib/trendDetector'
import { PREDICT_HEALTH_PROMPT } from '@/prompts/extract-report'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('user_id')

        if (!userId) {
            return NextResponse.json(
                { error: 'user_id is required' }, { status: 400 }
            )
        }

        // Step 1 — Fetch all reports for this user
        console.log('[Predict] Fetching reports...')
        const { data: reports, error: reportsError } = await supabaseAdmin
            .from('reports')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        if (reportsError) throw reportsError

        if (!reports || reports.length === 0) {
            return NextResponse.json({
                message: 'No reports found. Upload at least one report to get predictions.',
                predictions: []
            })
        }

        // Step 2 — Detect trends across reports
        console.log('[Predict] Detecting trends...')
        const trends = detectTrends(reports)
        const concerningTrends = trends.filter(t => t.is_concerning)

        // Step 3 — Build health history summary for Claude
        const healthHistory = {
            total_reports: reports.length,
            date_range: {
                first: reports[0].created_at,
                last: reports[reports.length - 1].created_at
            },
            concerning_trends: concerningTrends,
            latest_report_parameters: reports[reports.length - 1].parameters,
            all_trends: trends
        }

        // Step 4 — Send to Claude for predictions
        console.log('[Predict] Asking Claude for predictions...')
        const prompt = PREDICT_HEALTH_PROMPT.replace(
            '{{HEALTH_HISTORY}}',
            JSON.stringify(healthHistory, null, 2)
        )

        const response = await claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
        })

        const raw = (response.content[0] as any).text
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
        const aiResult = JSON.parse(cleaned)

        // Step 5 — Save predictions to database
        for (const pred of aiResult.predictions) {
            await supabaseAdmin.from('predictions').insert({
                user_id: userId,
                condition: pred.condition,
                risk_level: pred.risk_level,
                risk_percent: pred.risk_percent,
                reasoning: pred.reasoning,
                recommendations: pred.recommendations
            })
        }

        // Step 6 — Log to health events timeline
        await supabaseAdmin.from('health_events').insert({
            user_id: userId,
            event_type: 'ai_prediction',
            title: 'AI Health Prediction Generated',
            body: `Analysed ${reports.length} reports. Found ${concerningTrends.length} concerning trends.`,
            metadata: { predictions_count: aiResult.predictions.length }
        })

        return NextResponse.json({
            success: true,
            reports_analysed: reports.length,
            trends: concerningTrends,
            predictions: aiResult.predictions,
            overall_health_score: aiResult.overall_health_score,
            top_concern: aiResult.top_concern,
            positive_findings: aiResult.positive_findings
        })

    } catch (error: any) {
        console.error('[Predict Error]', error)
        return NextResponse.json(
            { error: error.message }, { status: 500 }
        )
    }
}