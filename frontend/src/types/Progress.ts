export interface ScoreTrendPoint {
  quiz_id: number
  completed_at: string | null
  score_percentage: number
}

export interface TopicAccuracy {
  topic: string
  accuracy_percentage: number
  attempts: number
}

export interface ProgressSummary {
  total_quizzes: number
  average_score_percentage: number
  score_trend: ScoreTrendPoint[]
  topic_accuracy: TopicAccuracy[]
}
