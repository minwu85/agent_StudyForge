import { useEffect, useRef, useState } from 'react'
import { getCourses, getWeeks } from '../../services/courseApi'
import { deleteDocument, getDocuments, searchDocuments, uploadDocument } from '../../services/documentApi'
import type { CoursePublic, WeekSummary } from '../../types/Course'
import type { ChunkSearchResult, DocumentPublic } from '../../types/Document'

const STATUS_STYLES: Record<DocumentPublic['status'], string> = {
  pending: 'bg-slate-100 text-slate-600',
  processing: 'bg-amber-100 text-amber-700',
  ready: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

export function Documents() {
  const [course, setCourse] = useState<CoursePublic | null>(null)
  const [weeks, setWeeks] = useState<WeekSummary[]>([])
  const [documents, setDocuments] = useState<DocumentPublic[]>([])
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ChunkSearchResult[] | null>(null)

  const loadDocuments = (courseId: number) => {
    getDocuments(courseId)
      .then(setDocuments)
      .catch(() => setError('Could not load documents.'))
  }

  useEffect(() => {
    getCourses()
      .then((courses) => {
        const first = courses[0] ?? null
        setCourse(first)
        if (!first) return
        getWeeks(first.id).then(setWeeks)
        loadDocuments(first.id)
      })
      .catch(() => setError('Could not load courses. Is the backend running?'))
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!course || !file) return

    setUploading(true)
    setError(null)
    try {
      await uploadDocument(course.id, selectedWeekId ? Number(selectedWeekId) : null, file)
      loadDocuments(course.id)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setError('Upload failed. Only PDF files are supported right now.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(documentId: number) {
    if (!course) return
    await deleteDocument(documentId)
    loadDocuments(course.id)
    setResults(null)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    try {
      const found = await searchDocuments(query, course?.id)
      setResults(found)
    } catch {
      setError('Search failed.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Documents</h1>
        {course && <p className="text-sm text-slate-500 mb-6">{course.name}</p>}

        {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

        <form onSubmit={handleUpload} className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Week (optional)</label>
            <select
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">No specific week</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  Week {w.week_number}: {w.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PDF file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading & processing…' : 'Upload'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {documents.length === 0 && <p className="text-sm text-slate-400">No documents uploaded yet.</p>}
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900 text-sm">{doc.filename}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {doc.page_count ?? '?'} page{doc.page_count === 1 ? '' : 's'} · {doc.chunk_count} chunk
                  {doc.chunk_count === 1 ? '' : 's'}
                  {doc.pages_needing_ocr > 0 && (
                    <span className="text-amber-600"> · {doc.pages_needing_ocr} scanned page(s) skipped (OCR not implemented yet)</span>
                  )}
                  {doc.status === 'failed' && doc.error_message && (
                    <span className="text-red-600"> · {doc.error_message}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLES[doc.status]}`}>{doc.status}</span>
                <button onClick={() => handleDelete(doc.id)} className="text-xs text-slate-400 hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Search your material</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What ordering does a stack use?"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        {results && (
          <div className="mt-4 space-y-3">
            {results.length === 0 && <p className="text-sm text-slate-400">No matches found.</p>}
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>
                    {r.document_filename}
                    {r.page_number !== null && ` · page ${r.page_number}`}
                  </span>
                  <span>{Math.round(r.similarity * 100)}% match</span>
                </div>
                <p className="text-sm text-slate-700">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
