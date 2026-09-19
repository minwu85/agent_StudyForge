import { useEffect, useState } from 'react'
import { getCourses } from '../../services/courseApi'
import { askStudy } from '../../services/studyApi'
import type { CoursePublic } from '../../types/Course'
import type { StudyChatResponse } from '../../types/Study'

export function Study() {
  const [course, setCourse] = useState<CoursePublic | null>(null)
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [response, setResponse] = useState<StudyChatResponse | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCourses()
      .then((courses) => setCourse(courses[0] ?? null))
      .catch(() => setError('Could not load courses. Is the backend running?'))
  }, [])

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    if (!course || !question.trim()) return
    setAsking(true)
    setError(null)
    setShowPrompt(false)
    try {
      const result = await askStudy(question, course.id)
      setResponse(result)
    } catch {
      setError('Could not get an answer. Is the backend running?')
    } finally {
      setAsking(false)
    }
  }

  const isStub = response?.model.startsWith('stub')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Study</h1>
      {course && <p className="text-sm text-stone-500 mb-6">{course.name}</p>}

      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your uploaded material…"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={asking}
          className="rounded-md bg-leaf-600 px-5 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-50"
        >
          {asking ? 'Asking…' : 'Ask'}
        </button>
      </form>

      {response && (
        <div className="mt-6 space-y-4">
          {isStub && (
            <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              No LLM is connected yet (see docs/backend.md, Phase 4) — showing the closest matching
              passage instead of a generated answer. The exact prompt that would be sent to an LLM is
              shown below.
            </p>
          )}

          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <p className="text-stone-800 whitespace-pre-wrap">{response.answer}</p>
          </div>

          {response.sources.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-stone-700 mb-2">Sources</h2>
              <div className="space-y-2">
                {response.sources.map((s, i) => (
                  <div key={i} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs">
                    <div className="flex items-center justify-between text-stone-500">
                      <span>
                        {s.document_filename}
                        {s.page_number !== null && ` · page ${s.page_number}`}
                      </span>
                      <span>{Math.round(s.similarity * 100)}% match</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <button
              onClick={() => setShowPrompt((v) => !v)}
              className="text-xs text-stone-500 hover:text-stone-800 underline"
            >
              {showPrompt ? 'Hide' : 'View'} the prompt that would be sent to the LLM
            </button>
            {showPrompt && (
              <pre className="mt-2 rounded-md bg-stone-900 text-stone-100 text-xs p-4 overflow-x-auto whitespace-pre-wrap">
                {response.prompt}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
