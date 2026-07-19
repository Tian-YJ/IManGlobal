import { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

function useInView(threshold = 0.35) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, threshold])

  return [ref, inView]
}

function CountUpValue({ value, prefix = '', suffix = '', duration = 1600, active = true }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!active) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setDisplay(value)
      return undefined
    }

    let frame = 0
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      setDisplay(value * easeOutCubic(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, duration, value])

  return <>{prefix}{Math.round(display).toLocaleString('en-US')}{suffix}</>
}

export function StatCounter({ value, prefix = '', suffix = '', label, duration = 1600 }) {
  const [ref, inView] = useInView()

  return (
    <Box ref={ref} className="stat-counter">
      <Typography variant="h2" className="stat-counter__value">
        <CountUpValue value={value} prefix={prefix} suffix={suffix} duration={duration} active={inView} />
      </Typography>
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  )
}
