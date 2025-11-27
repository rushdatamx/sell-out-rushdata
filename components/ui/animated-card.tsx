"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

// ============================================================================
// ANIMATED CARD - Card con animación de entrada
// ============================================================================

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  delay?: number
  duration?: number
  className?: string
  children: React.ReactNode
  hover?: boolean
  glass?: boolean
}

export function AnimatedCard({
  delay = 0,
  duration = 0.5,
  className,
  children,
  hover = true,
  glass = false,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        hover && "transition-shadow duration-200 hover:shadow-card-hover",
        glass && "glass-card",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================================================
// STAGGER CONTAINER - Para animar listas de cards
// ============================================================================

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================================================
// STAGGER ITEM - Elemento hijo para StaggerContainer
// ============================================================================

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.4, 0.25, 1],
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================================================
// SPOTLIGHT CARD - Card con efecto spotlight en hover
// ============================================================================

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const divRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = React.useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0, 102, 255, 0.1), transparent 40%)`,
        }}
      />
      {children}
    </motion.div>
  )
}

// ============================================================================
// GLASS CARD - Card con efecto glassmorphism
// ============================================================================

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  blur?: "sm" | "md" | "lg"
}

export function GlassCard({
  children,
  className,
  blur = "md",
  ...props
}: GlassCardProps) {
  const blurValues = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border border-white/20 bg-white/80 dark:bg-slate-900/80 shadow-glass",
        blurValues[blur],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================================================
// KPI CARD - Card especializada para métricas
// ============================================================================

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  delay?: number
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  delay = 0,
  className,
}: KPICardProps) {
  return (
    <AnimatedCard delay={delay} className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
            className="text-2xl font-bold tracking-tight"
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </motion.div>
          )}
        </div>
        {icon && (
          <motion.div
            initial={{ opacity: 0, rotate: -20 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: delay + 0.1, duration: 0.4 }}
            className="rounded-lg bg-primary/10 p-3 text-primary"
          >
            {icon}
          </motion.div>
        )}
      </div>
    </AnimatedCard>
  )
}
