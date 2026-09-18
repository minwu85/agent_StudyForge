export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnswerOption = 'A' | 'B' | 'C' | 'D'

export interface QuestionPublic {
  id: number
  topic: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  difficulty: Difficulty
}

export interface QuestionWithAnswer extends QuestionPublic {
  correct_answer: AnswerOption
  explanation: string
}

export interface TopicSummary {
  topic: string
  question_count: number
  difficulties: Difficulty[]
}
