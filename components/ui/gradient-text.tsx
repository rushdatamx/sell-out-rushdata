"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// ============================================================================
// GRADIENT TEXT - Texto con gradiente animado
// ============================================================================

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  animate?: boolean
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span"
}

export function GradientText({
  children,
  className,
  animate = false,
  as: Component = "span",
}: GradientTextProps) {
  const MotionComponent = motion[Component] as typeof motion.span

  if (animate) {
    return (
      <MotionComponent
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("gradient-text font-bold", className)}
      >
        {children}
      </MotionComponent>
    )
  }

  return (
    <Component className={cn("gradient-text font-bold", className)}>
      {children}
    </Component>
  )
}

// ============================================================================
// ANIMATED HEADING - Heading con animación de entrada
// ============================================================================

interface AnimatedHeadingProps {
  children: React.ReactNode
  className?: string
  delay?: number
  gradient?: boolean
  as?: "h1" | "h2" | "h3" | "h4"
}

export function AnimatedHeading({
  children,
  className,
  delay = 0,
  gradient = false,
  as: Component = "h2",
}: AnimatedHeadingProps) {
  const MotionComponent = motion[Component] as typeof motion.h2

  return (
    <MotionComponent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={cn(
        "font-display font-bold tracking-tight",
        gradient && "gradient-text",
        className
      )}
    >
      {children}
    </MotionComponent>
  )
}

// ============================================================================
// TYPING TEXT - Texto con efecto de escritura
// ============================================================================

interface TypingTextProps {
  text: string
  className?: string
  speed?: number
  delay?: number
}

export function TypingText({
  text,
  className,
  speed = 50,
  delay = 0,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = React.useState("")
  const [started, setStarted] = React.useState(false)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setStarted(true)
    }, delay * 1000)

    return () => clearTimeout(timeout)
  }, [delay])

  React.useEffect(() => {
    if (!started) return

    let i = 0
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1))
        i++
      } else {
        clearInterval(typingInterval)
      }
    }, speed)

    return () => clearInterval(typingInterval)
  }, [text, speed, started])

  return (
    <span className={className}>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="ml-0.5 inline-block h-[1em] w-[2px] bg-primary"
      />
    </span>
  )
}

// ============================================================================
// COUNTER TEXT - Número con animación de conteo
// ============================================================================

interface CounterTextProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
  duration?: number
  delay?: number
  decimals?: number
}

export function CounterText({
  value,
  className,
  prefix = "",
  suffix = "",
  duration = 2,
  delay = 0,
  decimals = 0,
}: CounterTextProps) {
  const [count, setCount] = React.useState(0)
  const [started, setStarted] = React.useState(false)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setStarted(true)
    }, delay * 1000)

    return () => clearTimeout(timeout)
  }, [delay])

  React.useEffect(() => {
    if (!started) return

    const startTime = Date.now()
    const endTime = startTime + duration * 1000

    const updateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / (duration * 1000), 1)

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      setCount(easeOutQuart * value)

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    requestAnimationFrame(updateCount)
  }, [value, duration, started])

  const formattedCount = React.useMemo(() => {
    return count.toLocaleString("es-MX", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }, [count, decimals])

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
    >
      {prefix}
      {formattedCount}
      {suffix}
    </motion.span>
  )
}

// ============================================================================
// SHIMMER TEXT - Texto con efecto shimmer
// ============================================================================

interface ShimmerTextProps {
  children: React.ReactNode
  className?: string
}

export function ShimmerText({ children, className }: ShimmerTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "linear",
        }}
      />
    </span>
  )
}
