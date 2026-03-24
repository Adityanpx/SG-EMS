'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDate } from '@/lib/utils'

interface Props {
  userId: string
}

export function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markAllRead } = useNotifications(userId)
  const [open, setOpen] = useState(false)

  function toggle() {
    setOpen((v) => !v)
    if (!open && unreadCount > 0) markAllRead()
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs text-white flex items-center justify-center font-bold animate-pulse-slow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 glass-card border border-white/10 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount === 0 && (
                <span className="text-xs text-slate-500">All caught up</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 border-b border-white/5 last:border-0 transition-colors ${
                      !n.is_read ? 'bg-brand-500/10' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-600 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}