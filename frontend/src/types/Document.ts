export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface DocumentPublic {
  id: number
  course_id: number
  week_id: number | null
  filename: string
  file_type: string
  status: DocumentStatus
  page_count: number | null
  pages_needing_ocr: number
  chunk_count: number
  error_message: string | null
  created_at: string
}

export interface ChunkSearchResult {
  document_id: number
  document_filename: string
  page_number: number | null
  content: string
  similarity: number
}
