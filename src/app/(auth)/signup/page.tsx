'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, Hexagon, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { setLoginTimestamp } from '@/lib/auth'
import toast from 'react-hot-toast'

const DEPARTMENTS = [
  'Engineering', 'Design', 'Product', 'Marketing',
  'Sales', 'HR', 'Finance', 'Operations', 'Support',
]

const STEPS = ['Account', 'Profile', 'Done']

export default function SignupPage() {
  const router  = useRouter()
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name:   '',
    email:       '',
    password:    '',
    department:  '',
    designation: '',
    phone:       '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    if (step === 0) {
      if (!form.full_name.trim()) { toast.error('Enter your full name'); return }
      if (!form.email.trim())     { toast.error('Enter your email'); return }
      if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
      setStep(1)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name:   form.full_name,
          role:        'employee',
          department:  form.department,
          designation: form.designation,
          phone:       form.phone,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Note: Profile is auto-created by the database trigger 'handle_new_user'
      // No need to upsert here - the trigger handles it
      
      // Check if email confirmation is required
      if (!data.session) {
        // Email confirmation required - show message and redirect to login
        setStep(2)
        setTimeout(() => {
          toast.success('Check your email to confirm your account!')
          router.push('/login')
        }, 1500)
        setLoading(false)
        return
      }
      
      // If no confirmation needed, proceed directly
      setLoginTimestamp()
      setStep(2)
      setTimeout(() => {
        toast.success('Welcome to SG Infinity!')
        router.push('/dashboard')
        router.refresh()
      }, 1400)
    }

    setLoading(false)
  }

  const inputClass = (name: string) => `
    w-full h-11 px-4 rounded-xl text-[14px] text-white outline-none transition-all duration-200 placeholder-white/15
  `

  const inputStyle = (name: string) => ({
    background: focused === name ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${focused === name ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
    fontFamily: 'var(--font-dm-sans)',
  })

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)' }} />
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
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <Hexagon className="w-6 h-6 text-white fill-white/20" strokeWidth={1.5} />
            <div className="absolute inset-0 rounded-xl blur-xl opacity-40"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }} />
          </div>
          <h1 className="text-[20px] font-semibold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-sora)', letterSpacing: '-0.02em' }}>
            Join SG Infinity
          </h1>
          <p className="text-[12px] text-white/30 mt-1 tracking-widest uppercase"
            style={{ letterSpacing: '0.1em' }}>
            Employee Registration
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-7">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-300"
                  style={{
                    background: i < step ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                      : i === step ? 'rgba(99,102,241,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border: i <= step ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: i <= step ? '#a5b4fc' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {i < step ? <Check className="w-3 h-3 text-white" /> : i + 1}
                </div>
                <span className="text-[10px] tracking-wide"
                  style={{ color: i === step ? 'rgba(165,180,252,0.8)' : 'rgba(255,255,255,0.2)' }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-16 h-px mb-5 mx-1 transition-all duration-500"
                  style={{ background: i < step ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 relative"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
          }}>

          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(168,85,247,0.6), transparent)' }} />

          <AnimatePresence mode="wait">

            {/* STEP 0 — Account details */}
            {step === 0 && (
              <motion.form
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={nextStep}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-[17px] font-medium text-white mb-0.5" style={{ letterSpacing: '-0.01em' }}>
                    Create your account
                  </h2>
                  <p className="text-[13px] text-white/35 mb-6">Start with your basic credentials</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white/45 uppercase tracking-widest mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => update('full_name', e.target.value)}
                    onFocus={() => setFocused('full_name')}
                    onBlur={() => setFocused(null)}
                    placeholder="Arjun Sharma"
                    required
                    className={inputClass('full_name')}
                    style={inputStyle('full_name')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white/45 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="arjun@company.com"
                    required
                    className={inputClass('email')}
                    style={inputStyle('email')}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white/45 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className={inputClass('password')}
                    style={{
                      ...inputStyle('password'),
                      letterSpacing: form.password ? '0.12em' : 'normal',
                    }}
                  />
                  {/* Password strength */}
                  {form.password.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
                          style={{
                            background: form.password.length >= i * 3
                              ? i <= 1 ? '#f43f5e' : i <= 2 ? '#f59e0b' : i <= 3 ? '#6366f1' : '#10b981'
                              : 'rgba(255,255,255,0.06)'
                          }} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full h-11 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      boxShadow: '0 0 30px rgba(99,102,241,0.25)',
                    }}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* STEP 1 — Profile info */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-[17px] font-medium text-white mb-0.5" style={{ letterSpacing: '-0.01em' }}>
                    Your work profile
                  </h2>
                  <p className="text-[13px] text-white/35 mb-6">Help your team find you</p>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[11px] font-medium text-white/45 uppercase tracking-widest mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      value={form.department}
                      onChange={(e) => update('department', e.target.value)}
                      onFocus={() => setFocused('department')}
                      onBlur={() => setFocused(null)}
                      required
                      className="w-full h-11 px-4 pr-9 rounded-xl text-[14px] text-white outline-none appearance-none transition-all duration-200"
                      style={{
                        ...inputStyle('department'),
                        color: form.department ? 'white' : 'rgba(255,255,255,0.15)',
                      }}
                    >
                      <option value="" className="bg-[#1a1a2e]">Select department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d} className="bg-[#1a1a2e] text-white">{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-[11px] font-medium text-white/45 uppercase tracking-widest mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => update('designation', e.target.value)}
                    onFocus={() => setFocused('designation')}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. Frontend Developer"
                    className={inputClass('designation')}
                    style={inputStyle('designation')}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-medium text-white/45 uppercase tracking-widest mb-2">
                    Phone <span className="normal-case font-normal text-white/25">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    onFocus={() => setFocused('phone')}
                    onBlur={() => setFocused(null)}
                    placeholder="+91 98765 43210"
                    className={inputClass('phone')}
                    style={inputStyle('phone')}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="h-11 px-5 rounded-xl text-[14px] font-medium text-white/50 hover:text-white/80 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2"
                    style={{
                      background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                      boxShadow: loading ? 'none' : '0 0 30px rgba(99,102,241,0.25)',
                    }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* STEP 2 — Success */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
                </motion.div>
                <h2 className="text-[18px] font-semibold text-white mb-2" style={{ letterSpacing: '-0.01em' }}>
                  You're in!
                </h2>
                <p className="text-[13px] text-white/40">
                  Welcome to SG Infinity, {form.full_name.split(' ')[0]}.<br />
                  Redirecting to your dashboard...
                </p>
                <div className="mt-5 flex justify-center">
                  <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.3, ease: 'linear' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {step < 2 && (
            <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
              <p className="text-[13px] text-white/35">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}