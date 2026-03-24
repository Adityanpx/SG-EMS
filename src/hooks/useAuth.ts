'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkSessionExpiry, signOut } from '@/lib/auth'
import { Profile } from '@/types'

export function useAuth() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      // Check 15-day expiry first
      if (checkSessionExpiry()) {
        await signOut()
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    load()
  }, [router])

  return { profile, loading, isAdmin: profile?.role === 'admin' }
}