# EmekPay

A modern service marketplace mobile application built with React Native, Expo, and Supabase.

## 🚀 Features

- **User Authentication**: Secure login/signup with email and password
- **Service Marketplace**: Post and discover local services
- **Point-Based Economy**: Earn and spend points for services
- **Real-time Messaging**: Chat with service providers
- **Profile Management**: Complete user profiles and manage services
- **Booking System**: Schedule and manage service bookings
- **Wallet Management**: Track points and transaction history

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Navigation**: Expo Router
- **Styling**: Custom theme with consistent design system

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emekpay
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**

   a. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

   b. Fill in your environment variables in `.env.local`:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

## 📱 Running the App

- **iOS**: Press `i` in the terminal or scan QR code with Camera app
- **Android**: Press `a` in the terminal or scan QR code with Expo Go
- **Web**: Press `w` in the terminal

## 🗂️ Project Structure

```
emekpay/
├── app/                    # App screens and navigation
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── supabase.ts        # Supabase client
│   └── theme.ts           # App theme and colors
├── assets/                # Images and icons
├── .env.example           # Environment variables template
└── app.json               # Expo configuration
```

## 🔒 Security & Environment

### Environment Variables

This project uses environment variables to keep sensitive information secure. Never commit actual API keys or secrets to version control.

**Required Variables:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)

### Git Security

The `.gitignore` file is configured to exclude:
- Environment files (`.env*`)
- Build artifacts
- IDE configurations
- OS-specific files
- Node modules
- Database files
- API keys and secrets

## 🚀 Deployment

### Building for Production

1. **Configure EAS Build** (if using EAS)
   ```bash
   npx eas build:configure
   ```

2. **Build for platforms**
   ```bash
   # iOS
   npx eas build --platform ios

   # Android
   npx eas build --platform android
   ```

### Environment for Production

Create a `.env.production` file with production values:
```env
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
# ... other production variables
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📚 API Documentation

The app integrates with Supabase for:
- **Authentication**: User signup/login/logout
- **Database**: Users, services, bookings, transactions
- **Real-time**: Live updates for messages and bookings
- **Storage**: File uploads for profile pictures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

## 🔄 Recent Updates

- ✅ **Main Menu Implementation**: Complete main menu with 8 navigation options
- ✅ **Design Consistency**: Unified theme across all screens
- ✅ **Security Enhancement**: Environment variables and comprehensive .gitignore
- ✅ **Navigation Fix**: Resolved Expo Router conflicts
- ✅ **User Experience**: Smooth transitions and responsive design

---

**Built with ❤️ for the EmekPay community**