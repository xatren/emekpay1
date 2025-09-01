import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js"
import Constants from "expo-constants"

const supabaseUrl = process.env.SUPABASE_URL || Constants.expoConfig?.extra?.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || Constants.expoConfig?.extra?.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_ANON_KEY:', !!supabaseAnonKey)
  throw new Error("Missing Supabase environment variables")
}

console.log('✅ Supabase client initialized successfully')

// Production-ready Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'EmekPay',
    },
  },
})

// Configure email verification redirect
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Supabase auth state change:', event, {
    userId: session?.user?.id,
    hasSession: !!session,
    emailConfirmed: !!session?.user?.email_confirmed_at
  })

  if (event === 'SIGNED_IN' && session?.user) {
    console.log('✅ User signed in to Supabase')
    // Handle successful email verification
    if (session.user.email_confirmed_at) {
      console.log('📧 Email verified for user:', session.user.id)
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('🚪 User signed out from Supabase')
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token refreshed')
  }
})



// Admin client for server-side operations (use carefully)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Edge function helpers
export const escrowHold = async (bookingId: string, points: number) => {
  const { data, error } = await supabase.functions.invoke("escrow-hold", {
    body: { bookingId, points },
  })
  return { data, error }
}

export const escrowRelease = async (bookingId: string) => {
  const { data, error } = await supabase.functions.invoke("escrow-release", {
    body: { bookingId },
  })
  return { data, error }
}

export const escrowRefund = async (bookingId: string) => {
  const { data, error } = await supabase.functions.invoke("escrow-refund", {
    body: { bookingId },
  })
  return { data, error }
}
