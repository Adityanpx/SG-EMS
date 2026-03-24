'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BellRing, PlusCircle, Pin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Loader } from '@/components/ui/Loader'
import { Announcement } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminAnnouncementsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title:       '',
    message:     '',
    is_pinned:   false,
  })

  useEffect(() => {
    if (!profile) return
    loadAnnouncements()
  }, [profile])

  async function loadAnnouncements() {
    const supabase = createClient()
    const { data } = await supabase
      .from('announcements')
      .select('*, profile:profiles!announcements_created_by_fkey(*)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()

    const { data: newAnnouncement, error } = await supabase
      .from('announcements')
      .insert({
        title:       form.title,
        message:     form.message,
        is_pinned:   form.is_pinned,
        created_by:  profile!.user_id,
      })
      .select('*, profile:profiles!announcements_created_by_fkey(*)')
      .single()

    if (error) {
      toast.error('Could not create announcement')
      setSubmitting(false)
      return
    }

    // Fetch all employees and send notifications
    const { data: employees } = await supabase.from('profiles').select('user_id').eq('role', 'employee')

    if (employees && employees.length > 0) {
      const notifs = employees.map(emp => ({
        user_id:    emp.user_id,
        title:      form.is_pinned ? '📌 Pinned Announcement' : '📢 New Announcement',
        message:    `${form.title}: ${form.message.substring(0, 80)}${form.message.length > 80 ? '...' : ''}`,
        type:       'announcement',
        related_id: newAnnouncement.id,
      }))
      await supabase.from('notifications').insert(notifs)
    }

    toast.success('Announcement posted!')
    setShowModal(false)
    setForm({ title: '', message: '', is_pinned: false })
    loadAnnouncements()
    setSubmitting(false)
  }

  async function togglePin(ann: Announcement) {
    const supabase = createClient()
    const { error } = await supabase
      .from('announcements')
      .update({ is_pinned: !ann.is_pinned })
      .eq('id', ann.id)

    if (!error) {
      loadAnnouncements()
    }
  }

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Post company-wide announcements"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white text-sm font-medium hover:shadow-glow-brand transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Announcement
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BellRing className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann, i) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {ann.is_pinned && (
                      <Badge variant="purple">
                        <Pin className="w-3 h-3 mr-1 inline" /> Pinned
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{ann.title}</h3>
                  <p className="text-xs text-slate-400 whitespace-pre-wrap mb-2">{ann.message}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Posted by {ann.profile?.full_name}</span>
                    <span>•</span>
                    <span>{formatDate(ann.created_at)}</span>
                  </div>
                </div>

                <button
                  onClick={() => togglePin(ann)}
                  className={`p-2 rounded-lg border transition-all ${
                    ann.is_pinned
                      ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                      : 'border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                  title={ann.is_pinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className={`w-4 h-4 ${ann.is_pinned ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Announcement" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              placeholder="Announcement title"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Message</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={4}
              placeholder="Write your announcement..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-300">Pin this announcement</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white font-semibold text-sm hover:shadow-glow-brand transition-all disabled:opacity-60"
          >
            {submitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      </Modal>
    </div>
  )
}