import { api } from './api'
import type {
  TutorAnswerRequest,
  TutorAnswerResponse,
  TutorHintResponse,
  TutorSessionCreateRequest,
  TutorSessionPublic,
} from '../types/Tutor'

export async function createTutorSession(request: TutorSessionCreateRequest): Promise<TutorSessionPublic> {
  const { data } = await api.post<TutorSessionPublic>('/tutor/sessions', request)
  return data
}

export async function getTutorSession(sessionId: number): Promise<TutorSessionPublic> {
  const { data } = await api.get<TutorSessionPublic>(`/tutor/sessions/${sessionId}`)
  return data
}

export async function submitTutorAnswer(sessionId: number, request: TutorAnswerRequest): Promise<TutorAnswerResponse> {
  const { data } = await api.post<TutorAnswerResponse>(`/tutor/sessions/${sessionId}/answer`, request)
  return data
}

export async function getTutorHint(sessionId: number): Promise<TutorHintResponse> {
  const { data } = await api.post<TutorHintResponse>(`/tutor/sessions/${sessionId}/hint`)
  return data
}
