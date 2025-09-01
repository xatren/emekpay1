# 🚀 EmekPay Supabase Integration Guide

## 📋 Table of Contents
1. [Current Setup Analysis](#current-setup-analysis)
2. [Configuration Updates](#configuration-updates)
3. [Authentication System](#authentication-system)
4. [Database Schema & Security](#database-schema--security)
5. [API & Data Management](#api--data-management)
6. [Real-time Features](#real-time-features)
7. [Edge Functions](#edge-functions)
8. [Best Practices](#best-practices)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Deployment Checklist](#deployment-checklist)
11. [Troubleshooting](#troubleshooting)

---

## 🔍 Current Setup Analysis

### ✅ What's Already Working
- **Basic Supabase Client**: Configured with URL and API key
- **Phone Authentication**: OTP-based phone verification
- **Database Schema**: Complete schema with proper relationships
- **Row Level Security**: Comprehensive RLS policies
- **Basic Auth Store**: Zustand-based state management
- **TypeScript Types**: Well-defined interfaces

### ⚠️ Areas for Improvement
- **Authentication Methods**: Limited to phone OTP only
- **Error Handling**: Basic error management
- **Security**: Missing advanced security features
- **Monitoring**: No analytics or monitoring setup
- **Performance**: No caching or optimization strategies

---

## ⚙️ Configuration Updates

### 1. Environment Variables
```json
// app.json
{
  "expo": {
    "extra": {
      "SUPABASE_URL": "https://dprchhnsvxagrisgfoxx.supabase.co",
      "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY"
    }
  }
}
```

### 2. Enhanced Supabase Client
```typescript
// lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Enhanced security
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  global: {
    headers: {
      'x-application-name': 'EmekPay',
    },
  },
})
```

---

## 🔐 Authentication System

### Multi-Method Authentication

#### 1. Phone Authentication (Enhanced)
```typescript
// Existing phone authentication with improvements
const { signInWithOtp, verifyOtp } = useAuthStore()

// Usage
await signInWithOtp('+905xxxxxxxxx')
await verifyOtp('+905xxxxxxxxx', '123456')
```

#### 2. Email Authentication (New)
```typescript
// New email authentication methods
const {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  updatePassword
} = useAuthStore()

// Usage
await signInWithEmail('user@example.com', 'password')
await signUpWithEmail('user@example.com', 'password')
await resetPassword('user@example.com')
await updatePassword('newPassword')
```

#### 3. Social Authentication (New)
```typescript
// Social login support
const { signInWithProvider } = useAuthStore()

// Supported providers
await signInWithProvider('google')
await signInWithProvider('github')
await signInWithProvider('apple')
```

### Enhanced Auth Store Features

#### State Management
```typescript
interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initializing: boolean
  error: string | null

  // Multiple auth methods
  signInWithOtp: (phone: string) => Promise<{ error: AuthError | null }>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithProvider: (provider: Provider) => Promise<{ error: AuthError | null }>

  // Session management
  signOut: () => Promise<void>
  restoreSession: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}
```

#### Auth State Listener
```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      await loadUserProfile(session.user.id)
      break
    case 'SIGNED_OUT':
      resetAuthState()
      break
    case 'TOKEN_REFRESHED':
      updateSession(session)
      break
  }
})
```

---

## 🗄️ Database Schema & Security

### Current Schema Overview

#### Core Tables
```sql
-- Users with enhanced profile management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  city TEXT,
  district TEXT,
  bio TEXT,
  avatar_url TEXT,
  kyc_level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills with categories
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service listings
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('offer', 'request')) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  hourly_point_rate INTEGER NOT NULL,
  city TEXT,
  district TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking system
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'canceled')),
  total_points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points system
CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_points INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction tracking
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  booking_id UUID REFERENCES bookings(id),
  points INTEGER NOT NULL,
  fee_points INTEGER DEFAULT 0,
  type TEXT CHECK (type IN ('hold', 'release', 'refund', 'adjust')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security Policies

#### Users Policies
```sql
-- Allow public profile viewing
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);

-- Users can update their own profiles
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
```

#### Listings Policies
```sql
-- Public can view active listings
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (is_active = true);

-- Users manage their own listings
CREATE POLICY "Users can manage own listings" ON listings FOR ALL USING (auth.uid() = user_id);
```

#### Bookings Policies
```sql
-- Users see their own bookings
CREATE POLICY "Users can view their bookings" ON bookings FOR SELECT USING (
  auth.uid() = requester_id OR auth.uid() = provider_id
);

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = requester_id);
```

---

## 🔌 API & Data Management

### Query Optimization

#### Efficient Data Fetching
```typescript
// Optimized queries with proper indexing
const { data: listings } = await supabase
  .from('listings')
  .select(`
    *,
    user:users(name, avatar_url, kyc_level)
  `)
  .eq('is_active', true)
  .eq('category', 'Technology')
  .order('created_at', { ascending: false })
  .limit(20)
```

#### Real-time Subscriptions
```typescript
// Real-time updates for listings
const subscription = supabase
  .channel('listings_changes')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'listings',
      filter: 'is_active=eq.true'
    },
    (payload) => {
      console.log('Listing changed:', payload)
      // Update UI accordingly
    }
  )
  .subscribe()
```

### Error Handling

#### Comprehensive Error Management
```typescript
const handleSupabaseError = (error: any) => {
  switch (error.code) {
    case 'PGRST116':
      return 'Data not found'
    case '23505':
      return 'This record already exists'
    case '42501':
      return 'You do not have permission to perform this action'
    default:
      return error.message || 'An unexpected error occurred'
  }
}

try {
  const { data, error } = await supabase.from('users').insert(userData)
  if (error) throw error
} catch (error) {
  const userMessage = handleSupabaseError(error)
  Alert.alert('Error', userMessage)
}
```

---

## ⚡ Real-time Features

### Live Updates Implementation

#### Booking Status Updates
```typescript
// Real-time booking status updates
useEffect(() => {
  const subscription = supabase
    .channel('booking_updates')
    .on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `requester_id=eq.${userId}`
      },
      (payload) => {
        // Update booking status in real-time
        updateBookingStatus(payload.new)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [userId])
```

#### Message Notifications
```typescript
// Real-time messaging
const messageSubscription = supabase
  .channel('messages')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `thread_id=eq.${threadId}`
    },
    (payload) => {
      // Add new message to chat
      addMessage(payload.new)
      // Show notification if app is backgrounded
      showNotification(payload.new)
    }
  )
  .subscribe()
```

---

## 🔧 Edge Functions

### Current Functions
```typescript
// Escrow management functions
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
```

### Recommended Additional Functions

#### Payment Processing
```typescript
// Payment verification function
export const verifyPayment = async (paymentId: string) => {
  const { data, error } = await supabase.functions.invoke("verify-payment", {
    body: { paymentId },
  })
  return { data, error }
}
```

#### Notification System
```typescript
// Send push notifications
export const sendNotification = async (userId: string, message: string) => {
  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: { userId, message },
  })
  return { data, error }
}
```

---

## 🎯 Best Practices

### Security Best Practices

#### 1. Environment Variables
```bash
# .env.local (for development)
SUPABASE_URL=https://dprchhnsvxagrisgfoxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Never commit these to version control
```

#### 2. API Key Management
```typescript
// Use different keys for different environments
const getSupabaseConfig = () => {
  if (__DEV__) {
    return {
      url: process.env.EXPO_PUBLIC_SUPABASE_DEV_URL,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_DEV_ANON_KEY,
    }
  }

  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_PROD_URL,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_PROD_ANON_KEY,
  }
}
```

#### 3. Input Validation
```typescript
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
})

const validateUserData = (data: any) => {
  return userSchema.safeParse(data)
}
```

### Performance Optimization

#### 1. Query Optimization
```typescript
// Use select to fetch only needed columns
const { data } = await supabase
  .from('users')
  .select('id, name, avatar_url')
  .limit(10)

// Use indexes for frequently queried columns
CREATE INDEX idx_listings_category_created ON listings(category, created_at DESC);
```

#### 2. Caching Strategy
```typescript
// Implement React Query for caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const useListings = (category?: string) => {
  return useQuery({
    queryKey: ['listings', category],
    queryFn: () => fetchListings(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

#### 3. Connection Pooling
```typescript
// Configure connection limits
export const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
    },
  },
})
```

---

## 📊 Monitoring & Analytics

### Supabase Dashboard Monitoring

#### 1. Query Performance
- Monitor slow queries in Supabase Dashboard
- Set up alerts for query performance degradation
- Use EXPLAIN ANALYZE for query optimization

#### 2. Real-time Metrics
```sql
-- Monitor active connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Application Monitoring

#### 1. Error Tracking
```typescript
// Global error boundary
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: 'your_sentry_dsn',
  environment: __DEV__ ? 'development' : 'production',
})

// Error logging utility
export const logError = (error: Error, context?: any) => {
  console.error('Application Error:', error, context)
  Sentry.captureException(error, { extra: context })
}
```

#### 2. Performance Monitoring
```typescript
// Performance tracking
import { PerformanceMonitor } from 'react-native-performance-monitor'

const trackApiCall = async (apiName: string, apiCall: () => Promise<any>) => {
  const startTime = Date.now()
  try {
    const result = await apiCall()
    const duration = Date.now() - startTime
    console.log(`${apiName} took ${duration}ms`)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`${apiName} failed after ${duration}ms:`, error)
    throw error
  }
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

#### ✅ Database Setup
- [ ] Run all SQL migration scripts
- [ ] Verify RLS policies are active
- [ ] Test all database relationships
- [ ] Set up database backups
- [ ] Configure database monitoring

#### ✅ Authentication Setup
- [ ] Configure email templates in Supabase
- [ ] Set up OAuth providers (Google, GitHub, Apple)
- [ ] Configure SMS provider for OTP
- [ ] Test all authentication flows
- [ ] Set up password reset flow

#### ✅ Security Configuration
- [ ] Rotate API keys
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Enable database encryption
- [ ] Configure SSL certificates

### Deployment

#### ✅ Environment Configuration
- [ ] Update production environment variables
- [ ] Configure production Supabase URL and keys
- [ ] Set up production database connection
- [ ] Configure production monitoring tools

#### ✅ Application Deployment
- [ ] Build production version of the app
- [ ] Configure app store settings
- [ ] Set up CI/CD pipeline
- [ ] Configure production logging
- [ ] Set up error tracking

### Post-Deployment

#### ✅ Monitoring Setup
- [ ] Set up application monitoring
- [ ] Configure alert notifications
- [ ] Set up performance monitoring
- [ ] Configure log aggregation

#### ✅ Testing
- [ ] Test all authentication methods
- [ ] Verify database operations
- [ ] Test real-time features
- [ ] Validate security measures
- [ ] Performance testing

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Authentication Issues
```typescript
// Debug authentication problems
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event)
  console.log('Session:', session)
  console.log('User:', session?.user)
})

// Check session status
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)
```

#### 2. Database Connection Issues
```typescript
// Test database connection
const { data, error } = await supabase
  .from('users')
  .select('count(*)')
  .single()

if (error) {
  console.error('Database connection error:', error)
} else {
  console.log('Database connected successfully')
}
```

#### 3. Real-time Connection Issues
```typescript
// Debug real-time connections
const channel = supabase.channel('test')
channel
  .on('broadcast', { event: 'test' }, (payload) => {
    console.log('Received broadcast:', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// Test broadcast
setTimeout(() => {
  channel.send({
    type: 'broadcast',
    event: 'test',
    payload: { message: 'Hello World' }
  })
}, 1000)
```

### Performance Issues

#### Query Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM listings
WHERE category = 'Technology'
ORDER BY created_at DESC
LIMIT 20;

-- Add composite indexes for common queries
CREATE INDEX idx_listings_category_active_created
ON listings(category, is_active, created_at DESC);
```

#### Connection Pooling
```typescript
// Implement connection retry logic
const executeWithRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

---

## 📚 Additional Resources

### Documentation
- [Supabase Official Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Best Practices
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Database Performance Tuning](https://supabase.com/docs/guides/database/performance)
- [Real-time Best Practices](https://supabase.com/docs/guides/realtime)

### Tools & Services
- [Supabase CLI](https://supabase.com/docs/reference/cli)
- [Supabase Studio](https://supabase.com/docs/guides/studio)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🎯 Next Steps

1. **Immediate Actions:**
   - Update Supabase configuration with new credentials
   - Test all authentication methods
   - Implement error handling improvements
   - Set up monitoring and analytics

2. **Short-term Goals:**
   - Implement social authentication
   - Add email confirmation flow
   - Optimize database queries
   - Set up automated testing

3. **Long-term Vision:**
   - Implement advanced caching strategies
   - Add real-time collaborative features
   - Set up advanced analytics
   - Implement machine learning recommendations

This comprehensive integration provides a robust, scalable, and secure foundation for your EmekPay application. The modular architecture allows for easy maintenance and future enhancements.

---

*Last updated: January 2025*
*Supabase Integration Version: 2.0*
