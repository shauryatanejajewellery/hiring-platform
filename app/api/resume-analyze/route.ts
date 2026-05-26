import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resume_text, jd_text, candidate_id } = body

    if (!resume_text) {
      return NextResponse.json({ error: 'resume_text is required' }, { status: 400 })
    }

    const prompt = `You are a discerning talent evaluator for Shaurya Taneja, a luxury fine jewellery and accessories brand. Analyse this resume against the job description and return a JSON object only, no extra text.

JOB DESCRIPTION:
${jd_text || 'No JD provided — evaluate general suitability for a luxury brand role.'}

RESUME:
${resume_text}

Return valid JSON with exactly this shape:
{
  "summary": "2-3 sentence executive summary of the candidate",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "fitScore": 75
}

fitScore is 0-100. Be precise and discerning. Only return JSON, nothing else.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON')
    const analysis = JSON.parse(jsonMatch[0])

    if (candidate_id) {
      const supabase = createServerClient()
      await supabase
        .from('candidates')
        .update({
          fit_score: analysis.fitScore,
          ai_summary: analysis.summary,
          ai_strengths: analysis.strengths,
          ai_concerns: analysis.concerns,
          resume_text,
        })
        .eq('id', candidate_id)
    }

    return NextResponse.json({
      summary: analysis.summary,
      strengths: analysis.strengths,
      concerns: analysis.concerns,
      fitScore: analysis.fitScore,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
