# Firebase Integration Guide

This guide explains the complete Firebase modular SDK setup, theme-aware routing, and Firestore integration added to this project.

## Setup Instructions

### 1. Firebase Project Configuration

Set up the following environment variables in `.env.local`:
{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/icons-material": "^7.3.6",
    "@mui/material": "^7.3.6",
    "@mui/x-charts": "^8.21.0",
    "axios": "^1.13.2",
    "firebase": "^10.13.2",
    "leaflet": "^1.9.4",
    "leaflet-routing-machine": "^3.2.12",
    "lucide-react": "^0.555.0",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "react-leaflet": "^5.0.0",
    "react-router-dom": "^7.10.1",
    "recharts": "^3.5.1",
    "@eslint/js": "9.39.1",
    "globals": "16.5.0",
    "typescript-eslint": "8.48.1",
    "@tailwindcss/vite": "4.1.17",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "tailwind-merge": "3.4.0",
    "tailwindcss-animate": "1.0.7",
    "rxjs": "7.8.2"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.21",
    "@types/leaflet-routing-machine": "^3.2.9",
    "@types/priorityqueuejs": "^1.0.4",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@typescript-eslint/eslint-plugin": "^8.48.1",
    "@typescript-eslint/parser": "^8.48.1",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.22",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "postcss": "^8.5.6",
    "priorityqueuejs": "^2.0.0",
    "tailwindcss": "^4.1.9",
    "typescript": "^5.9.3",
    "vite": "^7.2.6",
    "@types/node": "24.10.1"
  }
}

\`\`\`
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
\`\`\`

### 2. Architecture Overview

#### Firebase Client Initialization (`src/firebase/client.ts`)
- Modular SDK initialization with singleton pattern
- Automatic Firestore persistence enablement (IndexedDB fallback)
- Development emulator support for local testing
- Type-safe exports for Auth and Firestore instances

#### Custom Firebase Hooks

**useAuth Hook** (`src/hooks/useAuth.ts`)
- Real-time authentication state management with `onAuthStateChanged`
- Sign in, sign up, and sign out functionality
- Error handling with typed error messages
- No-dependency listener cleanup

**useCollection Hook** (`src/hooks/useCollection.ts`)
- Generic `<T extends DocumentData>` for type safety
- Real-time Firestore listeners with `onSnapshot`
- Query constraint support for filtering/ordering
- Automatic listener cleanup on unmount

**useDoc Hook** (`src/hooks/useDoc.ts`)
- Single document real-time listener pattern
- Null safety and proper error handling
- Conditional loading based on docId presence
- TypeScript generics for document data

#### Theme System (`src/context/ThemeContext.tsx`)
- System preference detection with `prefers-color-scheme` media query
- Explicit light/dark mode overrides with localStorage persistence
- MUI v5 `data-mui-color-scheme` attribute integration
- Smooth theme transitions and mode resolution
- `useTheme()` context hook for consuming components

**ThemeToggle Component** (`src/components/ThemeToggle.tsx`)
- Simple toggle button with icon rotation animation
- Dark mode awareness with Sun/Moon icons
- Accessible tooltip labels
- Fully responsive

### 3. Route Protection Pattern

The `ProtectedRoute` component now:
- Uses Firebase `useAuth()` hook for real-time auth state
- Falls back to AppContext for legacy authentication
- Preserves return path in location state for post-login redirect
- Shows loading spinner during auth state initialization
- Prevents route access until authentication is verified

\`\`\`typescript
// Usage in routes
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <ProtectedPage />
    </ProtectedRoute>
  }
/>
\`\`\`

### 4. SafeRoutes Page Theme Integration

The `SafeRoutes` page now:
- Responds to theme changes with dynamic color updates
- Uses `useTheme()` from context for real-time mode
- Applies theme colors to all MUI/Leaflet components
- Shows theme indicator in header (🌙/☀️)
- All map layers respect current theme palette

### 5. AppContext Migration to Firestore

The `AppContext` has been prepared for Firestore integration:

**Current State:**
- Still uses mock data for development
- All functions preserved for backward compatibility
- Ready for Firestore listener replacement

**Implementation Guide:**

\`\`\`typescript
// Example: Replace mock volunteers with Firestore listener
const { data: firestoreVolunteers, loading } = useCollection<Volunteer>('volunteers');

useEffect(() => {
  if (!loading) {
    setVolunteers(firestoreVolunteers);
  }
}, [firestoreVolunteers, loading]);

// Write operations with Firestore
const addEmergencyCase = async (case: EmergencyCase) => {
  const docRef = await addDoc(collection(db, 'emergencyCases'), {
    ...case,
    timestamp: serverTimestamp(),
    createdBy: user?.uid,
  });
  
  // Increment counter for analytics
  await updateDoc(doc(db, 'stats/emergencies'), {
    totalCount: increment(1),
    byPriority: {
      [case.priority]: increment(1),
    }
  });
};
\`\`\`

### 6. Firestore Persistence & Offline Support

The system automatically:
- Enables IndexedDB persistence for offline data access
- Falls back to memory cache if IndexedDB unavailable
- Handles persistence conflicts gracefully
- Warns in console on restricted environments (shared tabs)
- Provides stale-while-revalidate cache behavior

### 7. TypeScript Strict Mode

All new code enforces:
- Explicit function return types
- No implicit `any` types
- Proper null/undefined handling
- Generic type parameters for collections
- Document interface extensions

### 8. Listener Cleanup Strategy

Each custom hook automatically:
- Stores unsubscribe function from `onSnapshot`
- Calls cleanup in `useEffect` return
- Prevents memory leaks on component unmount
- Handles rapid subscriptions/unsubscriptions

\`\`\`typescript
useEffect(() => {
  let unsubscribe: Unsubscribe;
  
  try {
    unsubscribe = onSnapshot(query, (snapshot) => {
      // Handle data
    });
  } catch (err) {
    // Handle error
  }
  
  return () => {
    if (unsubscribe) unsubscribe(); // Cleanup
  };
}, [dependencies]);
\`\`\`

### 9. Migration Checklist

- [ ] Add Firebase environment variables
- [ ] Test Firebase initialization in console
- [ ] Verify theme toggle works with all pages
- [ ] Test protected routes with/without auth
- [ ] Implement Firestore write operations in AppContext
- [ ] Add real-time listeners using `useCollection` hook
- [ ] Test offline support with IndexedDB
- [ ] Verify listener cleanup with React DevTools
- [ ] Test theme persistence across page reloads
- [ ] Deploy and monitor Firestore usage

### 10. Best Practices

1. **Always use generics** for `useCollection<T>` and `useDoc<T>`
2. **Combine listeners** to minimize concurrent subscriptions
3. **Use Firestore transactions** for multi-document updates
4. **Implement pagination** for large collections
5. **Add security rules** before production deployment
6. **Use timestamps** for accurate event ordering
7. **Index queries** that don't use document ID
8. **Monitor Firestore pricing** based on read/write operations

### 11. Development with Emulators

To use Firebase Local Emulator Suite:

\`\`\`bash
# Start emulators
firebase emulators:start

# Environment variables automatically detected in development
# Auth emulator: localhost:9099
# Firestore emulator: localhost:8080
\`\`\`

The client automatically connects to emulators when `import.meta.env.DEV` is true.

## Troubleshooting

**Issue: "Multiple tabs open, persistence disabled"**
- Solution: Firestore persistence only works in one tab. This is expected behavior.

**Issue: Theme not updating globally**
- Ensure all components use `useTheme()` hook, not `useMuiTheme()`

**Issue: Listeners not cleaning up**
- Check that all `unsubscribe()` calls happen in useEffect return

**Issue: Firestore rules blocking reads**
- Verify security rules allow authenticated user reads
- Check authentication state is initialized before queries

## Additional Resources

- [Firebase Modular SDK](https://firebase.google.com/docs/web/modular)
- [Firestore Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [MUI Theme System](https://mui.com/material-ui/customization/theming/)
- [React Context Best Practices](https://react.dev/reference/react/useContext)
