import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="text-center py-16">
      <h1 className="text-3xl font-bold text-slate-900">Welcome to StudyForge</h1>
      <p className="mt-3 text-slate-600 max-w-xl mx-auto">
        Practice with topic-based quizzes, take timed exam simulations, and review your
        answers afterwards.
      </p>
      <Link
        to="/quiz/setup"
        className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
      >
        Start a New Quiz
      </Link>
    </div>
  )
}
