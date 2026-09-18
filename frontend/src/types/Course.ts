import type { Difficulty } from './Question'

export interface CoursePublic {
  id: number
  name: string
  description: string | null
}

export interface WeekSummary {
  id: number
  week_number: number
  title: string
  question_count: number
  difficulties: Difficulty[]
}
