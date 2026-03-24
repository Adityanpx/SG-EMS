'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
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
    totalEmployees: 0,
    presentToday: 0,
    pendingRequests: 0,
    tasksAssigned: 0,
  })

  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([])
  const [absentToday, setAbsentToday] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadDashboard()
  }, [profile])

  async function loadDashboard() {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { count: empCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee')

    const { count: presentCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)

    const { count: pendingCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'done')

    setStats({
      totalEmployees: empCount || 0,
      presentToday: presentCount || 0,
      pendingRequests: pendingCount || 0,
      tasksAssigned: taskCount || 0,
    })

    const { data: reqData } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    const reqUserIds = reqData?.map(r => r.user_id) || []
    let profilesMap: Record<string, any> = {}

    if (reqUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', reqUserIds)

      profilesData?.forEach(p => {
        profilesMap[p.user_id] = p
      })
    }

    const requestsWithProfile = (reqData || []).map(req => ({
      ...req,
      profile: profilesMap[req.user_id] || null,
    }))

    setRecentRequests(requestsWithProfile)

    const { data: allEmployees } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')

    const { data: todayAttendance } = await supabase
      .from('attendance_records')
      .select('user_id')
      .eq('date', today)

    const presentUserIds = new Set(
      (todayAttendance || []).map((a: { user_id: string }) => a.user_id)
    )

    const absent = (allEmployees || []).filter(
      (e: Profile) => !presentUserIds.has(e.user_id)
    )

    setAbsentToday(absent)
    setLoading(false)
  }

  const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    on_hold: 'info',
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (authLoading || loading) return <Loader />

  return (
    <div className="space-y-8">

      <PageHeader
        title={`${greeting()}, ${profile?.full_name?.split(' ')[0]} 👋`}
        subtitle={new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      {/* ✅ FIXED STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-blue-500' },
          { label: 'Present Today', value: stats.presentToday, icon: Clock, color: 'bg-green-500' },
          { label: 'Pending Requests', value: stats.pendingRequests, icon: FileText, color: 'bg-orange-500' },
          { label: 'Active Tasks', value: stats.tasksAssigned, icon: CheckCircle, color: 'bg-pink-500' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            {/* ICON */}
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>

            {/* TEXT */}
            <div className="flex flex-col">
              <p className="text-xl font-semibold text-white leading-none">
                {value}
              </p>
              <p className="text-sm text-slate-400 leading-tight">
                {label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Requests */}
        <div className="glass-card p-5">
          <div className="flex justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Requests</h2>
            <Link href="/admin/requests" className="text-xs text-brand-400">
              View all →
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No requests yet</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map(req => (
                <div key={req.id} className="flex justify-between py-2 border-b border-white/5">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                      {getInitials(req.profile?.full_name || 'U')}
                    </div>
                    <div>
                      <p className="text-sm text-white">{req.profile?.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {req.type} • {formatDate(req.from_date)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[req.status]}>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Absent */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Not Clocked In ({absentToday.length})
          </h2>

          <div className="space-y-3">
            {absentToday.map(emp => (
              <Link
                key={emp.id}
                href={`/admin/employees/${emp.user_id}`}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                  {getInitials(emp.full_name)}
                </div>
                <div>
                  <p className="text-sm text-white">{emp.full_name}</p>
                  <p className="text-xs text-slate-500">{emp.department || 'No department'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}