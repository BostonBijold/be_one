# DAGM React Native - Quick Start Guide

## 🚀 Start Your App RIGHT NOW

### 1. Install Dependencies (if not done)
```bash
cd C:\Users\bosto\OneDrive\Desktop\DAGM\dagm-rn
npm install
```

### 2. Start Development Server
```bash
npm start
```

You should see:
```
▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄
  Expo Go is ready.

  Press i │ open iOS simulator
  Press a │ open Android emulator
  Press w │ open web
```

### 3. Run on iOS Simulator
Press `i` to open iOS simulator (requires Xcode)

**OR** run directly:
```bash
npm run ios
```

### 4. What You'll See
1. **Splash Screen** - AGM logo
2. **Login Screen** - "Be One" title with Google Sign-In button
3. *(Click button shows alert for now - Google Sign-In setup needed)*
4. Tap "OK" to dismiss
5. Develop without signing in (or skip to step 5)

### 5. Testing Without Google Sign-In (Development Mode)

Temporarily modify `login.tsx` to auto-login for testing:

Open: `app/(auth)/login.tsx`

Find this code (around line 50):
```typescript
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  setError(null);

  try {
    Alert.alert(
      'Sign In',
      'Google Sign-In will be implemented here...',
      [{ text: 'OK' }]
    );
  } catch (err: any) {
    ...
  } finally {
    setIsLoading(false);
  }
};
```

Replace with temporary test code:
```typescript
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  setError(null);

  try {
    // TODO: Remove this development-only code after testing
    // For now, we'll navigate to the app without actually signing in
    // In real usage, Google Sign-In would authenticate here

    // Simulate a signed-in user for testing
    // This will be replaced with actual Google Sign-In

    setIsLoading(false);
    // Note: Navigation happens automatically through auth state listener
  } catch (err: any) {
    console.error('Sign in error:', err);
    const errorMessage = err?.message || 'Failed to sign in. Please try again.';
    setError(errorMessage);
    Alert.alert('Sign In Failed', errorMessage);
  } finally {
    setIsLoading(false);
  }
};
```

**OR** modify root layout temporarily to skip auth for testing:

Open: `app/_layout.tsx`

Find (around line 45):
```typescript
{user ? (
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
) : (
  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
)}
```

Change to (for testing only):
```typescript
{/* For testing, always show tabs. Change back before submitting! */}
<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
```

Then restart app with `npm start`.

---

## 📱 Once You See the App

### Dashboard Tab
- Shows "Welcome back, User!"
- Today's Progress card with stats
- Lists your routines (Morning, Afternoon, Evening)
- Lists single habits
- Empty state if no routines/habits

### Habits Tab
- Add new habit button
- List of all habits
- Mark as complete/incomplete
- Delete standalone habits

### History Tab
- Date navigation (previous/next buttons)
- Shows habits and completions for selected date
- "Go to Today" button

### Settings Tab
- App info
- Sign out button (with confirmation)
- About section

---

## 🐛 If You Get Errors

### Module not found errors
```bash
npm install
npm start -- --clear
```

### NativeWind not working
- Clear cache: `npm start -- --clear`
- Restart simulator
- Check that `babel.config.js` has nativewind preset

### Can't open iOS simulator
- Make sure Xcode is installed
- Run: `xcode-select --install`
- Then try again: `npm run ios`

### Firebase connection issues
- Check `.env` has correct credentials
- Verify Firebase project exists
- Check Firestore is enabled in Firebase console

---

## 📋 Development Checklist

- [ ] npm install completed
- [ ] npm start runs without errors
- [ ] iOS simulator opens
- [ ] Login screen displays
- [ ] Dashboard loads with tabs
- [ ] Can navigate between tabs
- [ ] Settings screen has sign out button

---

## 🎯 Next: Setup Google Sign-In

Once you're comfortable with the app:

1. Read `SETUP_GUIDE.md` for Google Sign-In native setup
2. Install native package: `npx expo install @react-native-google-signin/google-signin`
3. Configure in Firebase console
4. Update login screen with real Google authentication
5. Test full auth flow

---

## 📚 Important Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | App entry, conditional auth routing |
| `app/(auth)/login.tsx` | Login screen, Google Sign-In button |
| `app/(tabs)/_layout.tsx` | Tab navigation setup |
| `app/(tabs)/index.tsx` | Dashboard with progress and routines |
| `hooks/useAuth.ts` | Get current user |
| `hooks/useData.ts` | Get routines, habits, daily data |
| `services/dataService.ts` | All Firebase Firestore operations |
| `.env` | Firebase credentials |

---

## 💡 Tips

1. **Hot Reload**: Changes auto-reload in simulator (most of the time)
2. **Full Refresh**: If stuck, press `r` in terminal to reload
3. **Clear Cache**: `npm start -- --clear` fixes most cache issues
4. **Debug**: Open React Native Debugger with Cmd+D (iOS) or Cmd+M (Android)

---

## 🚀 You're All Set!

Your React Native app is ready to develop on. Explore, make changes, test on your iPhone simulator!

**Questions?** Check:
- `UI_IMPLEMENTATION_SUMMARY.md` - What was built
- `SETUP_GUIDE.md` - How to add Google Sign-In
- `MIGRATION_PROGRESS.md` - Architecture details
- `README.md` - General info

**Let's build! 🎉**

