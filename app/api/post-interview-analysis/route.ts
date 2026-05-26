import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { round_id, candidate_id } = await req.json()
    if (!round_id) return NextResponse.json({ error: 'round_id required' }, { status: 400 })

    const supabase = createServerClient()

    const [{ data: round }, { data: candidate }, { data: scores }] = await Promise.all([
      supabase.from('interview_rounds').select('*').eq('id', round_id).single(),
      supabase.from('candidates').select('full_name, current_title, fit_score, ai_summary').eq('id', candidate_id).single(),
      supabase
        .from('scorecard_scores')
        .select('*, scorecard_criteria(name, description, max_score)')
        .eq('round_id', round_id),
    ])

    if (!round) throw new Error('Round not found')

    const totalScore = scores?.reduce((sum, s) => sum + (s.score || 0), 0) ?? 0
    const maxScore = 60

    const scoreLines = scores?.map(s => {
      const crit = s.scorecard_criteria as { name: string; description: string; max_score: number } | null
      return `${crit?.name || 'Unknown'}: ${s.score}/${crit?.max_score || 10}${s.notes ? ` — "${s.notes}"` : ''}`
    }).join('\n') ?? ''

    const prompt = `You are evaluating an interview for Shaurya Taneja, a luxury fine jewellery brand. Provide a post-interview analysis as JSON only.

Candidate: ${candidate?.full_name || 'Unknown'}
Role: ${candidate?.current_title || 'Unknown'}
Round: ${round.round_name} (Round ${round.round_number})
Interviewer: ${round.interviewer}
Total Score: ${totalScore}/${maxScore}
Prior AI Summary: ${candidate?.ai_summary || 'None'}

Scorecard:
${scoreLines}

Round Notes: ${round.notes || 'None'}

Return valid JSON only:
{
  "summary": "3-4 sentence synthesis of this interview round",
  "recommendation": "Advance to next round / Make offer / Reject / Hold — with one sentence rationale",
  "nextSteps": "Specific, actionable next steps"
}

Only return JSON, nothing else.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON')
    const analysis = JSON.parse(jsonMatch[0])

    await supabase
      .from('interview_rounds')
      .update({
        total_score: totalScore,
        ai_summary: analysis.summary,
        ai_recommendation: analysis.recommendation,
        next_steps: analysis.nextSteps,
        status: 'completed',
      })
      .eq('id', round_id)

    await supabase.from('candidate_activity').insert({
      candidate_id,
      activity_type: 'post_interview_analysis',
      description: `Post-interview analysis generated for ${round.round_name}. Score: ${totalScore}/${maxScore}.`,
      metadata: { round_id, round_name: round.round_name, total_score: totalScore },
    })

    return NextResponse.json({
      summary: analysis.summary,
      recommendation: analysis.recommendation,
      nextSteps: analysis.nextSteps,
      totalScore,
      maxScore,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
