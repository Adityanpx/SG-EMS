'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, PlusCircle, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Loader } from '@/components/ui/Loader'
import { LeaveRequest, RequestType, RequestStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const REQUEST_TYPES: { value: RequestType; label: string; icon: string }[] = [
  { value: 'leave',         label: 'Casual Leave',   icon: '🌴' },
  { value: 'work_from_home',label: 'Work From Home',  icon: '🏠' },
  { value: 'early_leave',   label: 'Early Leave',    icon: '🕐' },
  { value: 'comp_off',      label: 'Comp Off',       icon: '🔄' },
  { value: 'other',         label: 'Other',          icon: '📋' },
]

const STATUS_VARIANT: Record<RequestStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  pending:  'warning',
  approved: 'success',
  rejected: 'danger',
  on_hold:  'info',
}

export default function RequestsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [requests, setRequests]   = useState<LeaveRequest[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    type:      'leave' as RequestType,
    from_date: '',
    to_date:   '',
    reason:    '',
  })

  useEffect(() => {
    if (!profile) return
    loadRequests()
  }, [profile])

  async function loadRequests() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', profile!.user_id)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.from_date || !form.to_date) {
      toast.error('Please select from and to dates')
      return
    }
    if (new Date(form.to_date) < new Date(form.from_date)) {
      toast.error('End date cannot be before start date')
      return
    }
    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.from('leave_requests').insert({
      user_id:   profile!.user_id,
      type:      form.type,
      from_date: form.from_date,
      to_date:   form.to_date,
      reason:    form.reason,
      status:    'pending',
    })

    if (error) {
      toast.error('Could not submit request: ' + error.message)
    } else {
      toast.success('Request submitted! Admin will review it soon.')
      setShowModal(false)
      setForm({ type: 'leave', from_date: '', to_date: '', reason: '' })
      loadRequests()
    }
    setSubmitting(false)
  }

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="My Requests"
        subtitle="Apply for leave, WFH, or other requests"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white text-sm font-medium hover:shadow-glow-brand transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Request
          </button>
        }
      />

      {/* Request history */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-4">No requests yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 text-sm hover:bg-brand-500/30 transition-all"
          >
            Apply for your first request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => {
            const typeInfo = REQUEST_TYPES.find(t => t.value === req.type)
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{typeInfo?.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-white text-sm">{typeInfo?.label}</p>
                        <Badge variant={STATUS_VARIANT[req.status]}>
                          {req.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(req.from_date)}
                        {req.from_date !== req.to_date && <> — {formatDate(req.to_date)}</>}
                      </div>
                      <p className="text-xs text-slate-400">{req.reason}</p>
                      {req.admin_note && (
                        <p className="text-xs text-amber-300 mt-1.5 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          Admin note: {req.admin_note}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 shrink-0">
                    {formatDate(req.created_at)}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* New Request Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Request" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Request type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Request Type</label>
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_TYPES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: value }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                    form.type === value
                      ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                      : 'border-white/10 bg-white/3 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">From Date</label>
              <input
                type="date"
                value={form.from_date}
                onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">To Date</label>
              <input
                type="date"
                value={form.to_date}
                onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Reason</label>
            <textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              required
              rows={3}
              placeholder="Brief reason for your request..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white font-semibold text-sm hover:shadow-glow-brand transition-all disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </Modal>
    </div>
  )
}