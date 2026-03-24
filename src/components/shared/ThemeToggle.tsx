'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-12 h-12 rounded-full flex items-center justify-center
        transition-all duration-300
        ${isDark 
          ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
          : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
        }
        border-2 shadow-lg
        ${isDark ? 'border-slate-600' : 'border-indigo-200'}
      `}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDark ? 0 : 180,
          scale: isDark ? 1 : 0.8
        }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </motion.div>
      
      {/* Glow effect */}
      {!isDark && (
        <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-pulse" />
      )}
    </motion.button>
  )
}
