import { motion } from 'framer-motion'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm:  'w-4 h-4',
  md:  'w-8 h-8',
  lg: 'w-12 h-12',
}

export function Loader({ size = 'md', className = '' }: Props) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizes[size]} border-2 border-brand-500/30 border-t-brand-500 rounded-full`}
      />
    </div>
  )
}

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader size="lg" />
      <p className="mt-4 text-slate-400 text-sm">{message}</p>
    </div>
  )
}