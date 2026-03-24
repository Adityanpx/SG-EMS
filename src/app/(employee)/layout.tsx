'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CalendarCheck, ClipboardList,
  FileText, Users, LogOut, Building2, Menu, X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Loader } from '@/components/ui/Loader'
import { getInitials } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/attendance', label: 'Attendance',  icon: CalendarCheck },
  { href: '/tasks',      label: 'My Tasks',    icon: ClipboardList },
  { href: '/requests',   label: 'My Requests', icon: FileText },
  { href: '/team',       label: 'My Team',     icon: Users },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDark } = useTheme()

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/dashboard')
    }
  }, [loading, isAdmin, router])

  if (loading) return <Loader />
  if (!profile) return null

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0f0f1a]' : 'bg-gray-50'
    }`}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transform transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isDark 
            ? 'bg-[#13131f] border-r border-white/5' 
            : 'bg-white border-r border-gray-200 shadow-xl'
          }`}
      >
        {/* Logo */}
        <div className={`p-6 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              isDark 
                ? 'bg-gradient-to-br from-brand-500 to-accent-purple' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-500'
            }`}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SG Infinity</p>
              <p className={`text-xs ${isDark ? 'text-brand-300' : 'text-indigo-600'}`}>Employee Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group
                  ${active
                    ? isDark 
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-lg shadow-brand-500/10'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-md'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/10'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <Icon className={`w-5 h-5 ${active 
                  ? isDark ? 'text-brand-400' : 'text-indigo-600' 
                  : isDark ? 'text-slate-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-700'
                }`} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Profile + Sign out */}
        <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-3 px-3 py-3 mb-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
              isDark 
                ? 'bg-gradient-to-br from-brand-500 to-accent-purple' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-500'
            }`}>
              {getInitials(profile.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile.full_name}</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{profile.designation || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${isDark 
                ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' 
                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className={`h-16 flex items-center justify-between px-6 transition-colors duration-300 border-b
          ${isDark 
            ? 'border-white/5 bg-[#13131f]/50 backdrop-blur-sm' 
            : 'border-gray-200 bg-white/80 backdrop-blur-sm'
          }`}>
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 lg:flex-none">
            <p className={`text-sm lg:hidden text-right ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {NAV.find(n => n.href === pathname)?.label}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell userId={profile.user_id} />
            <div className="hidden lg:block">
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile.full_name}</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{profile.department}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-300 ${
          isDark ? 'bg-[#0f0f1a]' : 'bg-gray-50'
        }`}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}