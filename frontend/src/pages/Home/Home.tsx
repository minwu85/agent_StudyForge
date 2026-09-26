import { BarChart3, ClipboardList, FileText, GraduationCap, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LeafDecoration } from '../../components/common/LeafDecoration'

const QUICK_LINKS = [
  {
    to: '/documents',
    icon: FileText,
    title: 'Documents',
    description: 'Upload lecture PDFs and make them semantically searchable.',
  },
  {
    to: '/study',
    icon: Sparkles,
    title: 'Study',
    description: 'Ask a question and retrieve grounded material from your uploads.',
  },
  {
    to: '/tutor',
    icon: GraduationCap,
    title: 'Tutor',
    description: 'Work through your material passage-by-passage with adaptive difficulty.',
  },
  {
    to: '/quiz/setup',
    icon: ClipboardList,
    title: 'Quiz',
    description: 'Build a timed exam filtered by week, topic, or difficulty.',
  },
  {
    to: '/progress',
    icon: BarChart3,
    title: 'Progress',
    description: 'Track your scores over time and see your weak topics.',
  },
]

export function Home() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-leaf-100 bg-white">
        <LeafDecoration corner="bottom-left" className="absolute -left-6 -bottom-10 w-56 h-56" />
        <LeafDecoration corner="top-right" className="absolute -right-6 -top-10 w-56 h-56" />

        <div className="relative text-center py-20 px-6">
          <h1 className="text-3xl font-bold text-stone-900">Welcome to StudyForge</h1>
          <p className="mt-3 text-stone-600 max-w-xl mx-auto">
            Practice with topic-based quizzes, take timed exam simulations, and review your
            answers afterwards.
          </p>
          <Link
            to="/quiz/setup"
            className="mt-8 inline-block rounded-lg bg-leaf-600 px-6 py-3 text-white font-medium hover:bg-leaf-700 transition-colors"
          >
            Start a New Quiz
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5 hover:border-leaf-300 hover:shadow-sm transition-all"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-leaf-100 text-leaf-700">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-medium text-stone-900">{title}</span>
              <span className="block mt-1 text-sm text-stone-500">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
