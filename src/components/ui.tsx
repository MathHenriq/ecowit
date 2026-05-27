/**
 * Componentes UI base do Eco-Growth System.
 * Pill buttons, cards squishy, chips, progress bars — todos com depth border 4px.
 */
import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from 'react'

/* ─── Button ────────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  full?: boolean
}

export function Button({ variant = 'primary', icon, full, children, className = '', ...rest }: ButtonProps) {
  const base = 'btn-squish'
  const variantClass =
    variant === 'primary' ? 'btn-primary'
    : variant === 'outline' ? 'btn-outline'
    : 'bg-transparent text-[var(--color-ink)] uppercase font-bold'
  return (
    <button className={`${base} ${variantClass} ${full ? 'w-full' : ''} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

/* ─── Card ──────────────────────────────────────────────────── */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ padding = 'md', className = '', children, ...rest }: CardProps) {
  const pad = padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4'
  return (
    <div className={`card-squish ${pad} ${className}`} {...rest}>
      {children}
    </div>
  )
}

/* ─── Chip ──────────────────────────────────────────────────── */
type ChipTone = 'leaf' | 'sun' | 'sky' | 'earth' | 'neutral' | 'danger'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone
  icon?: ReactNode
}

export function Chip({ tone = 'leaf', icon, children, className = '', ...rest }: ChipProps) {
  const tones: Record<ChipTone, string> = {
    leaf:    'bg-[var(--color-leaf-50)] text-[var(--color-leaf-700)]',
    sun:     'bg-[var(--color-sun-100)] text-[var(--color-sun-700)]',
    sky:     'bg-[var(--color-sky-100)] text-[var(--color-sky-700)]',
    earth:   'bg-[var(--color-earth-100)] text-[var(--color-earth-700)]',
    neutral: 'bg-gray-100 text-gray-700',
    danger:  'bg-red-100 text-red-700',
  }
  return (
    <span className={`chip ${tones[tone]} ${className}`} {...rest}>
      {icon}
      {children}
    </span>
  )
}

/* ─── Growth Bar (progress) ─────────────────────────────────── */
interface GrowthBarProps {
  value: number  // 0-100
  label?: string
  height?: number
}

export function GrowthBar({ value, label, height = 14 }: GrowthBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className="relative w-full bg-[var(--color-leaf-50)] rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-[var(--color-leaf-500)] rounded-full transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        >
          {/* Shine overlay */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
