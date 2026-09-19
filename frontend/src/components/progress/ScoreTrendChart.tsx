import type { ScoreTrendPoint } from '../../types/Progress'

const WIDTH = 600
const HEIGHT = 180
const PADDING = 24

export function ScoreTrendChart({ points }: { points: ScoreTrendPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-stone-400">No completed quizzes yet.</p>
  }

  const innerWidth = WIDTH - PADDING * 2
  const innerHeight = HEIGHT - PADDING * 2

  const toXY = (index: number, score: number) => {
    const x = PADDING + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth)
    const y = PADDING + innerHeight - (score / 100) * innerHeight
    return [x, y] as const
  }

  const linePath = points.map((p, i) => toXY(i, p.score_percentage)).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const [lastX] = toXY(points.length - 1, points[points.length - 1].score_percentage)
  const [firstX] = toXY(0, points[0].score_percentage)
  const areaPath = `${linePath} L${lastX},${PADDING + innerHeight} L${firstX},${PADDING + innerHeight} Z`

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-44" preserveAspectRatio="none">
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = PADDING + innerHeight - (pct / 100) * innerHeight
        return (
          <g key={pct}>
            <line x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} stroke="var(--color-stone-200)" strokeWidth="1" />
            <text x={2} y={y + 3} fontSize="9" fill="var(--color-stone-400)">
              {pct}
            </text>
          </g>
        )
      })}

      <path d={areaPath} fill="var(--color-leaf-200)" fillOpacity="0.4" stroke="none" />
      <path d={linePath} fill="none" stroke="var(--color-leaf-600)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => {
        const [x, y] = toXY(i, p.score_percentage)
        return <circle key={p.quiz_id} cx={x} cy={y} r="3.5" fill="var(--color-leaf-700)" />
      })}
    </svg>
  )
}
