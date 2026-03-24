'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Loader } from '@/components/ui/Loader'
import { Profile } from '@/types'
import { getInitials, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function EmployeesPage() {
  const { profile, loading: authLoading } = useAuth()
  const [employees, setEmployees] = useState<Profile[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!profile) return
    loadEmployees()
  }, [profile])

  async function loadEmployees() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('full_name', { ascending: true })
    setEmployees(data || [])
    setLoading(false)
  }

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.designation || '').toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading) return <Loader />

  return (
    <div>
      <PageHeader
        title="All Employees"
        subtitle={`${employees.length} total employees`}
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, department, or designation..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/admin/employees/${emp.user_id}`}
                className="glass-card p-5 flex items-center gap-4 hover:border-brand-500/30 hover:bg-white/6 transition-all block"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-base font-bold text-white shrink-0">
                  {getInitials(emp.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{emp.full_name}</p>
                  <p className="text-xs text-slate-400">{emp.designation || 'Employee'}</p>
                  <p className="text-xs text-slate-600">{emp.department || '—'}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}