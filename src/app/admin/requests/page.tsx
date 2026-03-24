'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Check, X, Pause, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Loader } from '@/components/ui/Loader'
import { LeaveRequest, RequestStatus } from '@/types'
import { formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_FILTERS: { label: string; value: RequestStatus | 'all' }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'On Hold',  value: 'on_hold' },
]

const STATUS_VARIANT: Record<RequestStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  pending:  'warning',
  approved: 'success',
  rejected: 'danger',
  on_hold:  'info',
}

export default function AdminRequestsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [requests, setRequests]   = useState<LeaveRequest[]>([])
  const [filter, setFilter]       = useState<RequestStatus | 'all'>('pending')
  const [loading, setLoading]     = useState(true)
  const [actionReq, setActionReq] = useState<LeaveRequest | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [acting, setActing]       = useState(false)

  useEffect(() => {
    if (!profile) return
    loadRequests()
  }, [profile])

  async function loadRequests() {
    setLoading(true)
    const supabase = createClient()
    
    // First get leave requests
    const { data: requestsData } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Then get profiles for these users
    const userIds = requestsData?.map(r => r.user_id) || []
    let profilesMap: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)
      
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap[p.user_id] = p
        })
      }
    }
    
    // Attach profile to each request
    const requestsWithProfile = (requestsData || []).map(req => ({
      ...req,
      profile: profilesMap[req.user_id] || null
    }))
    
    setRequests(requestsWithProfile)
    setLoading(false)
  }

  async function handleAction(status: RequestStatus) {
    if (!actionReq) return
    setActing(true)
    const supabase = createClient()

    // Update request status
    const { error } = await supabase
      .from('leave_requests')
      .update({ status, admin_note: adminNote || null })
      .eq('id', actionReq.id)

    if (error) {
      toast.error('Could not update request')
      setActing(false)
      return
    }

    // Insert notification for the employee
    const notifMessages: Record<RequestStatus, { title: string; message: string }> = {
      approved: {
        title:   'Request Approved ✅',
        message: `Your ${actionReq.type.replace(/_/g, ' ')} request (${formatDate(actionReq.from_date)}) has been approved.${adminNote ? ' Note: ' + adminNote : ''}`,
      },
      rejected: {
        title:   'Request Rejected ❌',
        message: `Your ${actionReq.type.replace(/_/g, ' ')} request (${formatDate(actionReq.from_date)}) has been rejected.${adminNote ? ' Reason: ' + adminNote : ''}`,
      },
      on_hold: {
        title:   'Request On Hold ⏸',
        message: `Your ${actionReq.type.replace(/_/g, ' ')} request (${formatDate(actionReq.from_date)}) is on hold.${adminNote ? ' Note: ' + adminNote : ''}`,
      },
      pending: { title: '', message: '' },
    }

    if (status !== 'pending') {
      await supabase.from('notifications').insert({
        user_id:    actionReq.user_id,
        title:      notifMessages[status].title,
        message:    notifMessages[status].message,
        type:       'request_update',
        related_id: actionReq.id,
      })
    }

    toast.success(`Request ${status.replace('_', ' ')} successfully`)
    setActionReq(null)
    setAdminNote('')
    loadRequests()
    setActing(false)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle="Manage employee leave and work requests"
      />

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === value
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {label}
            <span className="ml-1.5 text-slate-500">
              ({(value === 'all' ? requests : requests.filter(r => r.status === value)).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No {filter === 'all' ? '' : filter} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {getInitials(req.profile?.full_name || 'U')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-white text-sm">{req.profile?.full_name}</p>
                      <Badge variant={STATUS_VARIANT[req.status]}>{req.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">
                      {req.type.replace(/_/g, ' ')} · {formatDate(req.from_date)}
                      {req.from_date !== req.to_date && <> – {formatDate(req.to_date)}</>}
                    </p>
                    <p className="text-xs text-slate-500">{req.reason}</p>
                    {req.admin_note && (
                      <p className="text-xs text-amber-300 mt-1.5">Admin note: {req.admin_note}</p>
                    )}
                  </div>
                </div>

                {/* Actions — only for pending */}
                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActionReq(req)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-all"
                    >
                      Review <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Modal
        open={!!actionReq}
        onClose={() => { setActionReq(null); setAdminNote('') }}
        title="Review Request"
        size="md"
      >
        {actionReq && (
          <div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 mb-4">
              <p className="text-sm font-medium text-white">{actionReq.profile?.full_name}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{actionReq.type.replace(/_/g, ' ')} · {formatDate(actionReq.from_date)}  – {formatDate(actionReq.to_date)}</p>
              <p className="text-xs text-slate-500 mt-1">{actionReq.reason}</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Admin Note (optional)
              </label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={2}
                placeholder="Add a note for the employee..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction('approved')}
                disabled={acting}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleAction('on_hold')}
                disabled={acting}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-all disabled:opacity-60"
              >
                <Pause className="w-4 h-4" /> Hold
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={acting}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-all disabled:opacity-60"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}