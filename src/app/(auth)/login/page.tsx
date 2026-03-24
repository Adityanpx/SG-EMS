'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Hexagon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { setLoginTimestamp } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      setLoginTimestamp()

      if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        const { data: notifs } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('is_read', false)

        if (notifs && notifs.length > 0) {
          toast.success(`${notifs.length} new notification${notifs.length > 1 ? 's' : ''} waiting!`)
        }

        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-5"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <Hexagon className="w-7 h-7 text-white fill-white/20" strokeWidth={1.5} />
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-[22px] font-semibold tracking-tight text-white mb-1"
              style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
              SG Infinity
            </h1>
            <p className="text-[13px] text-white/35 tracking-wide uppercase"
              style={{ letterSpacing: '0.12em' }}>
              Employee Management
            </p>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="rounded-2xl p-8 relative"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* RGB border top accent */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(168,85,247,0.6), transparent)' }} />

          <h2 className="text-[18px] font-medium text-white mb-1"
            style={{ letterSpacing: '-0.01em' }}>
            Welcome back
          </h2>
          <p className="text-[13px] text-white/40 mb-7">
            Sign in to your workspace
          </p>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email field */}
            <div>
              <label className="block text-[12px] font-medium text-white/50 uppercase tracking-widest mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="w-full h-11 px-4 rounded-xl text-[14px] text-white outline-none transition-all duration-200 placeholder-white/15"
                  style={{
                    background: focused === 'email' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${focused === 'email' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[12px] font-medium text-white/50 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl text-[14px] text-white outline-none transition-all duration-200 placeholder-white/15"
                  style={{
                    background: focused === 'password' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${focused === 'password' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: password && !showPass ? '0.15em' : 'normal',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  <AnimatePresence mode="wait">
                    {showPass
                      ? <motion.div key="off" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><EyeOff className="w-4 h-4" /></motion.div>
                      : <motion.div key="on"  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><Eye className="w-4 h-4" /></motion.div>
                    }
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl text-[14px] font-semibold text-white relative overflow-hidden flex items-center justify-center gap-2 transition-all"
                style={{
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                  boxShadow: loading ? 'none' : '0 0 30px rgba(99,102,241,0.3)',
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-[13px] text-white/35">
              New employee?{' '}
              <Link href="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[11px] text-white/20 mt-6"
        >
          Secured by SG Infinity · Internal Use Only
        </motion.p>
      </motion.div>
    </div>
  )
}