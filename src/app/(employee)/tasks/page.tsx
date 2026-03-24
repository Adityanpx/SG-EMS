'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Calendar, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Loader } from '@/components/ui/Loader'
import { Task, TaskStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_OPTIONS: TaskStatus[] = ['assigned', 'working', 'pending', 'done']

const STATUS_VARIANT: Record<TaskStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  assigned: 'neutral',
  working:  'info',
  pending:  'warning',
  done:     'success',
}

const PRIORITY_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  low:    'success',
  medium: 'warning',
  high:   'danger',
}

const FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Working',  value: 'working' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Done',     value: 'done' },
]

export default function TasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks]       = useState<Task[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<TaskStatus | 'all'>('all')

  useEffect(() => {
    if (!profile) return
    loadTasks()
  }, [profile])

  async function loadTasks() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .or(`assigned_to.eq.${profile!.user_id},assigned_to.is.null`)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    if (error) {
      toast.error('Could not update task status')
      return
    }
    toast.success('Task status updated')
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle="Tasks assigned to you by admin"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === value
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                : 'bg-white/3 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            {label}
            {value !== 'all' && (
              <span className="ml-1.5 text-slate-500">
                ({tasks.filter(t => t.status === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-white text-sm">{task.title}</p>
                    <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                    {!task.assigned_to && (
                      <Badge variant="purple">All Employees</Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      Due: {formatDate(task.due_date)}
                      {new Date(task.due_date) < new Date() && task.status !== 'done' && (
                        <span className="flex items-center gap-0.5 text-red-400 ml-1">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status updater */}
                <div className="shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-slate-900">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}