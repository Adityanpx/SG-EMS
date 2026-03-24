'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Users, Megaphone,
  CalendarX, Briefcase, ClipboardCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AttendanceRecord, Task, Profile, Announcement, LeaveRequest } from '@/types'
import { formatTime, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const ATTENDANCE_MODES = [
  { value: 'work_from_office', label: 'Work from Office', icon: '🏢' },
  { value: 'work_from_home',   label: 'Work from Home',   icon: '🏠' },
  { value: 'field_work',       label: 'Field Work',       icon: '🚗' },
  { value: 'half_day',         label: 'Half Day',         icon: '⏰' },
]

const TASK_STATUS_COLORS: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  done:     'success',
  working:  'info',
  pending:  'warning',
  assigned: 'neutral',
}

export default function EmployeeDashboard() {
  const { profile } = useAuth()
  const [attendance, setAttendance]       = useState<AttendanceRecord | null>(null)
  const [tasks, setTasks]                 = useState<Task[]>([])
  const [teamMembers, setTeamMembers]     = useState<Profile[]>([])
  const [onLeaveToday, setOnLeaveToday]   = useState<Profile[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showClockIn, setShowClockIn]     = useState(false)
  const [showClockOut, setShowClockOut]   = useState(false)
  const [selectedMode, setSelectedMode]   = useState('work_from_office')
  const [clockOutTasks, setClockOutTasks] = useState<{ task: string; status: 'done' | 'working' | 'pending' }[]>([
    { task: '', status: 'done' }
  ])

  useEffect(() => {
    if (!profile) return
    loadDashboardData()
  }, [profile])

  async function loadDashboardData() {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Today's attendance
    const { data: att } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', profile!.user_id)
      .eq('date', today)
      .single()
    setAttendance(att)

    // Today's tasks (assigned to me or all)
    const { data: myTasks } = await supabase
      .from('tasks')
      .select('*')
      .or(`assigned_to.eq.${profile!.user_id},assigned_to.is.null`)
      .order('created_at', { ascending: false })
      .limit(5)
    setTasks(myTasks || [])

    // A few team members (max 6 to show social presence)
    const { data: team } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .neq('user_id', profile!.user_id)
      .limit(6)
    setTeamMembers(team || [])

    // Who's on leave today
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .lte('from_date', today)
      .gte('to_date', today)
    
    // Get profile info for users on leave
    const leaveUserIds = leaves?.map(l => l.user_id) || []
    let profilesMap: Record<string, any> = {}
    
    if (leaveUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', leaveUserIds)
      
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap[p.user_id] = p
        })
      }
    }
    
    const onLeaveProfiles = (leaves || [])
      .map(l => profilesMap[l.user_id])
      .filter(Boolean)
    setOnLeaveToday(onLeaveProfiles)

    // Active announcements
    const { data: ann } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)
    setAnnouncements(ann || [])
  }

  async function handleClockIn() {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('attendance_records').insert({
      user_id:       profile!.user_id,
      date:          today,
      mode:          selectedMode,
      status:        'clocked_in',
      clock_in_time: new Date().toISOString(),
    })

    if (error) {
      toast.error('Could not mark attendance: ' + error.message)
      return
    }

    toast.success('Attendance marked! Have a great day 🚀')
    setShowClockIn(false)
    loadDashboardData()
  }

  async function handleClockOut() {
    const validTasks = clockOutTasks.filter((t) => t.task.trim())
    if (validTasks.length === 0) {
      toast.error('Please add at least one task summary')
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('attendance_records')
      .update({
        status:             'clocked_out',
        clock_out_time:     new Date().toISOString(),
        clock_out_summary:  validTasks,
      })
      .eq('user_id', profile!.user_id)
      .eq('date', new Date().toISOString().split('T')[0])

    if (error) {
      toast.error('Could not clock out')
      return
    }

    toast.success('Clocked out! Great work today 👏')
    setShowClockOut(false)
    loadDashboardData()
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${profile?.full_name?.split(' ')[0] ?? ''} 👋`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* Announcements banner */}
      {announcements.map((ann) => (
        <motion.div
          key={ann.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-start gap-3"
        >
          <Megaphone className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-300">{ann.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{ann.message}</p>
          </div>
        </motion.div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-5">

          {/* Attendance card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-400" />
                <h2 className="font-semibold text-white">Today's Attendance</h2>
              </div>
              {attendance && (
                <Badge variant={attendance.status === 'clocked_out' ? 'success' : 'info'}>
                  {attendance.status === 'clocked_in' ? 'Clocked In' : attendance.status === 'clocked_out' ? 'Clocked Out' : 'Absent'}
                </Badge>
              )}
            </div>

            {!attendance ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-4">You haven't marked attendance today</p>
                <button
                  onClick={() => setShowClockIn(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white text-sm font-semibold hover:shadow-glow-brand transition-all"
                >
                  Mark Attendance
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Mode</p>
                  <p className="text-sm font-medium text-white capitalize">
                    {attendance.mode.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Clock In</p>
                  <p className="text-sm font-medium text-white">
                    {attendance.clock_in_time ? formatTime(attendance.clock_in_time) : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Clock Out</p>
                  <p className="text-sm font-medium text-white">
                    {attendance.clock_out_time ? formatTime(attendance.clock_out_time) : '—'}
                  </p>
                </div>
                {attendance.status === 'clocked_in' && (
                  <button
                    onClick={() => setShowClockOut(true)}
                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 transition-all"
                  >
                    Clock Out
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white">Today's Tasks</h2>
              <span className="ml-auto text-xs text-slate-500">{tasks.length} tasks</span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No tasks assigned yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-slate-500 mt-0.5">Due: {task.due_date}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>
                        {task.priority}
                      </Badge>
                      <Badge variant={TASK_STATUS_COLORS[task.status]}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">

          {/* On Leave Today */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <CalendarX className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-white text-sm">On Leave Today</h2>
            </div>

            {onLeaveToday.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">Everyone's in today 🎉</p>
            ) : (
              <div className="space-y-2">
                {onLeaveToday.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                      {getInitials(p.full_name)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{p.full_name}</p>
                      <p className="text-xs text-slate-500">{p.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Team Widget */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white text-sm">Your Team</h2>
            </div>

            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-xs font-bold text-white">
                      {getInitials(member.full_name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#13131f]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{member.full_name}</p>
                    <p className="text-xs text-slate-500">{member.designation || member.department}</p>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-2">No teammates yet</p>
              )}
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-brand-400" />
              <h2 className="font-semibold text-white text-sm">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Apply for Leave', href: '/requests' },
                { label: 'Request WFH', href: '/requests' },
                { label: 'View All Tasks', href: '/tasks' },
                { label: 'View Attendance', href: '/attendance' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="block px-3 py-2 rounded-lg bg-white/3 border border-white/5 text-xs text-slate-300 hover:text-white hover:border-brand-500/30 hover:bg-brand-500/10 transition-all"
                >
                  {label} →
                </a>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Clock In Modal */}
      <Modal open={showClockIn} onClose={() => setShowClockIn(false)} title="Mark Attendance">
        <p className="text-sm text-slate-400 mb-4">How are you working today?</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ATTENDANCE_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSelectedMode(mode.value)}
              className={`p-3 rounded-xl border text-sm font-medium transition-all text-left
                ${selectedMode === mode.value
                  ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                  : 'border-white/10 bg-white/3 text-slate-400 hover:border-white/20'
                }`}
            >
              <span className="block text-lg mb-1">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleClockIn}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white font-semibold text-sm hover:shadow-glow-brand transition-all"
        >
          Confirm Clock In
        </button>
      </Modal>

      {/* Clock Out Modal */}
      <Modal open={showClockOut} onClose={() => setShowClockOut(false)} title="Clock Out Summary" size="lg">
        <p className="text-sm text-slate-400 mb-4">What did you accomplish today? Add your tasks below.</p>

        <div className="space-y-3 mb-4">
          {clockOutTasks.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={item.task}
                onChange={(e) => {
                  const updated = [...clockOutTasks]
                  updated[idx].task = e.target.value
                  setClockOutTasks(updated)
                }}
                placeholder={`Task ${idx + 1}...`}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all"
              />
              <select
                value={item.status}
                onChange={(e) => {
                  const updated = [...clockOutTasks]
                  updated[idx].status = e.target.value as 'done' | 'working' | 'pending'
                  setClockOutTasks(updated)
                }}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="done"    className="bg-slate-900">✅ Done</option>
                <option value="working" className="bg-slate-900">🔄 Working</option>
                <option value="pending" className="bg-slate-900">⏳ Pending</option>
              </select>
              {clockOutTasks.length > 1 && (
                <button
                  onClick={() => setClockOutTasks(clockOutTasks.filter((_, i) => i !== idx))}
                  className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setClockOutTasks([...clockOutTasks, { task: '', status: 'done' }])}
          className="w-full py-2 rounded-xl border border-dashed border-white/20 text-slate-400 text-sm hover:border-brand-500/40 hover:text-brand-400 transition-all mb-5"
        >
          + Add another task
        </button>

        <button
          onClick={handleClockOut}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold text-sm hover:shadow-lg transition-all"
        >
          Submit & Clock Out
        </button>
      </Modal>
    </div>
  )
}