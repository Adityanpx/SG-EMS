'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Loader } from '@/components/ui/Loader'
import { Profile } from '@/types'
import { getInitials } from '@/lib/utils'

export default function TeamPage() {
  const { profile, loading: authLoading } = useAuth()
  const [team, setTeam]       = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadTeam()
  }, [profile])

  async function loadTeam() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('full_name', { ascending: true })
    setTeam(data || [])
    setLoading(false)
  }

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="My Team"
        subtitle={`${team.length} employee${team.length !== 1 ? 's' : ''} at SG Infinity`}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-base font-bold text-white shrink-0 shadow-glow-brand">
                {getInitials(member.full_name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {member.full_name}
                  {member.user_id === profile?.user_id && (
                    <span className="ml-1.5 text-xs text-brand-400">(You)</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 truncate">{member.designation || 'Employee'}</p>
                <p className="text-xs text-slate-600">{member.department || '—'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}