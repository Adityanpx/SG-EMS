'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { AttendanceRecord } from '@/types'
import { formatTime } from '@/lib/utils'

const MODE_LABELS: Record<string, string> = {
  work_from_office: '🏢 Office',
  work_from_home:   '🏠 WFH',
  field_work:       '🚗 Field',
  half_day:         '⏰ Half Day',
  on_leave:         '🌴 Leave',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  clocked_out: 'success',
  clocked_in:  'warning',
  absent:      'danger',
}

export default function AttendancePage() {
  const { profile, loading: authLoading } = useAuth()
  const [records, setRecords]   = useState<AttendanceRecord[]>([])
  const [loading, setLoading]   = useState(true)
  const [month, setMonth]       = useState(new Date())

  useEffect(() => {
    if (!profile) return
    loadRecords()
  }, [profile, month])

  async function loadRecords() {
    setLoading(true)
    const supabase = createClient()

    const start = new Date(month.getFullYear(), month.getMonth(), 1)
      .toISOString().split('T')[0]
    const end   = new Date(month.getFullYear(), month.getMonth() + 1, 0)
      .toISOString().split('T')[0]

    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', profile!.user_id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    setRecords(data || [])
    setLoading(false)
  }

  function prevMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }
  function nextMonth() {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    if (next <= new Date()) setMonth(next)
  }

  const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const totalDays     = records.length
  const presentDays   = records.filter(r => r.status !== 'absent').length
  const wfhDays       = records.filter(r => r.mode === 'work_from_home').length

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="My Attendance"
        subtitle="View your attendance history month by month"
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Logged', value: totalDays,   color: 'text-brand-400' },
          { label: 'Present',      value: presentDays, color: 'text-emerald-400' },
          { label: 'WFH Days',     value: wfhDays,     color: 'text-sky-400' },
        ].map(({ label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 text-center"
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Month navigator + table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        {/* Month nav */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-400" />
            <span className="font-semibold text-white">{monthLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              disabled={new Date(month.getFullYear(), month.getMonth() + 1, 1) > new Date()}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-center text-slate-500 py-16 text-sm">No attendance records for this month</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Mode</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Clock In</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Clock Out</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Summary</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-3 text-slate-300 font-medium">
                      {new Date(rec.date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: '2-digit', month: 'short'
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {MODE_LABELS[rec.mode] || rec.mode}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.clock_in_time ? formatTime(rec.clock_in_time) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {rec.clock_out_time ? formatTime(rec.clock_out_time) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_VARIANT[rec.status] || 'neutral'}>
                        {rec.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {rec.clock_out_summary && rec.clock_out_summary.length > 0 ? (
                        <div className="space-y-0.5">
                          {rec.clock_out_summary.slice(0, 2).map((t, j) => (
                            <p key={j} className="text-xs text-slate-500 truncate max-w-[180px]">
                              • {t.task}{' '}
                              <span className={`font-medium ${
                                t.status === 'done' ? 'text-emerald-400' :
                                t.status === 'working' ? 'text-sky-400' : 'text-amber-400'
                              }`}>({t.status})</span>
                            </p>
                          ))}
                          {rec.clock_out_summary.length > 2 && (
                            <p className="text-xs text-slate-600">+{rec.clock_out_summary.length - 2} more</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}