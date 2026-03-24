'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, PlusCircle, Calendar, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Loader } from '@/components/ui/Loader'
import { Task, Profile, TaskPriority } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high']
const PRIORITY_VARIANT: Record<TaskPriority, 'success' | 'warning' | 'danger'> = {
  low:    'success',
  medium: 'warning',
  high:   'danger',
}
const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  assigned: 'neutral',
  working:  'info',
  pending:  'warning',
  done:     'success',
}

export default function AdminTasksPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks]         = useState<Task[]>([])
  const [employees, setEmployees] = useState<Profile[]>([])
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [form, setForm] = useState({
    title:       '',
    description: '',
    due_date:    '',
    priority:    'medium' as TaskPriority,
    assigned_to: 'all',  // 'all' or a user_id
  })

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    const supabase = createClient()
    const [taskRes, empRes] = await Promise.all([
      supabase.from('tasks').select('*, profile:profiles!tasks_assigned_to_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'employee').order('full_name'),
    ])
    setTasks(taskRes.data || [])
    setEmployees(empRes.data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()

    const payload = {
      assigned_to:  form.assigned_to === 'all' ? null : form.assigned_to,
      assigned_by:  profile!.user_id,
      title:        form.title,
      description:  form.description || null,
      due_date:     form.due_date || null,
      priority:     form.priority,
      status:       'assigned',
    }

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single()

    if (error) {
      toast.error('Could not create task')
      setSubmitting(false)
      return
    }

    // Send notifications
    if (form.assigned_to === 'all') {
      // Notify all employees
      const notifs = employees.map(emp => ({
        user_id:    emp.user_id,
        title:      'New Task Assigned 📋',
        message:    `You have a new task: "${form.title}"${form.due_date ? ` (Due: ${formatDate(form.due_date)})` : ''}`,
        type:       'task_assigned' as const,
        related_id: newTask.id,
      }))
      await supabase.from('notifications').insert(notifs)
    } else {
      await supabase.from('notifications').insert({
        user_id:    form.assigned_to,
        title:      'New Task Assigned 📋',
        message:    `You have a new task: "${form.title}"${form.due_date ? ` (Due: ${formatDate(form.due_date)})` : ''}`,
        type:       'task_assigned',
        related_id: newTask.id,
      })
    }

    toast.success('Task created and assigned!')
    setShowModal(false)
    setForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: 'all' })
    loadData()
    setSubmitting(false)
  }

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Assign and manage employee tasks"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white text-sm font-medium hover:shadow-glow-brand transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Assign Task
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-white text-sm">{task.title}</p>
                    <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                    <Badge variant={STATUS_VARIANT[task.status]}>{task.status}</Badge>
                    {!task.assigned_to && (
                      <Badge variant="purple">
                        <Users className="w-3 h-3 mr-1 inline" /> All Employees
                      </Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-400 mb-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {task.profile && (
                      <span className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-[9px] font-bold text-white">
                          {getInitials(task.profile.full_name)}
                        </div>
                        {task.profile.full_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Due: {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Assign New Task" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Task Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              placeholder="What needs to be done?"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Additional details..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Due Date (optional)</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p} className="bg-slate-900 capitalize">{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Assign To</label>
            <select
              value={form.assigned_to}
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
            >
              <option value="all" className="bg-slate-900">🌐 All Employees</option>
              {employees.map(emp => (
                <option key={emp.user_id} value={emp.user_id} className="bg-slate-900">
                  {emp.full_name} ({emp.department || 'No dept'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white font-semibold text-sm hover:shadow-glow-brand transition-all disabled:opacity-60"
          >
            {submitting ? 'Assigning...' : 'Assign Task'}
          </button>
        </form>
      </Modal>
    </div>
  )
}