import { cn } from '@/lib/utils'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'

interface Props {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

const variants: Record<Variant, string> = {
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  danger:  'bg-red-500/20 text-red-300 border-red-500/30',
  info:    'bg-sky-500/20 text-sky-300 border-sky-500/30',
  neutral: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  purple:  'bg-brand-500/20 text-brand-300 border-brand-500/30',
}

export function Badge({ children, variant = 'neutral', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}