export interface SourceExcerpt {
  document_id: number
  document_filename: string
  page_number: number | null
  similarity: number
  excerpt: string
}

export interface StudyChatResponse {
  question: string
  answer: string
  model: string
  sources: SourceExcerpt[]
  prompt: string
}
