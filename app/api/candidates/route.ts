import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')

    let query = supabase
      .from('candidates')
      .select('*, job_descriptions(role_title)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (stage) query = query.eq('pipeline_stage', stage)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        location: body.location || null,
        current_title: body.current_title || null,
        current_company: body.current_company || null,
        linkedin_url: body.linkedin_url || null,
        resume_text: body.resume_text || null,
        jd_id: body.jd_id || null,
        pipeline_stage: body.pipeline_stage || 'Applied',
        fit_score: body.fit_score || null,
        ai_summary: body.ai_summary || null,
        ai_strengths: body.ai_strengths || null,
        ai_concerns: body.ai_concerns || null,
        notes: body.notes || null,
        tags: body.tags || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('candidate_activity').insert({
      candidate_id: data.id,
      activity_type: 'candidate_created',
      description: `Candidate profile created.`,
      metadata: {},
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
