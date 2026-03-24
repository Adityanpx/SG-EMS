import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { differenceInDays } from 'date-fns'

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return profile
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}

// 15-day session expiry check
// Supabase handles token refresh but we manually enforce a 15-day login cap
export function checkSessionExpiry(): boolean {
  const loginTime = localStorage.getItem('sg_login_time')
  if (!loginTime) return false

  const daysSinceLogin = differenceInDays(new Date(), new Date(loginTime))
  return daysSinceLogin >= 15
}

export function setLoginTimestamp() {
  localStorage.setItem('sg_login_time', new Date().toISOString())
}

export function clearLoginTimestamp() {
  localStorage.removeItem('sg_login_time')
}