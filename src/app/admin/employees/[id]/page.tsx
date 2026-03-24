'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, CalendarCheck, ClipboardList, FileText, Phone, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { Profile, AttendanceRecord, Task, LeaveRequest } from '@/types'
import { formatDate, formatTime, getInitials } from '@/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Tab = 'attendance' | 'tasks' | 'requests'

const STATUS_VARIANT_REQ: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
  pending:  'warning',
  approved: 'success',
  rejected: 'danger',
  on_hold:  'info',
}
const STATUS_VARIANT_ATT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  clocked_out: 'success',
  clocked_in:  'warning',
  absent:      'danger',
}
const STATUS_VARIANT_TASK: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  assigned: 'neutral',
  working:  'info',
  pending:  'warning',
  done:     'success',
}

export default function EmployeeDetailPage() {
  const { id } = useParams() as { id: string }
  const { loading: authLoading } = useAuth()

  const [employee, setEmployee]   = useState<Profile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [tasks, setTasks]         = useState<Task[]>([])
  const [requests, setRequests]   = useState<LeaveRequest[]>([])
  const [tab, setTab]             = useState<Tab>('attendance')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (id) loadEmployee()
  }, [id])

  async function loadEmployee() {
    const supabase = createClient()

    const { data: emp } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single()
    setEmployee(emp)

    const [attRes, taskRes, reqRes] = await Promise.all([
      supabase.from('attendance_records').select('*').eq('user_id', id).order('date', { ascending: false }).limit(30),
      supabase.from('tasks').select('*').or(`assigned_to.eq.${id},assigned_to.is.null`).order('created_at', { ascending: false }),
      supabase.from('leave_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    ])

    setAttendance(attRes.data || [])
    setTasks(taskRes.data || [])
    setRequests(reqRes.data || [])
    setLoading(false)
  }

  if (authLoading || loading) return <Loader />
  if (!employee) return <div className="text-center py-20 text-slate-500">Employee not found</div>

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'tasks',      label: 'Tasks',      icon: ClipboardList },
    { id: 'requests',   label: 'Requests',   icon: FileText },
  ]

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/employees" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Link>

        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-xl font-bold text-white shadow-glow-brand shrink-0">
            {getInitials(employee.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{employee.full_name}</h2>
            <p className="text-sm text-slate-400">{employee.designation || 'Employee'} · {employee.department || 'No department'}</p>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3.5 h-3.5" /> {employee.email}
              </span>
              {employee.phone && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5" /> {employee.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="w-3.5 h-3.5" /> Joined {formatDate(employee.joined_at)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === tabId
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="glass-card overflow-hidden"
      >
        {/* Attendance tab */}
        {tab === 'attendance' && (
          attendance.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">No attendance records</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Date', 'Mode', 'Clock In', 'Clock Out', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(rec => (
                    <tr key={rec.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="px-5 py-3 text-slate-300 text-xs">
                        {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs capitalize">{rec.mode.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{rec.clock_in_time ? formatTime(rec.clock_in_time) : '—'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{rec.clock_out_time ? formatTime(rec.clock_out_time) : '—'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_VARIANT_ATT[rec.status] || 'neutral'}>{rec.status.replace('_', ' ')}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tasks tab */}
        {tab === 'tasks' && (
          tasks.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">No tasks assigned</p>
          ) : (
            <div className="divide-y divide-white/5">
              {tasks.map(task => (
                <div key={task.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    {task.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>}
                    {task.due_date && <p className="text-xs text-slate-600 mt-1">Due: {formatDate(task.due_date)}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={STATUS_VARIANT_TASK[task.status]}>{task.status}</Badge>
                    <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Requests tab */}
        {tab === 'requests' && (
          requests.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-sm">No requests submitted</p>
          ) : (
            <div className="divide-y divide-white/5">
              {requests.map(req => (
                <div key={req.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{req.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">{formatDate(req.from_date)} — {formatDate(req.to_date)}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{req.reason}</p>
                    {req.admin_note && (
                      <p className="text-xs text-amber-300 mt-1">Note: {req.admin_note}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT_REQ[req.status]}>{req.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )
        )}
      </motion.div>
    </div>
  )
}