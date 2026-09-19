interface LeafDecorationProps {
  className?: string
  /** Which corner the leaf cluster grows from. */
  corner?: 'bottom-left' | 'top-right'
}

/** Soft botanical corner decoration — a watercolor-style wash with layered leaf silhouettes. */
export function LeafDecoration({ className = '', corner = 'bottom-left' }: LeafDecorationProps) {
  const flip = corner === 'top-right'

  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={flip ? { transform: 'rotate(180deg)' } : undefined}
    >
      <defs>
        <radialGradient id="leafWash" cx="20%" cy="85%" r="75%">
          <stop offset="0%" stopColor="var(--color-leaf-300)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--color-leaf-300)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="30" cy="210" r="140" fill="url(#leafWash)" />

      <g fill="var(--color-leaf-600)" fillOpacity="0.3">
        <path d="M10 230 C-5 175 15 120 70 100 C85 150 65 200 10 230 Z" />
      </g>
      <g fill="var(--color-leaf-500)" fillOpacity="0.28">
        <path d="M55 238 C40 190 60 145 105 130 C118 175 100 215 55 238 Z" />
      </g>
      <g fill="var(--color-leaf-400)" fillOpacity="0.25">
        <path d="M10 190 C15 155 45 130 80 128 C78 160 55 182 10 190 Z" />
      </g>

      <g stroke="var(--color-leaf-800)" strokeOpacity="0.2" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M22 222 C30 190 42 155 65 108" />
        <path d="M65 232 C72 195 82 165 100 138" />
      </g>
    </svg>
  )
}
