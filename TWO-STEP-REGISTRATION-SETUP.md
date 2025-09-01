# 🚀 EmekPay Two-Step User Registration Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture & Flow](#architecture--flow)
3. [Supabase Configuration](#supabase-configuration)
4. [Database Setup](#database-setup)
5. [Component Structure](#component-structure)
6. [Routing & Navigation](#routing--navigation)
7. [Email Verification Setup](#email-verification-setup)
8. [Deep Link Configuration](#deep-link-configuration)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This implementation provides a secure, user-friendly two-step user registration flow for EmekPay with the following features:

### ✅ **Key Features**
- **Step 1**: Collect only essential information (Name + Email)
- **Email Verification**: Automatic verification email with secure links
- **Step 2**: Complete profile setup after email verification
- **Secure Flow**: Prevents spam registrations and ensures valid emails
- **User-Friendly**: Clear feedback and smooth transitions
- **Deep Link Support**: Seamless mobile app integration

### 🔄 **User Flow**
```
New User → Step 1 (Name + Email)
       ↓ (Email sent automatically)
Step 1 → Email Verification Link Clicked
       ↓ (Deep link handled)
Step 2 → Profile Completion (City, District, Bio, Skills, Password)
       ↓ (Account fully activated)
Complete → Home Screen + Welcome Bonus
```

---

## 🏗️ Architecture & Flow

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  register.tsx   │    │ verify-email.tsx │    │ profile-       │
│  (Step 1)       │────│ (Email Handler)  │────│ completion.tsx │
│                 │    │                 │    │  (Step 2)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Supabase Auth  │    │ Deep Link       │    │   Database      │
│  (User Creation)│    │ Handler         │    │   (Profile)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Step 1**: User submits name + email → Supabase creates account → Email sent
2. **Email Click**: User clicks verification link → Deep link handled → Redirect to Step 2
3. **Step 2**: User completes profile → Database updated → Account activated

---

## ⚙️ Supabase Configuration

### 1. Authentication Settings

#### **Enable Email Confirmation**
```sql
-- In Supabase Dashboard → Authentication → Settings
-- Enable "Enable email confirmations"
-- Set "Site URL" to your production URL
-- Example: https://your-app.com or https://your-app.vercel.app
```

#### **Email Templates**
Navigate to **Authentication → Email Templates → Confirm signup**

**HTML Template:**
```html
<h2>EmekPay'e Hoş Geldiniz!</h2>
<p>Merhaba {{ .Email }},</p>
<p>EmekPay hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Hesabımı Doğrula</a></p>
<p>Bu bağlantı 1 saat içinde geçersiz olacaktır.</p>
<p>EmekPay Ekibi</p>
```

**Plain Text Template:**
```text
EmekPay'e Hoş Geldiniz!

Merhaba {{ .Email }},

EmekPay hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:
{{ .ConfirmationURL }}

Bu bağlantı 1 saat içinde geçersiz olacaktır.

EmekPay Ekibi
```

### 2. URL Configuration

#### **Site URL**
```
Production: https://your-app-domain.com
Development: http://localhost:8081
```

#### **Redirect URLs**
```
Production: emekpay://verify-email
Development: exp://localhost:8081/--/verify-email
```

### 3. SMTP Settings (Optional but Recommended)

Configure custom SMTP for branded emails:
- **Host**: Your SMTP server
- **Port**: 587 (TLS) or 465 (SSL)
- **Username**: Your SMTP username
- **Password**: Your SMTP password

---

## 🗄️ Database Setup

### Required Tables

#### 1. **temp_registrations** (New Table)
```sql
-- Create temporary registrations table
CREATE TABLE temp_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  step INTEGER DEFAULT 1 CHECK (step IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE temp_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own temp registration"
ON temp_registrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own temp registration"
ON temp_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own temp registration"
ON temp_registrations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own temp registration"
ON temp_registrations FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_temp_registrations_user_id ON temp_registrations(user_id);
CREATE INDEX idx_temp_registrations_email ON temp_registrations(email);

-- Function to clean up old temporary registrations
CREATE OR REPLACE FUNCTION cleanup_old_temp_registrations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM temp_registrations
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;
```

#### 2. **Enhanced users table**
```sql
-- Add KYC level column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_kyc_level ON users(kyc_level);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### Database Schema Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | id, name, email, city, district, bio, kyc_level |
| `temp_registrations` | Step 1 data | user_id, name, email, step |
| `wallets` | User points | user_id, balance_points |
| `skills` | User skills | user_id, title, category, level |

---

## 📱 Component Structure

### File Organization

```
app/
├── (auth)/
│   ├── register.tsx           # Step 1: Name + Email collection
│   ├── profile-completion.tsx # Step 2: Full profile setup
│   ├── verify-email.tsx       # Email verification handler
│   ├── login.tsx             # Existing login screen
│   └── _layout.tsx           # Auth navigation
├── index.tsx                 # Main routing logic
└── _layout.tsx              # Root layout
```

### Component Details

#### **register.tsx** (Step 1)
```typescript
// Key features:
// - Minimal form with name and email
// - Real-time validation
// - Supabase auth integration
// - Automatic email sending
// - Success feedback and navigation
```

#### **profile-completion.tsx** (Step 2)
```typescript
// Key features:
// - Complete profile form (city, district, bio, password, skills)
// - Data persistence from Step 1
// - Skills selection interface
// - Wallet creation with welcome bonus
// - Final account activation
```

#### **verify-email.tsx** (Email Handler)
```typescript
// Key features:
// - URL parameter parsing
// - Supabase email verification
// - Smart routing based on profile status
// - Error handling and recovery
// - Loading states and user feedback
```

---

## 🧭 Routing & Navigation

### Navigation Flow

```typescript
// app/index.tsx - Smart routing logic
export default function Index() {
  const { user } = useAuthStore()

  if (user) {
    // Check profile completion status
    if (!user.city || user.kyc_level < 2) {
      return <Redirect href="/(auth)/profile-completion" />
    }
    return <Redirect href="/(tabs)/home" />
  }

  // Default to onboarding or login
  return <Redirect href="/onboarding/screen1" />
}
```

### Auth Layout Configuration

```typescript
// app/(auth)/_layout.tsx
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />           // Step 1
      <Stack.Screen name="profile-completion" /> // Step 2
      <Stack.Screen name="verify-email" />      // Email handler
    </Stack>
  )
}
```

### Deep Link Handling

```typescript
// lib/deepLinkHandler.ts
export const handleDeepLink = (url: string) => {
  const { hostname, path, queryParams } = Linking.parse(url)

  if (hostname === 'dprchhnsvxagrisgfoxx.supabase.co') {
    if (path?.includes('/auth/v1/callback')) {
      const { type, token } = queryParams || {}

      if (type === 'signup') {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { token, type }
        })
      }
    }
  }
}
```

---

## 📧 Email Verification Setup

### Supabase Email Configuration

1. **Go to Supabase Dashboard** → **Authentication** → **Settings**
2. **Enable email confirmations**
3. **Set Site URL**: `https://your-app-domain.com`
4. **Configure redirect URLs**:
   - Production: `emekpay://verify-email`
   - Development: `exp://localhost:8081/--/verify-email`

### Custom Email Templates

#### **HTML Template**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>EmekPay - Email Doğrulama</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #2563EB, #EA580C); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">EmekPay'e Hoş Geldiniz!</h1>
    </div>

    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #2563EB; margin-top: 0;">Hesabınızı Doğrulayın</h2>

        <p>Merhaba <strong>{{ .Email }}</strong>,</p>

        <p>EmekPay hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}"
               style="background: linear-gradient(135deg, #2563EB, #EA580C);
                      color: white;
                      padding: 15px 30px;
                      text-decoration: none;
                      border-radius: 25px;
                      font-weight: bold;
                      display: inline-block;
                      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                Hesabımı Doğrula
            </a>
        </div>

        <p style="color: #666; font-size: 14px;">
            Bu bağlantı 1 saat içinde geçersiz olacaktır.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #666; font-size: 12px;">
            Eğer bu e-postayı yanlışlıkla aldıysanız, lütfen dikkate almayın.
        </p>
    </div>
</body>
</html>
```

### Email Link Structure

The verification email contains a link like:
```
https://dprchhnsvxagrisgfoxx.supabase.co/auth/v1/verify?token=abc123&type=signup&redirect_to=emekpay://verify-email
```

---

## 🔗 Deep Link Configuration

### Expo Configuration

```json
// app.json
{
  "expo": {
    "scheme": "emekpay",
    "notification": {
      "iosDisplayInForeground": true,
      "androidMode": "default"
    }
  }
}
```

### iOS Configuration

```xml
<!-- ios/EmekPay/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>emekpay</string>
    </array>
  </dict>
</array>
```

### Android Configuration

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask">
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="emekpay" />
  </intent-filter>
</activity>
```

---

## 🧪 Testing Guide

### Manual Testing Steps

#### **Step 1 Testing**
1. **Navigate to registration**: Go to `/register`
2. **Fill form**: Enter name and email
3. **Submit**: Click "Doğrulama E-postası Gönder"
4. **Check email**: Verify email is sent
5. **Verify UI**: Success message should appear

#### **Email Verification Testing**
1. **Click link**: Click verification link in email
2. **App opens**: App should open automatically
3. **Verify screen**: Should see verification success
4. **Auto redirect**: Should redirect to profile completion

#### **Step 2 Testing**
1. **Complete form**: Fill all required fields
2. **Skills selection**: Select at least one skill
3. **Submit**: Click "Kaydı Tamamla"
4. **Verify completion**: Should redirect to home with welcome bonus

### Automated Testing

```typescript
// __tests__/registration-flow.test.tsx
describe('Two-Step Registration Flow', () => {
  it('should complete full registration flow', async () => {
    // Test Step 1
    const step1Result = await registerUser({
      name: 'John Doe',
      email: 'john@example.com'
    })
    expect(step1Result.success).toBe(true)

    // Mock email verification
    const verificationResult = await verifyEmail('mock-token')
    expect(verificationResult.verified).toBe(true)

    // Test Step 2
    const step2Result = await completeProfile({
      city: 'Istanbul',
      district: 'Kadıköy',
      bio: 'Software developer',
      skills: ['JavaScript', 'React']
    })
    expect(step2Result.completed).toBe(true)
  })
})
```

### Edge Case Testing

#### **Network Issues**
- Test offline registration attempts
- Test email sending failures
- Test profile completion with poor connection

#### **User Behavior**
- Test multiple verification attempts
- Test expired verification links
- Test profile completion abandonment

#### **Error Scenarios**
- Test duplicate email registration
- Test invalid email formats
- Test missing required fields

---

## 🔧 Troubleshooting

### Common Issues

#### **1. Email Not Being Sent**
```typescript
// Check Supabase logs
// Dashboard → Authentication → Logs

// Verify email configuration
const { data, error } = await supabase.auth.admin.sendRawEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>Test</p>'
})
```

#### **2. Deep Links Not Working**
```typescript
// Test deep link manually
const testUrl = "emekpay://verify-email?token=abc123&type=signup"

// Check if app opens
Linking.canOpenURL(testUrl).then(supported => {
  if (supported) {
    Linking.openURL(testUrl)
  }
})
```

#### **3. Verification Token Issues**
```typescript
// Debug token handling
console.log('Verification URL:', url)
console.log('Parsed params:', Linking.parse(url))

// Check token validity
const { data, error } = await supabase.auth.verifyOtp({
  token_hash: token,
  type: 'signup'
})
```

#### **4. Profile Completion Errors**
```typescript
// Debug profile data
const { data: profile, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

if (error) {
  console.error('Profile fetch error:', error)
}
```

### Database Issues

#### **Temp Registration Cleanup**
```sql
-- Manual cleanup if needed
DELETE FROM temp_registrations
WHERE created_at < NOW() - INTERVAL '24 hours';

-- Check cleanup function
SELECT cleanup_old_temp_registrations();
```

#### **Profile Data Issues**
```sql
-- Check user profile data
SELECT id, name, email, city, district, kyc_level
FROM users
WHERE id = 'user-id-here';

-- Check wallet creation
SELECT user_id, balance_points
FROM wallets
WHERE user_id = 'user-id-here';
```

### Performance Optimization

#### **Query Optimization**
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_kyc
ON users(email, kyc_level);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_temp_registrations_created
ON temp_registrations(created_at DESC);
```

#### **Monitoring Queries**
```sql
-- Monitor registration performance
SELECT
  date_trunc('hour', created_at) as hour,
  count(*) as registrations
FROM users
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY hour DESC;
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

#### ✅ **Database**
- [ ] Run all SQL migrations
- [ ] Verify RLS policies
- [ ] Test cleanup functions
- [ ] Set up automated backups

#### ✅ **Supabase Configuration**
- [ ] Update production URLs
- [ ] Configure SMTP settings
- [ ] Set up custom email templates
- [ ] Enable production monitoring

#### ✅ **App Configuration**
- [ ] Update app.json with production URLs
- [ ] Configure deep linking
- [ ] Set up production environment variables
- [ ] Test all authentication flows

### Deployment Steps

1. **Database Migration**
```bash
# Run database setup
psql -h prod-db-host -U postgres -d prod-db -f scripts/setup-two-step-registration.sql
```

2. **App Deployment**
```bash
# Build and deploy
expo build:ios --type archive
expo build:android --type app-bundle
```

3. **Environment Update**
```json
// Update app.json with production values
{
  "SUPABASE_URL": "https://your-prod-project.supabase.co",
  "SUPABASE_ANON_KEY": "your-prod-anon-key"
}
```

### Post-Deployment Verification

#### **Test Complete Flow**
1. Register new user (Step 1)
2. Verify email delivery
3. Click verification link
4. Complete profile (Step 2)
5. Verify account activation
6. Check welcome bonus in wallet

#### **Monitor Key Metrics**
- Registration completion rate
- Email verification success rate
- Profile completion drop-off
- Error rates and user feedback

---

## 📊 Analytics & Monitoring

### Key Metrics to Track

#### **Registration Metrics**
- **Step 1 Completion**: Users who submit name + email
- **Email Verification Rate**: Verified users / Total registrations
- **Step 2 Completion**: Profile completion rate
- **Overall Conversion**: Step 1 → Email verified → Profile complete

#### **Performance Metrics**
- **Email Delivery Time**: Average time to send verification emails
- **Page Load Times**: Registration screen performance
- **Deep Link Success Rate**: Successful app opens from email links

### Monitoring Setup

```typescript
// Track registration events
const trackRegistrationEvent = (event: string, data?: any) => {
  // Send to analytics service
  console.log(`Registration: ${event}`, data)

  // Example: Send to Supabase analytics table
  supabase.from('analytics_events').insert({
    event_type: 'registration',
    event_name: event,
    user_id: user?.id,
    metadata: data,
    created_at: new Date().toISOString()
  })
}

// Usage throughout flow
trackRegistrationEvent('step1_started')
trackRegistrationEvent('email_sent', { email })
trackRegistrationEvent('email_verified')
trackRegistrationEvent('profile_completed', { skills_count: selectedSkills.length })
```

---

## 🎯 Success Metrics

### Target Goals
- **Step 1 → Step 2 Conversion**: > 80%
- **Email Verification Rate**: > 70%
- **Profile Completion Rate**: > 90%
- **Overall Registration Success**: > 60%

### Continuous Improvement
1. **A/B Testing**: Test different email templates
2. **User Feedback**: Collect and analyze user feedback
3. **Performance Monitoring**: Track and optimize bottlenecks
4. **Error Analysis**: Monitor and fix common issues

---

This comprehensive two-step registration implementation provides a secure, user-friendly onboarding experience that maximizes registration completion rates while ensuring data quality and user verification.

**Ready for production deployment! 🚀**

---

*Implementation: January 2025*
*Version: 1.0.0*
*Components: 6 files*
*Database Tables: 5 tables*
