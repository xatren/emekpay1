import { create } from "zustand"
import { supabase } from "../lib/supabase"
import type { User } from "../lib/types"
import type { Session, AuthError, Provider } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initializing: boolean
  error: string | null



  // Email authentication
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>

  // Social authentication
  signInWithProvider: (provider: Provider) => Promise<{ error: AuthError | null }>

  // Session management
  signOut: () => Promise<void>
  restoreSession: () => Promise<void>
  refreshSession: () => Promise<void>

  // Utility
  clearError: () => void
  loadUserProfile: (userId: string) => Promise<void>
  debugState: () => AuthState
  emergencyLogin: (userId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initializing: true,
  error: null,

  // Debug function to check current state
  debugState: () => {
    const state = get()
    console.log('Auth Store State:', {
      user: !!state.user,
      session: !!state.session,
      loading: state.loading,
      initializing: state.initializing,
      error: state.error
    })
    return state
  },



  // Email Authentication
  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      console.log('Attempting sign in with email:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error.message)
        set({ error: error.message, loading: false })
        return { error }
      }

      if (data.user && data.session) {
        console.log('Sign in successful, loading profile for user:', data.user.id)
        try {
          await get().loadUserProfile(data.user.id)
          console.log('Profile loaded, setting session')
          set({
            session: data.session,
            loading: false,
            error: null
          })
        } catch (profileError) {
          console.error('Profile loading failed after sign in:', profileError)
          // Still set the session even if profile loading fails
          set({
            session: data.session,
            loading: false,
            error: "Profile loading failed"
          })
        }
      } else {
        console.error('Sign in succeeded but no user/session data')
        set({ loading: false, error: "Sign in failed - no user data" })
      }

      return { error: null }
    } catch (error: any) {
      const authError = error as AuthError
      console.error('Sign in exception:', authError)
      set({ error: authError.message, loading: false })
      return { error: authError }
    }
  },

  signUpWithEmail: async (email: string, password: string, name?: string) => {
    set({ loading: true, error: null })
    try {
      console.log('Attempting sign up with email:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || "",
            email: email,
          },
        },
      })

      if (error) {
        console.error('Sign up error:', error.message)
        set({ error: error.message, loading: false })
        return { error }
      }

      console.log('Sign up successful')

      // If signup was successful and user is logged in, set basic user data
      if (data.user) {
        const newUser = {
          id: data.user.id,
          name: name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || "Kullanıcı",
          email: data.user.email || "",
          phone: data.user.user_metadata?.phone || "",
          kyc_level: data.user.email_confirmed_at ? 1 : 0, // Email confirmed = basic access
          city: "",
          district: "",
          bio: "",
        }

        console.log('Setting new user data after signup:', {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          kyc_level: newUser.kyc_level
        })

        set({
          user: newUser as any,
          session: data.session,
          loading: false,
          error: null
        })
      } else {
        set({ loading: false })
      }

      return { error: null }
    } catch (error: any) {
      const authError = error as AuthError
      console.error('Sign up exception:', authError)
      set({ error: authError.message, loading: false })
      return { error: authError }
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'emekpay://reset-password',
      })

      if (error) {
        set({ error: error.message, loading: false })
        return { error }
      }

      set({ loading: false })
      return { error: null }
    } catch (error: any) {
      const authError = error as AuthError
      set({ error: authError.message, loading: false })
      return { error: authError }
    }
  },

  updatePassword: async (password: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        set({ error: error.message, loading: false })
        return { error }
      }

      set({ loading: false })
      return { error: null }
    } catch (error: any) {
      const authError = error as AuthError
      set({ error: authError.message, loading: false })
      return { error: authError }
    }
  },

  // Social Authentication
  signInWithProvider: async (provider: Provider) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'emekpay://auth/callback',
        },
      })

      if (error) {
        set({ error: error.message, loading: false })
        return { error }
      }

      return { error: null }
    } catch (error: any) {
      const authError = error as AuthError
      set({ error: authError.message, loading: false })
      return { error: authError }
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null, loading: false, error: null })
    } catch (error: any) {
      console.error("Error signing out:", error)
      set({ loading: false, error: "Sign out failed" })
    }
  },

  restoreSession: async () => {
    try {
      console.log('🔄 Starting session restore...')
      set({ initializing: true })

      // Simple approach: Just get session and set basic user data
      console.log('🔗 Getting session from Supabase...')
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession()

      console.log('📋 Session result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        sessionError: sessionError?.message,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      })

      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        throw sessionError
      }

      if (session?.user) {
        console.log('👤 User authenticated, creating user object...')

        // Create user object directly from session - no database calls
        const userFromSession = {
          id: session.user.id,
          name: session.user.user_metadata?.name ||
                session.user.email?.split('@')[0] ||
                "Kullanıcı",
          email: session.user.email || "",
          phone: session.user.user_metadata?.phone || "",
          kyc_level: session.user.email_confirmed_at ? 1 : 0,
          city: "",
          district: "",
          bio: "",
        }

        console.log('✅ Setting user from session:', {
          id: userFromSession.id,
          name: userFromSession.name,
          email: userFromSession.email,
          kyc_level: userFromSession.kyc_level
        })

        set({
          session,
          user: userFromSession as any,
          initializing: false,
          loading: false,
          error: null
        })

        console.log('🎉 Session restore completed successfully!')

        // Optional: Try to sync with database in background (won't block app)
        setTimeout(() => {
          console.log('🔄 Starting background profile sync...')
          get().loadUserProfile(session.user.id).catch((err) => {
            console.log('ℹ️ Background sync skipped:', err.message)
          })
        }, 2000)

      } else {
        console.log('ℹ️ No active session found')
        set({
          session: null,
          user: null,
          initializing: false,
          loading: false
        })
        console.log('🎉 Session restore completed (no auth)')
      }
    } catch (error: any) {
      console.error("❌ Error restoring session:", error.message)

      // Fallback: Try to get current user even if session fails
      try {
        console.log('🔄 Attempting fallback user recovery...')
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const fallbackUser = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || "Kullanıcı",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
            kyc_level: user.email_confirmed_at ? 1 : 0,
            city: "",
            district: "",
            bio: "",
          }

          set({
            user: fallbackUser as any,
            initializing: false,
            loading: false,
            error: null
          })
          console.log('✅ Fallback user set successfully')
          return
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
      }

      // Final fallback
      set({
        initializing: false,
        loading: false,
        error: "Session restore failed",
        session: null,
        user: null
      })
    }
  },

  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error

      if (data.session?.user) {
        await get().loadUserProfile(data.session.user.id)
        set({ session: data.session })
      }
    } catch (error: any) {
      console.error("Error refreshing session:", error)
      set({ error: "Session refresh failed" })
    }
  },

  loadUserProfile: async (userId: string) => {
    try {
      console.log('🔍 Loading user profile for:', userId)
      console.log('🔗 Connecting to Supabase table: users')

      // Test Supabase connection first
      console.log('🔗 Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true })

      console.log('🔗 Supabase connection test result:', {
        success: !testError,
        error: testError?.message,
        tableExists: !testError
      })

      if (testError) {
        console.error('❌ Supabase connection failed:', testError)
        throw new Error(`Database connection error: ${testError.message}`)
      }

      // Add timeout to prevent hanging
      console.log('🔍 Executing user profile query...')
      const profilePromise = supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 5000)
      )

      console.log('⏳ Executing profile query...')
      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      console.log('📊 Profile query result:', {
        profile: !!profile,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details
      })

      if (profile) {
        console.log('✅ Profile found, setting user:', profile.id, profile.email)
        set({ user: profile as any })
        console.log('🎯 Profile loading completed successfully')
        return
      }

      // Profile doesn't exist, create a new one
      console.log('⚠️ Profile not found, creating new profile...')

      console.log('👤 Getting auth user data...')
      const { data: authUser } = await supabase.auth.getUser()
      console.log('👤 Auth user data:', {
        email: authUser?.user?.email,
        name: authUser?.user?.user_metadata?.name,
        userExists: !!authUser?.user
      })

      const userData = {
        id: userId,
        name: authUser?.user?.user_metadata?.name || "",
        email: authUser?.user?.email || "",
        phone: "",
        kyc_level: 0,
        city: "",
        district: "",
        bio: "",
      }

      console.log('📝 Creating profile with data:', userData)

      const createPromise = supabase
        .from("users")
        .upsert(userData, { onConflict: 'id' })
        .select()
        .single()

      const createTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile creation timeout')), 5000)
      )

      console.log('⏳ Executing profile creation...')
      const { data: newProfile, error: createError } = await Promise.race([createPromise, createTimeoutPromise]) as any

      console.log('📊 Profile creation result:', {
        newProfile: !!newProfile,
        createError: createError?.message,
        createErrorCode: createError?.code
      })

      if (createError) {
        console.error('❌ Failed to create profile:', createError)
        console.log('🔄 Setting fallback user data...')
        set({ user: userData as any })
      } else {
        console.log('✅ Profile created successfully:', newProfile?.id)
        set({ user: newProfile as any })
      }
      console.log('🎯 Profile creation/loading completed')
    } catch (error: any) {
      console.error("❌ Error loading user profile:", error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })

      // Set a fallback user object even on error
      console.log('🔄 Creating fallback user...')
      try {
        const { data: authUser } = await supabase.auth.getUser()
        if (authUser?.user) {
          const fallbackUser = {
            id: userId,
            name: authUser.user.user_metadata?.name || "",
            email: authUser.user.email || "",
            phone: "",
            kyc_level: 0,
            city: "",
            district: "",
            bio: "",
          }
          console.log('✅ Setting fallback user:', fallbackUser.id)
          set({ user: fallbackUser as any })
        }
      } catch (fallbackError) {
        console.error('❌ Fallback user creation failed:', fallbackError)
        // Even fallback failed, create a minimal user object
        const minimalUser = {
          id: userId,
          name: "",
          email: "",
          phone: "",
          kyc_level: 0,
          city: "",
          district: "",
          bio: "",
        }
        console.log('🔄 Setting minimal fallback user')
        set({ user: minimalUser as any })
      }

      set({ error: "Failed to load user profile" })
      console.log('🎯 Error handling completed')

      // If profile loading fails with timeout, clear session and force re-login
      if (error.message === 'Profile query timeout' || error.message === 'Profile creation timeout') {
        console.log('🚨 Timeout detected, clearing session to force re-login...')
        try {
          await supabase.auth.signOut()
          console.log('✅ Session cleared, user will be redirected to login')
          set({
            user: null,
            session: null,
            loading: false,
            initializing: false,
            error: "Session expired, please login again"
          })
        } catch (signOutError) {
          console.error('❌ Failed to clear session:', signOutError)
          // Force clear local state
          set({
            user: null,
            session: null,
            loading: false,
            initializing: false,
            error: "Session expired, please refresh the app"
          })
        }
      }
    }
  },

  // Emergency function to bypass profile loading completely
  emergencyLogin: async (userId: string) => {
    console.log('🚨 EMERGENCY LOGIN: Bypassing profile loading...')
    try {
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser?.user) {
        const emergencyUser = {
          id: userId,
          name: authUser.user.user_metadata?.name || "Kullanıcı",
          email: authUser.user.email || "",
          phone: "",
          kyc_level: 1, // Allow basic access
          city: "",
          district: "",
          bio: "",
        }
        console.log('✅ Emergency user created:', emergencyUser.email)
        set({
          user: emergencyUser as any,
          loading: false,
          initializing: false,
          error: null
        })
      }
    } catch (error) {
      console.error('❌ Emergency login failed:', error)
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session?.user?.id, 'Session exists:', !!session)

  switch (event) {
    case 'SIGNED_IN':
      if (session?.user) {
        console.log('User signed in, setting session first...')

        // Set session immediately to prevent white screen
        const currentState = useAuthStore.getState()
        const existingUser = currentState.user

        useAuthStore.setState({
          session,
          loading: false,
          initializing: false,
          error: null
        })

        // If we don't have user data yet, load profile in background
        if (!existingUser || existingUser.id !== session.user.id) {
          console.log('Loading user profile in background...')
          useAuthStore.getState().loadUserProfile(session.user.id).catch((profileError) => {
            console.warn('⚠️ Background profile loading failed:', profileError.message)
          })
        } else {
          console.log('✅ User data already exists, skipping profile reload')
        }
      }
      break

    case 'SIGNED_OUT':
      console.log('User signed out, clearing state')
      useAuthStore.setState({
        user: null,
        session: null,
        loading: false,
        initializing: false,
        error: null
      })
      break

    case 'TOKEN_REFRESHED':
      console.log('Token refreshed')
      useAuthStore.setState({ session })
      break

    case 'USER_UPDATED':
      console.log('User updated')
      if (session?.user) {
        await useAuthStore.getState().loadUserProfile(session.user.id)
      }
      break
  }
})
