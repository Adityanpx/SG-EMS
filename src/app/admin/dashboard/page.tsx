'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, FileText, CheckCircle, AlertTriangle, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { LeaveRequest, Profile } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import Link from 'next/link'

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth()

  const [stats, setStats] = useState({
    totalEmployees:  0,
    presentToday:    0,
    pendingRequests: 0,
    tasksAssigned:   0,
  })
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([])
  const [absentToday, setAbsentToday]       = useState<Profile[]>([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    if (!profile) return
    loadDashboard()
  }, [profile])

  async function loadDashboard() {
    const supabase = createClient()
    const today    = new Date().toISOString().split('T')[0]

    // Total employees
    const { count: empCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee')

    // Present today
    const { count: presentCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)

    // Pending requests
    const { count: pendingCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Tasks assigned
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'done')

    setStats({
      totalEmployees:  empCount || 0,
      presentToday:    presentCount || 0,
      pendingRequests: pendingCount || 0,
      tasksAssigned:   taskCount || 0,
    })

    // Recent requests (last 5)
    const { data: reqData } = await supabase
      .from('leave_requests')
      .select('*, profile:profiles!leave_requests_user_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentRequests(reqData || [])

    // Who hasn't clocked in today (employees with no attendance record today)
    const { data: allEmployees } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')

    const { data: todayAttendance } = await supabase
      .from('attendance_records')
      .select('user_id')
      .eq('date', today)

    const presentUserIds = new Set((todayAttendance || []).map((a: { user_id: string }) => a.user_id))
    const absent = (allEmployees || []).filter((e: Profile) => !presentUserIds.has(e.user_id))
    setAbsentToday(absent)

    setLoading(false)
  }

  const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
    pending:  'warning',
    approved: 'success',
    rejected: 'danger',
    on_hold:  'info',
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (authLoading || loading) return <Loader />

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${profile?.full_name?.split(' ')[0]} 👋`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees',   value: stats.totalEmployees,  icon: Users,       color: 'from-brand-500 to-brand-600',     glow: 'shadow-glow-brand' },
          { label: 'Present Today',     value: stats.presentToday,    icon: Clock,       color: 'from-emerald-500 to-teal-600',    glow: '' },
          { label: 'Pending Requests',  value: stats.pendingRequests, icon: FileText,    color: 'from-amber-500 to-orange-600',    glow: '' },
          { label: 'Active Tasks',      value: stats.tasksAssigned,   icon: CheckCircle, color: 'from-rose-500 to-brand-600',      glow: 'shadow-glow-purple' },
        ].map(({ label, value, icon: Icon, color, glow }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-5"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 ${glow}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent requests */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-400" />
              <h2 className="font-semibold text-white text-sm">Recent Requests</h2>
            </div>
            <Link href="/admin/requests" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {getInitials(req.profile?.full_name || 'U')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{req.profile?.full_name}</p>
                      <p className="text-xs text-slate-500">{req.type.replace('_', ' ')} · {formatDate(req.from_date)}</p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[req.status]}>{req.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Not clocked in today */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-white text-sm">
              Not Clocked In Today
              {absentToday.length > 0 && (
                <span className="ml-1.5 text-xs text-amber-400">({absentToday.length})</span>
              )}
            </h2>
          </div>

          {absentToday.length === 0 ? (
            <p className="text-xs text-emerald-400 text-center py-6">🎉 Everyone is clocked in today!</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {absentToday.map(emp => (
                <Link
                  href={`/admin/employees/${emp.user_id}`}
                  key={emp.id}
                  className="flex items-center gap-2 py-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {getInitials(emp.full_name)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{emp.full_name}</p>
                    <p className="text-xs text-slate-500">{emp.department || 'No department'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}