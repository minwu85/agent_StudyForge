import { useEffect, useRef, useState } from 'react'

/** Counts down from `totalSeconds`, calling `onExpire` once when it reaches zero. */
export function useTimer(totalSeconds: number | null, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    setSecondsLeft(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) {
      onExpireRef.current()
      return
    }
    const id = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  return secondsLeft
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
