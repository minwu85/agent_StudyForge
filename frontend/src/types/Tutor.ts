import type { AnswerOption, Difficulty } from './Question'

export type TutorSessionStatus = 'active' | 'ended'

export interface TutorSessionCreateRequest {
  course_id: number
  week_ids?: number[] | null
  topic?: string | null
}

export interface TutorTurnPublic {
  id: number
  turn_order: number
  explanation: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  difficulty_at_time: Difficulty
  document_filename: string
  page_number: number | null
  student_answer: AnswerOption | null
  is_correct: boolean | null
  hint_used: boolean
}

export interface TutorSessionPublic {
  id: number
  course_id: number
  topic: string | null
  difficulty: Difficulty
  correct_streak: number
  incorrect_streak: number
  questions_asked: number
  questions_correct: number
  status: TutorSessionStatus
  created_at: string
  turns: TutorTurnPublic[]
}

export interface TutorAnswerRequest {
  selected_answer: AnswerOption
}

export interface TutorAnswerResponse {
  is_correct: boolean
  correct_answer: AnswerOption
  previous_difficulty: Difficulty
  new_difficulty: Difficulty
  difficulty_changed: boolean
  session: TutorSessionPublic
}

export interface TutorHintResponse {
  hint: string
}
