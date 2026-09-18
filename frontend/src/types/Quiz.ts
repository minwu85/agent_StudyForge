import type { AnswerOption, Difficulty, QuestionPublic } from './Question'

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
