import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('user_id')

    if (!userId) {
        return NextResponse.json(
            { error: 'user_id is required' }, { status: 400 }
        )
    }

    // Fetch all events newest first
    const { data: events, error } = await supabaseAdmin
        .from('health_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        return NextResponse.json(
            { error: error.message }, { status: 500 }
        )
    }

    return NextResponse.json({ events, total: events.length })
}