export type PipelineStage = 'Applied' | 'Interviewed' | 'Offered' | 'Hired' | 'Rejected'
export type RoundStatus = 'scheduled' | 'in_progress' | 'completed'

export interface JobDescription {
  id: string
  created_at: string
  updated_at: string
  role_title: string
  department: string | null
  location: string | null
  employment_type: string | null
  experience_level: string | null
  raw_input: Record<string, unknown> | null
  generated_jd: string | null
  is_active: boolean
}

export interface Candidate {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  email: string | null
  phone: string | null
  location: string | null
  current_title: string | null
  current_company: string | null
  linkedin_url: string | null
  resume_url: string | null
  resume_text: string | null
  jd_id: string | null
  pipeline_stage: PipelineStage
  fit_score: number | null
  ai_summary: string | null
  ai_strengths: string[] | null
  ai_concerns: string[] | null
  notes: string | null
  tags: string[] | null
  is_active: boolean
  job_descriptions?: { role_title: string } | null
}

export interface InterviewRound {
  id: string
  created_at: string
  updated_at: string
  candidate_id: string
  round_number: number
  round_name: string
  interview_date: string | null
  interviewer: string
  status: RoundStatus
  total_score: number | null
  max_score: number
  ai_recommendation: string | null
  ai_summary: string | null
  next_steps: string | null
  notes: string | null
}

export interface ScorecardCriterion {
  id: string
  created_at: string
  name: string
  description: string | null
  max_score: number
  category: string | null
  sort_order: number
  is_active: boolean
}

export interface ScorecardScore {
  id: string
  created_at: string
  updated_at: string
  round_id: string
  criterion_id: string
  score: number
  notes: string | null
  scorecard_criteria?: ScorecardCriterion
}

export interface CandidateActivity {
  id: string
  created_at: string
  candidate_id: string
  activity_type: string
  description: string
  metadata: Record<string, unknown> | null
}

export interface ResumeAnalysis {
  summary: string
  strengths: string[]
  concerns: string[]
  fitScore: number
}

export interface PostInterviewAnalysis {
  summary: string
  recommendation: string
  nextSteps: string
  totalScore: number
  maxScore: number
}
