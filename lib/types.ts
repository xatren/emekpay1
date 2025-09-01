export interface User {
  id: string
  name: string
  email: string
  phone?: string
  city?: string
  district?: string
  bio?: string
  avatar_url?: string
  kyc_level: number
  created_at: string
}

export interface Skill {
  id: string
  user_id: string
  title: string
  category: string
  description: string
  level: "beginner" | "intermediate" | "expert"
}

export interface Listing {
  id: string
  user_id: string
  type: "offer" | "request"
  title: string
  category: string
  description: string
  hourly_point_rate: number
  city: string
  district: string
  is_active: boolean
  created_at: string
  user?: User
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  body: string
  attachments?: string[]
  created_at: string
  sender?: User
}

export interface Booking {
  id: string
  listing_id: string
  requester_id: string
  provider_id: string
  start_at: string
  end_at: string
  status: "pending" | "accepted" | "in_progress" | "completed" | "canceled"
  total_points: number
  created_at: string
  listing?: Listing
  requester?: User
  provider?: User
}

export interface Wallet {
  user_id: string
  balance_points: number
}

export interface Transaction {
  id: string
  from_user_id?: string
  to_user_id?: string
  booking_id?: string
  points: number
  fee_points: number
  type: "hold" | "release" | "refund" | "adjust"
  status: "pending" | "completed" | "failed"
  created_at: string
}
