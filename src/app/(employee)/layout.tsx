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
import { Loader } from '@/components/ui/Loader'
import { getInitials } from '@/lib/utils'

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

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/dashboard')
    }
  }, [loading, isAdmin, router])

  if (loading) return <Loader />
  if (!profile) return null

  return (
    <div className="flex h-screen bg-[#0f0f1a] overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
          bg-[#13131f] border-r border-white/5 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center shadow-glow-brand">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">SG Infinity</p>
              <p className="text-xs text-slate-500">Employee Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${active
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Profile + Sign out */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-xs font-bold text-white">
              {getInitials(profile.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{profile.designation || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 border-b border-white/5 bg-[#13131f]/50 backdrop-blur-sm flex items-center justify-between px-6">
          <button
            className="lg:hidden p-2 rounded-lg bg-white/5 text-slate-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 lg:flex-none">
            <p className="text-sm text-slate-400 lg:hidden text-right">
              {NAV.find(n => n.href === pathname)?.label}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell userId={profile.user_id} />
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-white">{profile.full_name}</p>
              <p className="text-xs text-slate-500">{profile.department}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
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