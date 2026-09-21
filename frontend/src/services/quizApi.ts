import { api } from './api'
import type { ResultSummary, ReviewResponse } from '../types/Result'
import type {
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  QuizCreateRequest,
  QuizPublic,
  QuizSubmitRequest,
} from '../types/Quiz'
import type { TopicSummary } from '../types/Question'

export async function getTopics(): Promise<TopicSummary[]> {
  const { data } = await api.get<TopicSummary[]>('/questions/topics')
  return data
}

export async function createQuiz(request: QuizCreateRequest): Promise<QuizPublic> {
  const { data } = await api.post<QuizPublic>('/quizzes', request)
  return data
}

export async function generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
  const { data } = await api.post<QuestionGenerationResponse>('/quizzes/generate-questions', request)
  return data
}

export async function getQuiz(quizId: number): Promise<QuizPublic> {
  const { data } = await api.get<QuizPublic>(`/quizzes/${quizId}`)
  return data
}

export async function submitQuiz(quizId: number, request: QuizSubmitRequest): Promise<QuizPublic> {
  const { data } = await api.post<QuizPublic>(`/quizzes/${quizId}/submit`, request)
  return data
}

export async function getResultSummary(quizId: number): Promise<ResultSummary> {
  const { data } = await api.get<ResultSummary>(`/results/${quizId}`)
  return data
}

export async function getReview(quizId: number): Promise<ReviewResponse> {
  const { data } = await api.get<ReviewResponse>(`/results/${quizId}/review`)
  return data
}
