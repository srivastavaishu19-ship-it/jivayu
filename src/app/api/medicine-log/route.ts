import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST — log a medicine as taken or missed
export async function POST(req: NextRequest) {
    const { medicine_id, user_id, status, scheduled_time } = await req.json()

    if (!medicine_id || !user_id || !status) {
        return NextResponse.json(
            { error: 'medicine_id, user_id and status are required' },
            { status: 400 }
        )
    }

    const { data, error } = await supabaseAdmin
        .from('medicine_logs')
        .insert({ medicine_id, user_id, status, scheduled_time })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, log: data })
}

// GET — fetch adherence for last 7 days
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('user_id')

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data, error } = await supabaseAdmin
        .from('medicine_logs')
        .select('*, medicines(name, dosage)')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate adherence percentage
    const total = data.length
    const taken = data.filter(l => l.status === 'taken').length
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 0

    return NextResponse.json({ logs: data, adherence_percent: adherence })
}