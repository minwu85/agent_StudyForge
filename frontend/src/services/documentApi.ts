import { api } from './api'
import type { ChunkSearchResult, DocumentPublic } from '../types/Document'

export async function uploadDocument(courseId: number, weekId: number | null, file: File): Promise<DocumentPublic> {
  const formData = new FormData()
  formData.append('course_id', String(courseId))
  if (weekId !== null) formData.append('week_id', String(weekId))
  formData.append('file', file)

  const { data } = await api.post<DocumentPublic>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getDocuments(courseId?: number): Promise<DocumentPublic[]> {
  const { data } = await api.get<DocumentPublic[]>('/documents', { params: courseId ? { course_id: courseId } : undefined })
  return data
}

export async function deleteDocument(documentId: number): Promise<void> {
  await api.delete(`/documents/${documentId}`)
}

export async function searchDocuments(query: string, courseId?: number, topK = 5): Promise<ChunkSearchResult[]> {
  const { data } = await api.post<ChunkSearchResult[]>('/documents/search', { query, course_id: courseId ?? null, top_k: topK })
  return data
}
