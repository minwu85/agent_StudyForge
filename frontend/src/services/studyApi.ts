import { api } from './api'
import type { StudyChatResponse } from '../types/Study'

export async function askStudy(question: string, courseId: number, topK = 4): Promise<StudyChatResponse> {
  const { data } = await api.post<StudyChatResponse>('/study/chat', { question, course_id: courseId, top_k: topK })
  return data
}
