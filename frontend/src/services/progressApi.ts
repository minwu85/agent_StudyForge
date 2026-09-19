import { api } from './api'
import type { ProgressSummary } from '../types/Progress'

export async function getProgress(): Promise<ProgressSummary> {
  const { data } = await api.get<ProgressSummary>('/progress')
  return data
}
