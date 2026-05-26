import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      role_title, department, location, employment_type, experience_level,
      responsibilities, must_have_skills, nice_to_have_skills, reporting_to, additional_context,
    } = body

    const prompt = `You are a professional copywriter for Shaurya Taneja, a luxury fine jewellery and accessories brand headquartered in New Delhi and New York. Write a refined, elegant job description in Markdown.

Role: ${role_title}
Department: ${department || 'Not specified'}
Location: ${location || 'Not specified'}
Employment Type: ${employment_type || 'Not specified'}
Experience Level: ${experience_level || 'Not specified'}
Reporting To: ${reporting_to || 'Not specified'}

Key Responsibilities:
${responsibilities}

Must-Have Skills:
${must_have_skills}

Nice-to-Have Skills:
${nice_to_have_skills || 'None specified'}

Additional Context:
${additional_context || 'None'}

Write the JD in Markdown. Use these sections: About Shaurya Taneja, About the Role, Key Responsibilities, What We're Looking For (must-have), What Would Delight Us (nice-to-have), What We Offer. Tone: luxury, discerning, refined. No corporate clichés. Keep it focused and beautiful. Do not include salary ranges unless specified.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const jd = (message.content[0] as { text: string }).text

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert({
        role_title,
        department,
        location,
        employment_type,
        experience_level,
        raw_input: body,
        generated_jd: jd,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ jd, id: data.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
