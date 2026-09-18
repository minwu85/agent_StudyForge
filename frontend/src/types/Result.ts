import type { AnswerOption, QuestionWithAnswer } from './Question'

export interface ResultSummary {
  quiz_id: number
  question_count: number
  correct_count: number
  score_percentage: number
  started_at: string
  completed_at: string | null
  time_taken_seconds: number | null
}

export interface ReviewItem {
  question_order: number
  selected_answer: AnswerOption | null
  is_correct: boolean | null
  flagged: boolean
  question: QuestionWithAnswer
}

export interface ReviewResponse {
  quiz_id: number
  items: ReviewItem[]
}
