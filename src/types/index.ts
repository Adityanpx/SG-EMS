export type UserRole = 'admin' | 'employee'

export type AttendanceMode =
  | 'work_from_office'
  | 'work_from_home'
  | 'field_work'
  | 'half_day'
  | 'on_leave'

export type AttendanceStatus = 'clocked_in' | 'clocked_out' | 'absent'

export type RequestType = 'leave' | 'work_from_home' | 'early_leave' | 'comp_off' | 'other'

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'on_hold'

export type TaskStatus = 'assigned' | 'working' | 'pending' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  email: string
  role: UserRole
  department: string | null
  designation: string | null
  phone: string | null
  avatar_url: string | null
  joined_at: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  user_id: string
  date: string                     // YYYY-MM-DD
  mode: AttendanceMode
  status: AttendanceStatus
  clock_in_time: string | null
  clock_out_time: string | null
  clock_out_summary: ClockOutTask[] | null
  created_at: string
}

export interface ClockOutTask {
  task: string
  status: 'done' | 'working' | 'pending'
}

export interface LeaveRequest {
  id: string
  user_id: string
  profile?: Profile
  type: RequestType
  from_date: string
  to_date: string
  reason: string
  status: RequestStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  assigned_to: string | null        // null means assigned to all employees
  assigned_by: string
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  priority: TaskPriority
  profile?: Profile
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'request_update' | 'task_assigned' | 'announcement' | 'general'
  is_read: boolean
  related_id: string | null
  created_at: string
}

export interface Announcement {
  id: string
  created_by: string
  title: string
  content: string
  is_active: boolean
  created_at: string
  profile?: Profile
}

export interface SessionData {
  user_id: string
  role: UserRole
  login_time: string               // ISO string — used for 15-day expiry check
}