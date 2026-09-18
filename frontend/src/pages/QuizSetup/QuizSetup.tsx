import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createQuiz, getTopics } from '../../services/quizApi'
import type { Difficulty, TopicSummary } from '../../types/Question'

const DIFFICULTIES: (Difficulty | 'any')[] = ['any', 'easy', 'medium', 'hard']

export function QuizSetup() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<TopicSummary[]>([])
  const [topic, setTopic] = useState<string>('any')
  const [difficulty, setDifficulty] = useState<Difficulty | 'any'>('any')
  const [questionCount, setQuestionCount] = useState(10)
  const [timeLimit, setTimeLimit] = useState<number | ''>(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => setError('Could not load topics. Is the backend running?'))
  }, [])

  const maxAvailable =
    topic === 'any'
      ? topics.reduce((sum, t) => sum + t.question_count, 0)
      : topics.find((t) => t.topic === topic)?.question_count ?? 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const quiz = await createQuiz({
        topic: topic === 'any' ? null : topic,
        difficulty: difficulty === 'any' ? null : difficulty,
        question_count: questionCount,
        time_limit_minutes: timeLimit === '' ? null : timeLimit,
      })
      navigate(`/quiz/${quiz.id}`)
    } catch (err) {
      setError('Could not create quiz. Try different filters.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Quiz Setup</h1>

      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="any">Any topic</option>
            {topics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic} ({t.question_count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | 'any')}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d === 'any' ? 'Any difficulty' : d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Number of questions {maxAvailable > 0 && `(up to ${maxAvailable} available)`}
          </label>
          <input
            type="number"
            min={1}
            max={Math.max(maxAvailable, 1)}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Time limit (minutes, optional)
          </label>
          <input
            type="number"
            min={1}
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="No time limit"
          />
        </div>

        <button
          type="submit"
          disabled={loading || maxAvailable === 0}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Starting…' : 'Start Exam'}
        </button>
      </form>
    </div>
  )
}
