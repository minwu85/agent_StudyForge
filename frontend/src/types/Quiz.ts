import type { AnswerOption, Difficulty, QuestionPublic, QuestionWithAnswer } from './Question'

export type QuizStatus = 'in_progress' | 'completed'

export interface QuizCreateRequest {
  topic?: string | null
  difficulty?: Difficulty | null
  week_ids?: number[] | null
  question_count: number
  time_limit_minutes?: number | null
}

export interface QuizQuestionPublic {
  question_order: number
  selected_answer: AnswerOption | null
  flagged: boolean
  question: QuestionPublic
}

export interface QuizPublic {
  id: number
  topic: string | null
  difficulty: string | null
  week_ids: number[] | null
  question_count: number
  time_limit_minutes: number | null
  status: QuizStatus
  started_at: string
  quiz_questions: QuizQuestionPublic[]
}

export interface AnswerSubmission {
  question_id: number
  selected_answer: AnswerOption | null
  flagged: boolean
}

export interface QuizSubmitRequest {
  answers: AnswerSubmission[]
}

export interface QuestionGenerationRequest {
  course_id: number
  week_ids?: number[] | null
  topic?: string | null
  difficulty: Difficulty
  question_count: number
}

export interface RejectedCandidate {
  document_filename: string
  page_number: number | null
  reason: string
}

export interface QuestionGenerationResponse {
  requested: number
  accepted: QuestionWithAnswer[]
  rejected: RejectedCandidate[]
}
