import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — fetch all medicines for a user
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('user_id')

    if (!userId) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('medicines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ medicines: data })
}

// POST — add a new medicine
export async function POST(req: NextRequest) {
    const body = await req.json()

    const {
        user_id, name, dosage, frequency,
        timings, condition_for, prescribed_by,
        start_date, end_date
    } = body

    if (!user_id || !name) {
        return NextResponse.json(
            { error: 'user_id and name are required' },
            { status: 400 }
        )
    }

    const { data, error } = await supabaseAdmin
        .from('medicines')
        .insert({
            user_id, name, dosage, frequency,
            timings, condition_for, prescribed_by,
            start_date, end_date
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, medicine: data })
}