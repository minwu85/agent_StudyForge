import { api } from './api'
import type { CoursePublic, WeekSummary } from '../types/Course'

export async function getCourses(): Promise<CoursePublic[]> {
  const { data } = await api.get<CoursePublic[]>('/courses')
  return data
}

export async function getWeeks(courseId: number): Promise<WeekSummary[]> {
  const { data } = await api.get<WeekSummary[]>(`/courses/${courseId}/weeks`)
  return data
}
